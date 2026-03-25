"use client";

import { useActionState, useRef } from "react";
import { createProductAction, updateProductAction } from "@/lib/actions/products";
import { compressImageForUpload } from "@/lib/utils/image-compression";
import { useStoreContext } from "@/lib/store-context";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  FormLabel,
  FormInput,
  FormSelect,
  FormError,
} from "@/components/ui/form";

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
  imageUrl: string | null;
}

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  product?: Product;
  categories: Array<{ value: string; label: string }>;
  onSuccess?: () => void;
}

export function ProductFormModal({
  open,
  onClose,
  product,
  categories,
  onSuccess,
}: ProductFormModalProps) {
  const store = useStoreContext();
  const isEdit = !!product;
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(
    async (
      _prevState: { data: null; error: string | null },
      formData: FormData,
    ) => {
      const imageValue = formData.get("imageFile");
      if (imageValue instanceof File && imageValue.size > 0) {
        const compressedImage = await compressImageForUpload(imageValue);
        formData.set("imageFile", compressedImage);
      }

      const result = isEdit
        ? await updateProductAction(product!.id, formData)
        : await createProductAction(store.storeId, formData);

      if (result.error) {
        return { data: null, error: result.error };
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
      return { data: null, error: null };
    },
    { data: null, error: null as string | null },
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
          <FormError message={state?.error} />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField className="sm:col-span-2">
              <FormLabel htmlFor="imageFile">Item Image</FormLabel>
              <FormInput
                id="imageFile"
                name="imageFile"
                type="file"
                accept="image/*"
              />
              <p className="mt-1 text-xs text-neutral-500">Optional. Max file size 5MB.</p>

              {product?.imageUrl ? (
                <div className="mt-3 rounded-md border border-neutral-200 p-3">
                  <img
                    src={product.imageUrl}
                    alt={`${product.name} image`}
                    className="h-20 w-20 rounded object-cover"
                  />
                  <label className="mt-2 flex items-center gap-2 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      name="removeImage"
                      className="h-4 w-4 rounded border-neutral-300"
                    />
                    Remove current image
                  </label>
                </div>
              ) : null}
            </FormField>

            <FormField>
              <FormLabel htmlFor="name" required>
                Product Name
              </FormLabel>
              <FormInput
                id="name"
                name="name"
                placeholder="e.g., Thai Iced Tea"
                defaultValue={product?.name || ""}
                required
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="sku">SKU</FormLabel>
              <FormInput
                id="sku"
                name="sku"
                placeholder="e.g., THAI-ICE-001"
                defaultValue={product?.sku || ""}
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="barcode">Barcode</FormLabel>
              <FormInput
                id="barcode"
                name="barcode"
                placeholder="e.g., 123456789"
                defaultValue={product?.barcode || ""}
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="unit" required>
                Unit
              </FormLabel>
              <FormInput
                id="unit"
                name="unit"
                placeholder="e.g., pc, cup, box"
                defaultValue={product?.unit || "pc"}
                required
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="categoryId">Product Type</FormLabel>
              <FormSelect
                id="categoryId"
                name="categoryId"
                defaultValue={product?.categoryId || ""}
              >
                <option value="">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </FormSelect>
            </FormField>

            <FormField>
              <FormLabel htmlFor="price" required>
                Selling Price
              </FormLabel>
              <FormInput
                type="number"
                id="price"
                name="price"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={product?.price || 0}
                required
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="costPrice">Cost Price</FormLabel>
              <FormInput
                type="number"
                id="costPrice"
                name="costPrice"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={product?.costPrice || ""}
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="stockQty" required>
                Stock Qty
              </FormLabel>
              <FormInput
                type="number"
                id="stockQty"
                name="stockQty"
                min="0"
                step="1"
                placeholder="0"
                defaultValue={product?.stockQty || 0}
                required
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="lowStockAt" required>
                Low Stock Alert At
              </FormLabel>
              <FormInput
                type="number"
                id="lowStockAt"
                name="lowStockAt"
                min="0"
                step="1"
                placeholder="5"
                defaultValue={product?.lowStockAt || 5}
                required
              />
            </FormField>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            isLoading={isPending}
          >
            {isPending ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
