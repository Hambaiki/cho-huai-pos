"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStoreContext } from "@/lib/store-context";
import { ProductList } from "./ProductList";
import { ProductFormModal } from "./ProductFormModal";

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
}

interface ProductListClientProps {
  products: Product[];
}

export function ProductListClient({ products }: ProductListClientProps) {
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
      <ProductList
        products={products}
        currency={store.currency}
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
                categoryId: null,
              }
            : undefined
        }
        onSuccess={handleSuccess}
      />
    </>
  );
}
