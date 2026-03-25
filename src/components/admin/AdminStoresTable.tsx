"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { setStoreSuspensionAction } from "@/lib/actions/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

type AdminStore = {
  id: string;
  name: string;
  currency_code: string;
  is_suspended: boolean;
  created_at: string;
};

interface AdminStoresTableProps {
  stores: AdminStore[];
}

export function AdminStoresTable({ stores }: AdminStoresTableProps) {
  const router = useRouter();
  const [selectedStore, setSelectedStore] = useState<AdminStore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const closeModal = () => {
    setSelectedStore(null);
    setError(null);
  };

  const runAction = () => {
    if (!selectedStore) return;

    const nextValue = !selectedStore.is_suspended;
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("storeId", selectedStore.id);
      formData.set("suspend", String(nextValue));

      const result = await setStoreSuspensionAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Unable to update store status.");
        return;
      }

      closeModal();
      router.refresh();
    });
  };

  return (
    <>
      <TableContainer className="overflow-hidden">
        <Table>
          <TableHeader className="text-xs text-neutral-500 uppercase">
            <TableRow className="hover:bg-transparent">
              <TableHead>Store Name</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-neutral-500">
                  No stores yet.
                </TableCell>
              </TableRow>
            ) : (
              stores.map((store) => (
                <TableRow key={store.id} className="border-border">
                  <TableCell className="font-medium text-neutral-900">
                    {store.name}
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {store.currency_code}
                  </TableCell>
                  <TableCell>
                    {store.is_suspended ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2 py-0.5 text-xs font-medium text-warning-700">
                        <ShieldAlert size={12} />
                        Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700">
                        <ShieldCheck size={12} />
                        Active
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {new Date(store.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      onClick={() => setSelectedStore(store)}
                      variant={store.is_suspended ? "success" : "warning"}
                      size="sm"
                      icon={store.is_suspended ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                    >
                      {store.is_suspended ? "Enable Store" : "Disable Store"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal open={Boolean(selectedStore)} onClose={closeModal} size="md">
        <ModalHeader
          title={selectedStore?.is_suspended ? "Enable Store" : "Disable Store"}
          description={selectedStore ? `Store: ${selectedStore.name}` : undefined}
          onClose={closeModal}
        />
        <ModalBody>
          <p className="text-sm text-neutral-600">
            {selectedStore?.is_suspended
              ? "Enabling this store will allow members to access all store routes again."
              : "Disabling this store blocks members from accessing its workspace routes."}
          </p>
          {error && <p className="mt-3 text-sm text-danger-700">{error}</p>}
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={closeModal}
          >
            Cancel
          </Button>
          <Button
            type="button"
            isLoading={isPending}
            onClick={runAction}
          >
            {isPending ? "Saving..." : "Confirm"}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
