"use client";

import { useState } from "react";
import { ShieldAlert, ShieldCheck, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { SuspendStoreModal } from "./SuspendStoreModal";
import { StaffLimitModal } from "./StaffLimitModal";

type AdminStore = {
  id: string;
  name: string;
  currency_code: string;
  is_suspended: boolean;
  staff_limit_override: number | null;
  created_at: string;
};

interface AdminStoresTableProps {
  stores: AdminStore[];
}

export function AdminStoresTable({ stores }: AdminStoresTableProps) {
  // Modal states
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendModalStore, setSuspendModalStore] =
    useState<AdminStore | null>(null);
  const [suspendNextValue, setSuspendNextValue] = useState(false);

  const [staffLimitModalOpen, setStaffLimitModalOpen] = useState(false);
  const [staffLimitModalStore, setStaffLimitModalStore] =
    useState<AdminStore | null>(null);

  // Modal handlers
  const openSuspendModal = (store: AdminStore, nextValue: boolean) => {
    setSuspendModalStore(store);
    setSuspendNextValue(nextValue);
    setSuspendModalOpen(true);
  };

  const openStaffLimitModal = (store: AdminStore) => {
    setStaffLimitModalStore(store);
    setStaffLimitModalOpen(true);
  };

  return (
    <>
      <TableContainer className="overflow-hidden">
        <Table>
          <TableHeader className="text-xs text-neutral-500 uppercase">
            <TableRow className="hover:bg-transparent">
              <TableHead>Store Name</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Staff Limit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-neutral-500"
                >
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
                    {store.staff_limit_override ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
                        <Users size={12} />
                        {store.staff_limit_override}
                      </span>
                    ) : (
                      <span className="text-neutral-500">Default</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {store.is_suspended ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2 py-1 text-xs font-medium text-warning-700">
                        <ShieldAlert size={12} />
                        Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success-100 px-2 py-1 text-xs font-medium text-success-700">
                        <ShieldCheck size={12} />
                        Active
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {new Date(store.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => openStaffLimitModal(store)}
                        icon={<Users size={12} />}
                      >
                        {store.staff_limit_override
                          ? "Edit Limit"
                          : "Set Limit"}
                      </Button>
                      <Button
                        type="button"
                        onClick={() =>
                          openSuspendModal(store, !store.is_suspended)
                        }
                        variant={store.is_suspended ? "success" : "warning"}
                        size="sm"
                        icon={
                          store.is_suspended ? (
                            <ShieldCheck size={12} />
                          ) : (
                            <ShieldAlert size={12} />
                          )
                        }
                      >
                        {store.is_suspended ? "Enable Store" : "Disable Store"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <SuspendStoreModal
        open={suspendModalOpen}
        onClose={() => setSuspendModalOpen(false)}
        store={suspendModalStore || { id: "", name: "", is_suspended: false }}
        nextValue={suspendNextValue}
      />

      <StaffLimitModal
        open={staffLimitModalOpen}
        onClose={() => setStaffLimitModalOpen(false)}
        store={staffLimitModalStore || { id: "", name: "", staff_limit_override: null }}
      />
    </>
  );
}
