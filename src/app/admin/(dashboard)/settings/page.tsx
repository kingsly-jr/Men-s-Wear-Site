import { getStoreSettings } from "@/services/settings.service";
import { SettingsManager } from "@/components/admin/settings-manager";

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();
  return <SettingsManager initialSettings={settings} />;
}
