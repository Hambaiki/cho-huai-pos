import { getCurrentUser } from "@/features/auth/queries";
import { InventoryDetailClient } from "@/features/inventory/components/InventoryDetailClient";
import { getInventoryDetailData } from "@/features/inventory/queries";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeId: string; id: string }>;
}) {
  const { id, storeId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("name")
    .eq("id", id)
    .eq("store_id", storeId)
    .maybeSingle();
  return { title: data?.name ?? "Product Detail" };
}

export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ storeId: string; id: string }>;
}) {
  const { storeId, id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getInventoryDetailData({
    userId: user.id,
    storeId,
    productId: id,
  });

  if (!data) redirect("/dashboard");
  if (!data.product) notFound();

  return (
    <div className="space-y-6">
      <InventoryDetailClient
        storeId={storeId}
        product={data.product}
        categories={data.categories}
        lots={data.lots}
        adjustments={data.adjustments}
        canManage={data.canManage}
      />
    </div>
  );
}
