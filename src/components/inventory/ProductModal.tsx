"use client";

import { useActionState, useRef, useState } from "react";
import { Barcode, Trash } from "lucide-react";
import {
  createProductAction,
  removeProductImageAction,
  updateProductAction,
} from "@/lib/actions/products";
import { compressImageForUpload } from "@/lib/utils/image-compression";
import { useStoreContext } from "@/lib/store-context";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  FormLabel,
  FormInput,
  FormSelect,
  FormError,
  FormSelectOption,
  FormFileUpload,
} from "@/components/ui/form";
import { useBarcodeScanner } from "@/lib/hooks/useBarcodeScanner";
import { BarcodeCameraScanner } from "@/components/pos/BarcodeCameraScanner";
import { useSyncPendingAction } from "@/components/ui/PendingActionProvider";

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

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  product?: Product;
  categories: Array<{ value: string; label: string }>;
  onSuccess?: () => void;
}

export function ProductModal({
  open,
  onClose,
  product,
  categories,
  onSuccess,
}: ProductModalProps) {
  const store = useStoreContext();
  const isEdit = !!product;
  const formRef = useRef<HTMLFormElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [showRemoveImageConfirm, setShowRemoveImageConfirm] = useState(false);
  const [hasRemovedImage, setHasRemovedImage] = useState(false);

  const handleModalClose = () => {
    setShowRemoveImageConfirm(false);
    setHasRemovedImage(false);
    setShowCameraScanner(false);
    onClose();
  };

  // Handle barcode from camera or hardware scanner
  const handleBarcodeDetected = (barcode: string) => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.value = barcode;
      barcodeInputRef.current.focus();
    }
    setShowCameraScanner(false);
  };

  // Use hardware barcode scanner hook - listens for scanner input
  useBarcodeScanner({ onBarcode: handleBarcodeDetected });

  const [state, formAction, isPending] = useActionState(
    async (
      prevState: { data: null; error: string | null },
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
        return { ...prevState, error: result.error };
      }

      if (onSuccess) {
        onSuccess();
      }
      handleModalClose();
      return { data: null, error: null };
    },
    { data: null, error: null as string | null },
  );

  const [removeImageState, removeImageFormAction, isRemovingImagePending] =
    useActionState(
      async (prevState: { error: string | null }) => {
        if (!product) {
          return { ...prevState, error: "Product not found." };
        }

        const result = await removeProductImageAction(product.id);

        if (result.error) {
          return { ...prevState, error: result.error };
        }

        setHasRemovedImage(true);
        setShowRemoveImageConfirm(false);
        if (onSuccess) {
          onSuccess();
        }

        return { error: null };
      },
      { error: null as string | null },
    );

  const hasCurrentImage = Boolean(product?.imageUrl) && !hasRemovedImage;
  const currentImageUrl = hasCurrentImage ? (product?.imageUrl ?? "") : "";
  const productName = product?.name ?? "Product";

  useSyncPendingAction(isPending || isRemovingImagePending, {
    message: isRemovingImagePending
      ? "Removing product image..."
      : "Saving product...",
  });

  return (
    <Modal
      open={open}
      onClose={handleModalClose}
      size="lg"
      className="flex max-h-[calc(100dvh-2rem)] flex-col"
    >
      <ModalHeader
        title={isEdit ? "Edit Product" : "Add New Product"}
        description={
          isEdit
            ? product?.name
            : "Create a new product for your store inventory"
        }
        onClose={handleModalClose}
      />

      <form ref={formRef} action={formAction} className="flex min-h-0 flex-col">
        <ModalBody className="space-y-6 overflow-y-auto">
          <FormError message={state?.error} />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField className="sm:col-span-2">
              <FormLabel htmlFor="imageFile">Item Image</FormLabel>
              <FormFileUpload
                id="imageFile"
                name="imageFile"
                accept="image/*"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Optional. PNG, JPG, or WEBP up to 1MB.
              </p>
              {hasCurrentImage ? (
                <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50">
                  <div className="flex items-start gap-4 p-3">
                    <div className="h-24 w-24 overflow-hidden rounded-md border border-neutral-200 bg-white shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentImageUrl}
                        alt={`${productName} image`}
                        className="h-full w-full object-cover shrink-0"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Current image
                      </p>
                      <p className="mt-1 text-sm font-medium text-neutral-900 truncate">
                        {productName}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Upload a new file to replace this image, or use the
                        button below to remove it.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-neutral-200 p-3">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      icon={<Trash size={16} />}
                      onClick={() => setShowRemoveImageConfirm(true)}
                    >
                      Remove current image
                    </Button>
                  </div>
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
              <div className="flex items-center gap-2">
                <FormInput
                  ref={barcodeInputRef}
                  id="barcode"
                  name="barcode"
                  placeholder="e.g., 123456789"
                  defaultValue={product?.barcode || ""}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowCameraScanner(true)}
                  title="Scan barcode using camera"
                  icon={<Barcode size={16} />}
                  className="mt-0"
                />
              </div>
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
                <FormSelectOption value="">Uncategorized</FormSelectOption>
                {categories.map((category) => (
                  <FormSelectOption key={category.value} value={category.value}>
                    {category.label}
                  </FormSelectOption>
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

            {isEdit ? (
              <input
                type="hidden"
                name="stockQty"
                value={String(product?.stockQty ?? 0)}
              />
            ) : (
              <FormField>
                <FormLabel htmlFor="stockQty" required>
                  Initial Stock
                </FormLabel>
                <FormInput
                  type="number"
                  id="stockQty"
                  name="stockQty"
                  min="0"
                  step="1"
                  placeholder="0"
                  defaultValue={0}
                  required
                />
                <p className="mt-1 text-xs text-neutral-500">
                  After creation, stock is managed from the product detail page.
                </p>
              </FormField>
            )}

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
          <Button type="button" onClick={handleModalClose} variant="outline">
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} isLoading={isPending}>
            {isPending
              ? "Saving..."
              : isEdit
                ? "Update Product"
                : "Create Product"}
          </Button>
        </ModalFooter>
      </form>

      <BarcodeCameraScanner
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onBarcode={handleBarcodeDetected}
      />

      <Modal
        open={showRemoveImageConfirm}
        onClose={() => setShowRemoveImageConfirm(false)}
        size="md"
      >
        <ModalHeader
          title="Remove product image"
          description="This removes the current image from this product."
          onClose={() => setShowRemoveImageConfirm(false)}
        />
        <form action={removeImageFormAction}>
          <ModalBody className="space-y-3">
            <p className="text-sm text-neutral-600">
              This action cannot be undone. You can upload a new image later.
            </p>
            <FormError message={removeImageState.error} />
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRemoveImageConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              isLoading={isRemovingImagePending}
            >
              {isRemovingImagePending ? "Removing..." : "Yes, remove image"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </Modal>
  );
}
