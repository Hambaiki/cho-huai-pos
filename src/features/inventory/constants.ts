export const INCREASE_REASONS: readonly { value: string; label: string }[] = [
  { value: "return", label: "Return" },
  { value: "correction", label: "Correction" },
  { value: "initial", label: "Initial" },
] as const;

export const DECREASE_REASONS: readonly { value: string; label: string }[] = [
  { value: "damage", label: "Damage" },
  { value: "loss", label: "Loss" },
  { value: "correction", label: "Correction" },
] as const;

export const REASON_LABELS: Record<string, string> = {
  purchase: "Purchase",
  return: "Return",
  damage: "Damage",
  loss: "Loss",
  correction: "Correction",
  initial: "Initial",
};

export const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export const STOCK_STATUS_OPTIONS = [
  { label: "In Stock", value: "in_stock" },
  { label: "Low Stock", value: "low_stock" },
  { label: "Out of Stock", value: "out_of_stock" },
];
