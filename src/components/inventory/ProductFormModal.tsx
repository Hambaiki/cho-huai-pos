"use client";

import { useActionState, useRef } from "react";
import { createProductAction, updateProductAction } from "@/lib/actions/products";
import { useStoreContext } from "@/lib/store-context";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  costPrice: number | null;
  stockQty: number;
  lowStockAt: number;
  unit: string;
  categoryId: string | null;
}

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  product?: Product;
  onSuccess?: () => void;
}

export function ProductFormModal({
  open,
  onClose,
  product,
  onSuccess,
}: ProductFormModalProps) {
  const store = useStoreContext();
  const isEdit = !!product;
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    const data = {
      name: formData.get("name") as string,
      sku: (formData.get("sku") as string) || undefined,
      barcode: (formData.get("barcode") as string) || undefined,
      price: parseFloat(formData.get("price") as string),
      costPrice: formData.get("costPrice")
        ? parseFloat(formData.get("costPrice") as string)
        : undefined,
      stockQty: parseInt(formData.get("stockQty") as string, 10),
      lowStockAt: parseInt(formData.get("lowStockAt") as string, 10),
      unit: (formData.get("unit") as string) || "pc",
      categoryId: (formData.get("categoryId") as string) || undefined,
    };

    if (isEdit) {
      await updateProductAction(product!.id, data);
    } else {
      await createProductAction(store.storeId, data);
    }
  };

  const [state, formAction, isPending] = useActionState(
    async (
      _prevState: { data: null; error: null },
      formData: FormData,
    ) => {
      await handleSubmit(formData);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
      return { data: null, error: null };
    },
    { data: null, error: null },
  );

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader
        title={isEdit ? "Edit Product" : "Add New Product"}
        description={isEdit ? product?.name : "Create a new product for your store inventory"}
        onClose={onClose}
      />

      <form ref={formRef} action={formAction}>
        <ModalBody className="space-y-6">
          {state?.error && (
            <div className="rounded-lg bg-danger-50 px-4 py-3 text-danger-700">
              {state.error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
                Product Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="e.g., Thai Iced Tea"
                defaultValue={product?.name || ""}
                required
                className="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 text-neutral-900 placeholder-neutral-400 outline-none transition focus:ring-2 focus:ring-brand-200"
              />
            </div>

            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-neutral-700">
                SKU
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                placeholder="e.g., THAI-ICE-001"
                defaultValue={product?.sku || ""}
                className="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 text-neutral-900 placeholder-neutral-400 outline-none transition focus:ring-2 focus:ring-brand-200"
              />
            </div>

            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-neutral-700">
                Barcode
              </label>
              <input
                type="text"
                id="barcode"
                name="barcode"
                placeholder="e.g., 123456789"
                defaultValue={product?.barcode || ""}
                className="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 text-neutral-900 placeholder-neutral-400 outline-none transition focus:ring-2 focus:ring-brand-200"
              />
            </div>

            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-neutral-700">
                Unit *
              </label>
              <input
                type="text"
                id="unit"
                name="unit"
                placeholder="e.g., pc, cup, box"
                defaultValue={product?.unit || "pc"}
                required
                className="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 text-neutral-900 placeholder-neutral-400 outline-none transition focus:ring-2 focus:ring-brand-200"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-neutral-700">
                Selling Price *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={product?.price || 0}
                required
                className="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 text-neutral-900 placeholder-neutral-400 outline-none transition focus:ring-2 focus:ring-brand-200"
              />
            </div>

            <div>
              <label htmlFor="costPrice" className="block text-sm font-medium text-neutral-700">
                Cost Price
              </label>
              <input
                type="number"
                id="costPrice"
                name="costPrice"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={product?.costPrice || ""}
                className="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 text-neutral-900 placeholder-neutral-400 outline-none transition focus:ring-2 focus:ring-brand-200"
              />
            </div>

            <div>
              <label htmlFor="stockQty" className="block text-sm font-medium text-neutral-700">
                Stock Qty *
              </label>
              <input
                type="number"
                id="stockQty"
                name="stockQty"
                min="0"
                step="1"
                placeholder="0"
                defaultValue={product?.stockQty || 0}
                required
                className="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 text-neutral-900 placeholder-neutral-400 outline-none transition focus:ring-2 focus:ring-brand-200"
              />
            </div>

            <div>
              <label htmlFor="lowStockAt" className="block text-sm font-medium text-neutral-700">
                Low Stock Alert At *
              </label>
              <input
                type="number"
                id="lowStockAt"
                name="lowStockAt"
                min="0"
                step="1"
                placeholder="5"
                defaultValue={product?.lowStockAt || 5}
                required
                className="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 text-neutral-900 placeholder-neutral-400 outline-none transition focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-200 px-4 py-2 font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "rounded-md px-4 py-2 font-medium transition-colors",
              isPending
                ? "bg-brand-300 text-brand-700 cursor-not-allowed"
                : "bg-brand-600 text-white hover:bg-brand-700",
            )}
          >
            {isPending ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
