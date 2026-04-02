import { BnplAccountSummary } from "./types";

export function dedupeBnplAccounts(accounts: BnplAccountSummary[]) {
  const seen = new Set<string>();
  return accounts.filter((account) => {
    if (seen.has(account.id)) return false;
    seen.add(account.id);
    return true;
  });
}

export function getDefaultBnplDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}
