import {
  listAdminPromotionalBanners,
  listAllHomepageSections,
} from "@/services/content.service";
import { ContentManager } from "@/components/admin/content-manager";

export default async function AdminContentPage() {
  const [sections, banners] = await Promise.all([
    listAllHomepageSections(),
    listAdminPromotionalBanners(),
  ]);

  return (
    <ContentManager initialSections={sections} initialBanners={banners} />
  );
}
