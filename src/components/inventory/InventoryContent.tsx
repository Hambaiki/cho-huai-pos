"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStoreContext } from "@/lib/store-context";
import { ProductList } from "./ProductList";
import { ProductFormModal } from "./ProductFormModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

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
  isActive: boolean;
  categoryId: string | null;
  categoryName: string | null;
}

interface CategoryOption {
  value: string;
  label: string;
}

interface InventoryContentProps {
  products: Product[];
  currentPage: number;
  totalItems: number;
  pageSize: number;
  initialQuery: string;
  initialStatuses: string[];
  initialStockStatuses: string[];
  initialCategoryIds: string[];
  categoryOptions: CategoryOption[];
}

export function InventoryContent({
  products,
  currentPage,
  totalItems,
  pageSize,
  initialQuery,
  initialStatuses,
  initialStockStatuses,
  initialCategoryIds,
  categoryOptions,
}: InventoryContentProps) {
  const store = useStoreContext();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleOpenNewProduct = () => {
    setSelectedProduct(null);
    setModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <PageHeader
        title="Inventory Management"
        description="Browse and manage products in your catalog"
        actions={
          <Button
            onClick={handleOpenNewProduct}
          >
            + New Product
          </Button>
        }
      />

      <ProductList
        products={products}
        currency={store.currency}
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        initialQuery={initialQuery}
        initialStatuses={initialStatuses}
        initialStockStatuses={initialStockStatuses}
        initialCategoryIds={initialCategoryIds}
        categoryOptions={categoryOptions}
        onNewProduct={handleOpenNewProduct}
        onEditProduct={handleOpenEditProduct}
      />

      <ProductFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        product={
          selectedProduct
            ? {
                id: selectedProduct.id,
                name: selectedProduct.name,
                sku: selectedProduct.sku,
                barcode: selectedProduct.barcode,
                price: selectedProduct.price,
                costPrice: selectedProduct.costPrice,
                stockQty: selectedProduct.stockQty,
                lowStockAt: selectedProduct.lowStockAt,
                unit: selectedProduct.unit,
                categoryId: selectedProduct.categoryId,
              }
            : undefined
        }
        categories={categoryOptions}
        onSuccess={handleSuccess}
      />
    </>
  );
}
