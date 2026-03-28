import { createClient } from "@/lib/supabase/server";

import type { QrChannel } from "@/components/pos/QrPaymentScreen";
import type { PosProduct } from "@/components/pos/ProductGrid";
import type { BnplAccountSummary } from "@/lib/types/bnpl";

export async function getPosPageData({
  userId,
  storeId,
}: {
  userId: string;
  storeId: string;
}) {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("store_members")
    .select("store_id, role")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!membership?.store_id) return null;

  const [productsResult, qrChannelsResult, bnplAccountsResult] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          "id, name, price, stock_qty, image_url, category_id, barcode, sku, categories(name)",
        )
        .eq("store_id", storeId)
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("qr_channels")
        .select("id, label, image_url, is_enabled")
        .eq("store_id", storeId)
        .eq("is_enabled", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("bnpl_accounts")
        .select(
          "id, customer_name, customer_phone, credit_limit, balance_due, status, notes, created_at",
        )
        .eq("store_id", storeId)
        .order("created_at", { ascending: false }),
    ]);

  const canCreateBnplAccount = ["owner", "manager"].includes(membership.role);

  const products: PosProduct[] = (productsResult.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stock_qty: p.stock_qty,
    image_url: p.image_url,
    category_id: p.category_id,
    category_name:
      (p.categories as { name: string } | null)?.name ?? null,
    barcode: p.barcode,
    sku: p.sku,
  }));

  return {
    canCreateBnplAccount,
    products,
    qrChannels: (qrChannelsResult.data ?? []) as QrChannel[],
    bnplAccounts: (bnplAccountsResult.data ?? []) as BnplAccountSummary[],
  };
}
