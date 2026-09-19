import { HelpCircle } from "lucide-react";
import InfoPageLayout from "@/components/info/InfoPageLayout";
import HelpDocs from "@/components/help/HelpDocs";

const HelpCenterPage = () => {
  return (
    <InfoPageLayout
      badge="Support"
      badgeIcon={<HelpCircle className="h-4 w-4" />}
      title="Help & Documentation"
      description="Step-by-step guides for every Publioxa feature, with links straight to each action."
    >
      <HelpDocs embedded />
    </InfoPageLayout>
  );
};

export default HelpCenterPage;
