import { getAdminDashboardAnalytics } from "@/services/analytics.service";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";

export default async function AdminOverviewPage() {
  const initialData = await getAdminDashboardAnalytics({ days: 30 });
  return <AnalyticsDashboard initialData={initialData} />;
}
