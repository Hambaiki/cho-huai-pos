"use client";

import { useEffect } from "react";
import { Toaster, toast, useToasterStore } from "react-hot-toast";

const MAX_VISIBLE_TOASTS = 3;

export function AppToaster() {
  const { toasts } = useToasterStore();

  useEffect(() => {
    const visibleToasts = toasts.filter((item) => item.visible);
    visibleToasts
      .slice(MAX_VISIBLE_TOASTS)
      .forEach((item) => toast.dismiss(item.id));
  }, [toasts]);

  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={12}
      toastOptions={{
        duration: 4000,
      }}
      containerStyle={{
        top: 16,
        right: 16,
      }}
    />
  );
}
