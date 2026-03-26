"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Crown,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Store,
} from "lucide-react";
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
import { SuspendUserModal } from "./SuspendUserModal";
import { SuperAdminModal } from "./SuperAdminModal";
import { StoreLimitModal } from "./StoreLimitModal";

type AdminProfile = {
  id: string;
  display_name: string | null;
  is_super_admin: boolean;
  is_suspended: boolean;
  store_limit_override: number | null;
  created_at: string;
};

interface AdminUsersTableProps {
  profiles: AdminProfile[];
  currentUserId: string;
}

export function AdminUsersTable({
  profiles,
  currentUserId,
}: AdminUsersTableProps) {
  // Modal states
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendModalProfile, setSuspendModalProfile] =
    useState<AdminProfile | null>(null);
  const [suspendNextValue, setSuspendNextValue] = useState(false);

  const [superAdminModalOpen, setSuperAdminModalOpen] = useState(false);
  const [superAdminModalProfile, setSuperAdminModalProfile] =
    useState<AdminProfile | null>(null);
  const [superAdminNextValue, setSuperAdminNextValue] = useState(false);

  const [storeLimitModalOpen, setStoreLimitModalOpen] = useState(false);
  const [storeLimitModalProfile, setStoreLimitModalProfile] =
    useState<AdminProfile | null>(null);

  // Modal handlers
  const openSuspendModal = (profile: AdminProfile, nextValue: boolean) => {
    setSuspendModalProfile(profile);
    setSuspendNextValue(nextValue);
    setSuspendModalOpen(true);
  };

  const openSuperAdminModal = (profile: AdminProfile, nextValue: boolean) => {
    setSuperAdminModalProfile(profile);
    setSuperAdminNextValue(nextValue);
    setSuperAdminModalOpen(true);
  };

  const openStoreLimitModal = (profile: AdminProfile) => {
    setStoreLimitModalProfile(profile);
    setStoreLimitModalOpen(true);
  };

  return (
    <>
      <TableContainer className="overflow-hidden">
        <Table>
          <TableHeader className="text-xs text-neutral-500 uppercase">
            <TableRow className="hover:bg-transparent">
              <TableHead>Display Name</TableHead>
              <TableHead>Super Admin</TableHead>
              <TableHead>Store Limit</TableHead>
              <TableHead>Access</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-neutral-500"
                >
                  No users yet.
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile) => {
                const isSelf = profile.id === currentUserId;

                return (
                  <TableRow key={profile.id} className="border-border">
                    <TableCell className="font-medium text-neutral-900">
                      {profile.display_name ?? "-"}
                    </TableCell>
                    <TableCell>
                      {profile.is_super_admin ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
                          <Crown size={12} />
                          Yes
                        </span>
                      ) : (
                        <span className="text-neutral-500">No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {profile.store_limit_override ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
                          <Store size={12} />
                          {profile.store_limit_override}
                        </span>
                      ) : (
                        <span className="text-neutral-500">Default</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {profile.is_super_admin ? (
                        <span className="inline-flex items-center gap-1 text-neutral-500">
                          <BadgeCheck size={14} />
                          Always enabled
                        </span>
                      ) : profile.is_suspended ? (
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
                      {new Date(profile.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!profile.is_super_admin && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => openStoreLimitModal(profile)}
                            icon={<Store size={12} />}
                          >
                            {profile.store_limit_override
                              ? "Edit Limit"
                              : "Set Limit"}
                          </Button>
                        )}
                        {profile.is_super_admin ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={isSelf}
                            onClick={() => openSuperAdminModal(profile, false)}
                            icon={<ShieldX size={12} />}
                          >
                            Revoke Admin
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => openSuperAdminModal(profile, true)}
                            icon={<Crown size={12} />}
                          >
                            Make Admin
                          </Button>
                        )}

                        {!profile.is_super_admin && (
                          <Button
                            type="button"
                            variant={
                              profile.is_suspended ? "success" : "warning"
                            }
                            size="sm"
                            onClick={() =>
                              openSuspendModal(profile, !profile.is_suspended)
                            }
                            icon={
                              profile.is_suspended ? (
                                <ShieldCheck size={12} />
                              ) : (
                                <ShieldAlert size={12} />
                              )
                            }
                          >
                            {profile.is_suspended
                              ? "Approve Access"
                              : "Suspend"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <SuspendUserModal
        open={suspendModalOpen}
        onClose={() => setSuspendModalOpen(false)}
        profile={
          suspendModalProfile || {
            id: "",
            display_name: "",
            is_suspended: false,
          }
        }
        nextValue={suspendNextValue}
      />

      <SuperAdminModal
        open={superAdminModalOpen}
        onClose={() => setSuperAdminModalOpen(false)}
        profile={
          superAdminModalProfile || {
            id: "",
            display_name: "",
            is_super_admin: false,
          }
        }
        nextValue={superAdminNextValue}
      />

      <StoreLimitModal
        open={storeLimitModalOpen}
        onClose={() => setStoreLimitModalOpen(false)}
        profile={
          storeLimitModalProfile || {
            id: "",
            display_name: "",
            store_limit_override: null,
          }
        }
      />
    </>
  );
}
