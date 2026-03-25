"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useStoreContext } from "@/lib/store-context";
import type {
  CategoryRow,
  QrChannelRow,
  SettingsActionResult,
} from "@/lib/actions/settingsActions";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
  updateStoreSettingsAction,
  createQrChannelAction,
  toggleQrChannelAction,
  deleteQrChannelAction,
} from "@/lib/actions/settingsActions";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import {
  FormField,
  FormLabel,
  FormInput,
  FormSelect,
  FormTextarea,
  FormError,
} from "@/components/ui/form";
import { cn } from "@/lib/utils/cn";
import { Plus } from "lucide-react";

interface StoreData {
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
}

interface SettingsClientProps {
  qrChannels: QrChannelRow[];
  categories: CategoryRow[];
  storeId: string;
  role: "owner" | "manager" | "cashier" | "viewer";
  store: StoreData;
}

const TABS = ["general", "categories", "qr_channels"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  general: "General",
  categories: "Categories",
  qr_channels: "QR Channels",
};

export default function SettingsClient({
  qrChannels,
  categories,
  storeId,
  role,
  store,
}: SettingsClientProps) {
  const ctx = useStoreContext();
  const [activeTab, setActiveTab] = useState<Tab>("general");

  return (
    <section className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your store configuration and team"
      />

      <div className="border-b border-neutral-200">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                `h-auto rounded-none border-b-2 px-1 pb-3 text-sm hover:bg-transparent transition cursor-pointer`,
                activeTab === tab
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-neutral-500 hover:text-neutral-800",
              )}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "general" && (
        <GeneralSettingsTab
          store={store}
          storeId={storeId}
          role={role}
          storeName={ctx.storeName}
        />
      )}
      {activeTab === "categories" && (
        <CategoriesTab categories={categories} storeId={storeId} role={role} />
      )}
      {activeTab === "qr_channels" && (
        <QrChannelsTab channels={qrChannels} storeId={storeId} role={role} />
      )}
    </section>
  );
}

// ─── General Settings ─────────────────────────────────────────────────────────

function GeneralSettingsTab({
  store,
  storeId,
  role,
}: {
  store: StoreData;
  storeId: string;
  role: string;
  storeName: string;
}) {
  const isOwner = role === "owner";
  const [state, formAction, isPending] = useActionState<
    SettingsActionResult,
    FormData
  >(updateStoreSettingsAction, { data: null, error: null });

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="storeId" value={storeId} />

      <SectionCard title="Store Details" bodyClassName="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField>
            <FormLabel htmlFor="name" required>
              Store Name
            </FormLabel>
            <FormInput
              id="name"
              name="name"
              defaultValue={store.name}
              disabled={!isOwner}
              required
            />
          </FormField>
          <FormField>
            <FormLabel htmlFor="taxRate">Tax Rate (%)</FormLabel>
            <FormInput
              id="taxRate"
              name="taxRate"
              type="number"
              min={0}
              max={100}
              step={0.01}
              defaultValue={store.tax_rate}
              disabled={!isOwner}
            />
          </FormField>
        </div>
        <FormField>
          <FormLabel htmlFor="address">Address</FormLabel>
          <FormTextarea
            id="address"
            name="address"
            defaultValue={store.address ?? ""}
            disabled={!isOwner}
            rows={2}
          />
        </FormField>
      </SectionCard>

      <SectionCard title="Currency" bodyClassName="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField>
            <FormLabel htmlFor="currencyCode">Code (ISO 4217)</FormLabel>
            <FormInput
              id="currencyCode"
              name="currencyCode"
              defaultValue={store.currency_code}
              disabled={!isOwner}
              maxLength={3}
              placeholder="THB"
              className="uppercase"
            />
          </FormField>
          <FormField>
            <FormLabel htmlFor="currencySymbol">Symbol</FormLabel>
            <FormInput
              id="currencySymbol"
              name="currencySymbol"
              defaultValue={store.currency_symbol}
              disabled={!isOwner}
              maxLength={10}
              placeholder="฿"
            />
          </FormField>
          <FormField>
            <FormLabel htmlFor="currencyDecimals">Decimal Places</FormLabel>
            <FormInput
              id="currencyDecimals"
              name="currencyDecimals"
              type="number"
              min={0}
              max={4}
              defaultValue={store.currency_decimals}
              disabled={!isOwner}
            />
          </FormField>
          <FormField>
            <FormLabel htmlFor="symbolPosition">Symbol Position</FormLabel>
            <FormSelect
              id="symbolPosition"
              name="symbolPosition"
              defaultValue={store.symbol_position}
              disabled={!isOwner}
            >
              <option value="prefix">Prefix (฿100)</option>
              <option value="suffix">Suffix (100฿)</option>
            </FormSelect>
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Receipt" bodyClassName="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField>
            <FormLabel htmlFor="receiptHeader">Header message</FormLabel>
            <FormTextarea
              id="receiptHeader"
              name="receiptHeader"
              defaultValue={store.receipt_header ?? ""}
              disabled={!isOwner}
              rows={2}
              placeholder="e.g. Thank you for shopping with us!"
            />
          </FormField>
          <FormField>
            <FormLabel htmlFor="receiptFooter">Footer note</FormLabel>
            <FormTextarea
              id="receiptFooter"
              name="receiptFooter"
              defaultValue={store.receipt_footer ?? ""}
              disabled={!isOwner}
              rows={2}
              placeholder="e.g. No refunds after 7 days"
            />
          </FormField>
        </div>
      </SectionCard>

      <FormError message={state.error} />

      {isOwner && (
        <div className="flex justify-end">
          <Button type="submit" isLoading={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      )}
    </form>
  );
}

