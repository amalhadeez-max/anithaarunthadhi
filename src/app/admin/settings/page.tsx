import { getSiteSettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <PageHeader
        title="Site Settings"
        description="Branding, hero video, content, contact details, delivery and payment options."
      />
      <SettingsForm settings={settings} />
    </>
  );
}
