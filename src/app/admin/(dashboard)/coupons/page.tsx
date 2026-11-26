import { listAdminCoupons } from "@/services/coupon.service";
import { CouponsManager } from "@/components/admin/coupons-manager";

export default async function AdminCouponsPage() {
  const coupons = await listAdminCoupons();

  return (
    <CouponsManager
      initialCoupons={coupons.map((c) => ({
        ...c,
        startsAt: c.startsAt ? c.startsAt.toISOString() : null,
        expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      }))}
    />
  );
}
