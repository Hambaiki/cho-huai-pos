"use client";

import { useState } from "react";
import { useStoreContext } from "@/lib/store-context";
import { ProductList } from "./ProductList";
import { ProductModal } from "./ProductModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";

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
  imageUrl: string | null;
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
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenNewProduct = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Inventory Management"
        description="Browse and manage products in your catalog"
        actions={
          <Button icon={<Plus size={16} />} onClick={handleOpenNewProduct}>
            New Product
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
      />

      <ProductModal
        open={modalOpen}
        onClose={handleCloseModal}
        categories={categoryOptions}
      />
    </>
  );
}
