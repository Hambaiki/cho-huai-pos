"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Crown,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import {
  setUserSuperAdminAction,
  setUserSuspensionAction,
} from "@/lib/actions/admin";
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
import { cn } from "@/lib/utils/cn";

type AdminProfile = {
  id: string;
  display_name: string | null;
  is_super_admin: boolean;
  is_suspended: boolean;
  created_at: string;
};

type PendingAction =
  | {
      kind: "suspend";
      profile: AdminProfile;
      nextValue: boolean;
    }
  | {
      kind: "superadmin";
      profile: AdminProfile;
      nextValue: boolean;
    };

interface AdminUsersTableProps {
  profiles: AdminProfile[];
  currentUserId: string;
}

export function AdminUsersTable({
  profiles,
  currentUserId,
}: AdminUsersTableProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const closeModal = () => {
    setPendingAction(null);
    setError(null);
  };

  const runAction = () => {
    if (!pendingAction) return;

    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("userId", pendingAction.profile.id);

      let result: { ok: boolean; error?: string };
      if (pendingAction.kind === "suspend") {
        formData.set("suspend", String(pendingAction.nextValue));
        result = await setUserSuspensionAction(formData);
      } else {
        formData.set("makeSuperAdmin", String(pendingAction.nextValue));
        result = await setUserSuperAdminAction(formData);
      }

      if (!result.ok) {
        setError(result.error ?? "Unable to complete this action.");
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
              <TableHead>Display Name</TableHead>
              <TableHead>Super Admin</TableHead>
              <TableHead>Access</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
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
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                          <Crown size={12} />
                          Yes
                        </span>
                      ) : (
                        <span className="text-neutral-500">No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {profile.is_super_admin ? (
                        <span className="inline-flex items-center gap-1 text-neutral-500">
                          <BadgeCheck size={14} />
                          Always enabled
                        </span>
                      ) : profile.is_suspended ? (
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
                      {new Date(profile.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {profile.is_super_admin ? (
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() =>
                              setPendingAction({
                                kind: "superadmin",
                                profile,
                                nextValue: false,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <ShieldX size={12} />
                            Revoke Admin
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setPendingAction({
                                kind: "superadmin",
                                profile,
                                nextValue: true,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-md bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-200"
                          >
                            <Crown size={12} />
                            Make Admin
                          </button>
                        )}

                        {!profile.is_super_admin && (
                          <button
                            type="button"
                            onClick={() =>
                              setPendingAction({
                                kind: "suspend",
                                profile,
                                nextValue: !profile.is_suspended,
                              })
                            }
                            className={cn(
                              `rounded-md px-2.5 py-1 text-xs font-medium transition`,
                              "inline-flex items-center gap-1",
                              profile.is_suspended
                                ? "bg-success-100 text-success-700 hover:bg-success-200"
                                : "bg-warning-100 text-warning-700 hover:bg-warning-200",
                            )}
                          >
                            {profile.is_suspended ? (
                              <ShieldCheck size={12} />
                            ) : (
                              <ShieldAlert size={12} />
                            )}
                            {profile.is_suspended
                              ? "Approve Access"
                              : "Suspend"}
                          </button>
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

      <Modal open={Boolean(pendingAction)} onClose={closeModal} size="md">
        <ModalHeader
          title={
            pendingAction?.kind === "suspend"
              ? pendingAction.nextValue
                ? "Suspend User"
                : "Approve User Access"
              : pendingAction?.nextValue
                ? "Grant Super Admin"
                : "Revoke Super Admin"
          }
          description={
            pendingAction
              ? `User: ${pendingAction.profile.display_name ?? pendingAction.profile.id.slice(0, 8)}`
              : undefined
          }
          onClose={closeModal}
        />
        <ModalBody>
          <p className="text-sm text-neutral-600">
            {pendingAction?.kind === "suspend"
              ? pendingAction.nextValue
                ? "This user will be redirected to Access Pending and blocked from normal app routes."
                : "This user will regain access to the application."
              : pendingAction?.nextValue
                ? "This user will gain access to all superadmin routes and actions."
                : "This user will lose superadmin access and admin route privileges."}
          </p>
          {error && <p className="mt-3 text-sm text-danger-700">{error}</p>}
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={runAction}
            disabled={isPending}
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Confirm"}
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
}
