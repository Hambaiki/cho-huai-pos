import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PosTerminal } from "@/components/pos/PosTerminal";
import type { QrChannel } from "@/components/pos/QrPaymentScreen";
import type { BnplAccountSummary } from "@/lib/types/bnpl";

interface PosProductRow {
  id: string;
  name: string;
  price: number;
  stock_qty: number;
  image_url: string | null;
  category_id: string | null;
  categories: { name: string } | null;
  barcode: string | null;
  sku: string | null;
}

export default async function PosPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: membership } = await supabase
    .from("store_members")
    .select("store_id, role")
    .eq("user_id", user.id)
    .eq("store_id", storeId)
    .single();

  if (!membership?.store_id) redirect("/dashboard");

  const [productsResult, qrChannelsResult, bnplAccountsResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, price, stock_qty, image_url, category_id, barcode, sku, categories(name)")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .returns<PosProductRow[]>(),
    supabase
      .from("qr_channels")
      .select("id, label, image_url, is_enabled")
      .eq("store_id", storeId)
      .eq("is_enabled", true)
      .order("sort_order", { ascending: true })
      .returns<QrChannel[]>(),
    supabase
      .from("bnpl_accounts")
      .select(
        "id, customer_name, phone:customer_phone, credit_limit, balance_due, status, notes, created_at",
      )
      .eq("store_id", storeId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <PosTerminal
      bnplAccounts={(bnplAccountsResult.data ?? []) as BnplAccountSummary[]}
      canCreateBnplAccount={["owner", "manager"].includes(membership?.role ?? "")}
      products={(productsResult.data ?? []).map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        stock_qty: product.stock_qty,
        image_url: product.image_url,
        category_id: product.category_id,
        category_name: product.categories?.name ?? null,
        barcode: product.barcode,
        sku: product.sku,
      }))}
      qrChannels={qrChannelsResult.data ?? []}
    />
  );
}
