"use client";

import { Toaster } from "react-hot-toast";

export function AppToaster() {
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
