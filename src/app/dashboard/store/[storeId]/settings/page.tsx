import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getQrChannels,
} from "@/lib/actions/settingsActions";
import SettingsClient from "@/components/settings/SettingsClient";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage({
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
    redirect("/login");
  }

  const { data: membershipRow } = await supabase
    .from("store_members")
    .select(
      "store_id, role, stores(id, name, address, tax_rate, receipt_header, receipt_footer, currency_code, currency_symbol, currency_decimals, symbol_position)",
    )
    .eq("user_id", user.id)
    .eq("store_id", storeId)
    .single();

  if (!membershipRow?.store_id) {
    redirect("/dashboard");
  }
  const storeRow = (membershipRow.stores as unknown) as {
    id: string;
    name: string;
    address: string | null;
    tax_rate: number;
    receipt_header: string | null;
    receipt_footer: string | null;
    currency_code: string;
    currency_symbol: string;
    currency_decimals: number;
    symbol_position: "prefix" | "suffix";
  } | null;

  if (!storeRow) redirect("/dashboard");

  const qrChannels = await getQrChannels(storeId);

  return (
    <SettingsClient
      qrChannels={qrChannels}
      storeId={storeId}
      role={membershipRow.role as "owner" | "manager" | "cashier" | "viewer"}
      store={storeRow}
    />
  );
}

