import { Check, Star, Instagram, Linkedin, Twitter, Facebook, Music } from "lucide-react";

const features = [
  "AI generates a full month of content in 4 minutes",
  "Publish to Instagram, LinkedIn, Twitter & more automatically",
  "Save 15+ hours every single week",
];

const AuthBrandPanel = () => (
  <div className="relative hidden h-full overflow-hidden gradient-bg lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
    {/* Decorative orbs */}
    <div className="pointer-events-none absolute -left-20 top-20 h-60 w-60 rounded-full bg-primary-foreground/5 blur-[80px]" />
    <div className="pointer-events-none absolute -right-10 bottom-20 h-40 w-40 rounded-full bg-primary-foreground/5 blur-[60px]" />
    <div className="pointer-events-none absolute left-1/4 top-1/3 h-3 w-3 rounded-full bg-primary-foreground/20" />
    <div className="pointer-events-none absolute right-1/3 bottom-1/4 h-2 w-2 rounded-full bg-primary-foreground/15" />

    <h2 className="relative max-w-md text-center font-heading text-3xl font-bold leading-tight text-primary-foreground">
      Join 2,847+ businesses already growing with Flowo
    </h2>

    <div className="relative mt-8 space-y-4">
      {features.map((f, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20">
            <Check className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-body text-sm text-primary-foreground">{f}</span>
        </div>
      ))}
    </div>

    {/* Testimonial */}
    <div className="relative mt-10 max-w-sm rounded-[16px] bg-primary-foreground/15 p-5 backdrop-blur-sm">
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="mt-3 font-body text-sm italic text-primary-foreground/90">
        "Flowo saved my business. I went from posting twice a month to posting every single day."
      </p>
      <p className="mt-3 font-heading text-sm font-bold text-primary-foreground">Sarah Mitchell</p>
      <p className="font-body text-xs text-primary-foreground/70">Owner, Bloom Skincare Co</p>
    </div>

    {/* Platform icons */}
    <div className="relative mt-8 flex items-center gap-4">
      {[Instagram, Linkedin, Twitter, Facebook, Music].map((Icon, i) => (
        <Icon key={i} className="h-5 w-5 text-primary-foreground/60" />
      ))}
    </div>
  </div>
);

export default AuthBrandPanel;
