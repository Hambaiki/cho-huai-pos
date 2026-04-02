"use client";

import { PageHeader } from "@/components/content/PageHeader";
import { Button } from "@/components/ui/Button";
import { useStoreContext } from "@/features/pos/store-context";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CategoryOption, Product } from "../types";
import { ProductList } from "./ProductList";
import { ProductModal } from "./ProductModal";

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