// ─── Categories ─────────────────────────────────────────────────────────────

function CategoriesTab({
  categories,
  storeId,
  role,
}: {
  categories: CategoryRow[];
  storeId: string;
  role: string;
}) {
  const canManage = ["owner", "manager"].includes(role);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [createState, createAction, isCreating] = useActionState<
    SettingsActionResult,
    FormData
  >(createCategoryAction, { data: null, error: null });
  const [updateState, updateAction] = useActionState<
    SettingsActionResult,
    FormData
  >(updateCategoryAction, { data: null, error: null });
  const [, startTransition] = useTransition();

  const nextSortOrder =
    categories.length > 0
      ? Math.max(...categories.map((category) => category.sort_order)) + 1
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">
            Product Categories
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            Configure product types used in inventory forms and filters.
          </p>
        </div>
        {canManage && (
          <Button
            icon={<Plus size={16} />}
            onClick={() => setShowAddCategoryModal(true)}
          >
            Add category
          </Button>
        )}
      </div>

      {canManage && (
        <Modal
          open={showAddCategoryModal}
          onClose={() => setShowAddCategoryModal(false)}
          size="md"
        >
          <ModalHeader
            title="Add Category"
            description="Create a new category for inventory and product filtering."
            onClose={() => setShowAddCategoryModal(false)}
          />
          <form action={createAction} className="space-y-0">
            <ModalBody className="space-y-4">
              <input type="hidden" name="storeId" value={storeId} />

              <FormField>
                <FormLabel htmlFor="categoryName" required>
                  Name
                </FormLabel>
                <FormInput
                  id="categoryName"
                  name="name"
                  required
                  maxLength={80}
                  placeholder="e.g. Beverages"
                />
              </FormField>

              <FormField>
                <FormLabel htmlFor="categorySortOrder">Sort Order</FormLabel>
                <FormInput
                  id="categorySortOrder"
                  name="sortOrder"
                  type="number"
                  min={0}
                  max={9999}
                  defaultValue={nextSortOrder}
                />
              </FormField>

              <FormError message={createState.error} />
            </ModalBody>

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddCategoryModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                isLoading={isCreating}
              >
                Add category
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {categories.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-neutral-500">
            No categories yet. Add one to organize product types.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {categories.map((category) => (
              <form
                key={category.id}
                action={updateAction}
                className="px-4 py-3"
              >
                <input type="hidden" name="storeId" value={storeId} />
                <input type="hidden" name="categoryId" value={category.id} />
                <div className="grid gap-3 sm:grid-cols-[1fr_130px_auto]">
                  <FormInput
                    name="name"
                    defaultValue={category.name}
                    disabled={!canManage}
                    required
                    maxLength={80}
                  />
                  <FormInput
                    name="sortOrder"
                    type="number"
                    min={0}
                    max={9999}
                    defaultValue={category.sort_order}
                    disabled={!canManage}
                  />
                  <div className="flex items-center justify-end gap-2">
                    {canManage && (
                      <>
                        <Button type="submit" variant="outline" size="sm">
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            startTransition(() => {
                              if (
                                confirm(`Delete category "${category.name}"?`)
                              ) {
                                deleteCategoryAction(category.id, storeId);
                              }
                            })
                          }
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </form>
            ))}
          </div>
        )}
      </div>

      {updateState.error && (
        <p className="text-xs text-danger-700">{updateState.error}</p>
      )}
    </div>
  );
}

// ─── QR Channels ─────────────────────────────────────────────────────────────

function QrChannelsTab({
  channels,
  storeId,
  role,
}: {
  channels: QrChannelRow[];
  storeId: string;
  role: string;
}) {
  const isOwner = role === "owner";
  const [showAddModal, setShowAddModal] = useState(false);
  const [hasSubmittedCreate, setHasSubmittedCreate] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [createState, createAction, isCreating] = useActionState<
    SettingsActionResult,
    FormData
  >(createQrChannelAction, { data: null, error: null });
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!hasSubmittedCreate || isCreating || createState.error) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowAddModal(false);
      setHasSubmittedCreate(false);
      setSelectedFileName("");
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl("");
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [createState.error, hasSubmittedCreate, imagePreviewUrl, isCreating]);

  const resetAddModalState = () => {
    setShowAddModal(false);
    setHasSubmittedCreate(false);
    setSelectedFileName("");
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">
            QR Transfer Channels
          </h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Upload QR code images for PromptPay, TrueMoney, bank QR, etc.
          </p>
        </div>
        {isOwner && (
          <Button
            icon={<Plus size={16} />}
            onClick={() => setShowAddModal(true)}
          >
            Add channel
          </Button>
        )}
      </div>

      <Modal open={showAddModal} onClose={resetAddModalState} size="lg">
        <ModalHeader
          title="New QR Channel"
          description="Add a label and upload an image that customers can scan at checkout."
          onClose={resetAddModalState}
        />
        <form
          action={createAction}
          onSubmit={() => setHasSubmittedCreate(true)}
          className="space-y-0"
        >
          <ModalBody className="space-y-4">
            <input type="hidden" name="storeId" value={storeId} />

            <FormField>
              <FormLabel htmlFor="label" required>
                Label
              </FormLabel>
              <FormInput
                id="label"
                name="label"
                required
                placeholder="e.g. PromptPay"
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="imageFile" required>
                QR image
              </FormLabel>
              <input
                id="imageFile"
                name="imageFile"
                type="file"
                accept="image/*"
                required
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0] ?? null;
                  setSelectedFileName(file?.name ?? "");

                  if (imagePreviewUrl) {
                    URL.revokeObjectURL(imagePreviewUrl);
                    setImagePreviewUrl("");
                  }

                  if (file) {
                    setImagePreviewUrl(URL.createObjectURL(file));
                  }
                }}
                className="block w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-700 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
              />
              <p className="mt-1 text-xs text-neutral-500">
                PNG, JPG, or WEBP up to 5MB.
              </p>
            </FormField>

            {selectedFileName && imagePreviewUrl && (
              <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
                <p className="text-xs font-medium text-neutral-700">
                  Selected file
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {selectedFileName}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreviewUrl}
                  alt="QR image preview"
                  className="mt-3 max-h-40 rounded-md border border-neutral-200 bg-white object-contain"
                />
              </div>
            )}

            <FormError message={createState.error} />
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={resetAddModalState}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating} isLoading={isCreating}>
              Add channel
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {channels.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 py-12 text-center">
          <p className="text-neutral-500 text-sm">No QR channels yet.</p>
          {isOwner && (
            <p className="text-neutral-400 text-xs mt-1">
              Add a channel to enable QR Transfer payments.
            </p>
          )}
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
          {channels.map((ch) => (
            <div key={ch.id} className="flex items-center gap-4 px-5 py-4">
              <div className="h-12 w-12 rounded-lg border border-neutral-200 overflow-hidden shrink-0 bg-neutral-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ch.image_url}
                  alt={ch.label}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900 text-sm">
                  {ch.label}
                </p>
                <p className="text-xs text-neutral-400 truncate">
                  {ch.image_url}
                </p>
              </div>
              <span
                className={cn(
                  `text-xs px-2 py-0.5 rounded-full`,
                  ch.is_enabled
                    ? "bg-success-100 text-success-700"
                    : "bg-neutral-100 text-neutral-500",
                )}
              >
                {ch.is_enabled ? "Active" : "Disabled"}
              </span>
              {isOwner && (
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(() => {
                        toggleQrChannelAction(ch.id, storeId, !ch.is_enabled);
                      })
                    }
                    className={cn(
                      `relative inline-flex h-5 w-9 rounded-full p-0 cursor-pointer transition`,
                      ch.is_enabled
                        ? "bg-brand-600 hover:bg-brand-700"
                        : "bg-neutral-300 hover:bg-neutral-400",
                    )}
                  >
                    <span
                      className={cn(
                        `inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform`,
                        ch.is_enabled ? "translate-x-4.5" : "translate-x-0.5",
                      )}
                    />
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      startTransition(() => {
                        if (confirm(`Delete "${ch.label}"?`)) {
                          deleteQrChannelAction(ch.id, storeId);
                        }
                      })
                    }
                    className={cn(
                      "h-auto px-0 text-xs text-danger-600 hover:text-danger-800",
                    )}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
