export type BnplAccountSummary = {
  id: string;
  customer_name: string;
  phone: string | null;
  credit_limit: number;
  balance_due: number;
  status: "active" | "frozen" | "closed" | "settled";
  notes: string | null;
  created_at: string;
};