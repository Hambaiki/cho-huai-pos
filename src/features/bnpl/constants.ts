import { AccountStatus } from "./types";

export const STATUS_OPTIONS: AccountStatus[] = [
  "active",
  "frozen",
  "closed",
  "settled",
] as const;

export const INSTALLMENT_LIST_PAGE_SIZE = 10;
