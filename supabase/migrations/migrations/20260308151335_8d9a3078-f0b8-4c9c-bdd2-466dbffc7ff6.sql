
-- Create storage bucket for generated images
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Users can upload generated images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'generated-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to view their own images
CREATE POLICY "Users can view own generated images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'generated-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access for sharing
CREATE POLICY "Public can view generated images"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'generated-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own generated images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'generated-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Gallery metadata table
CREATE TABLE public.generated_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  image_type TEXT NOT NULL DEFAULT 'freeform',
  platform TEXT,
  style TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own generated images"
ON public.generated_images FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
