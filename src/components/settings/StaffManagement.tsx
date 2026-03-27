"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  BadgeCheck,
  Edit,
  Mail,
  Shield,
  UserCog,
  UserMinus,
  UserPlus,
  UserSquare2,
} from "lucide-react";
import { useStoreContext } from "@/lib/store-context";
import { inviteStaffAction, type StaffActionState } from "@/lib/actions/staff";
import {
  removeMemberAction,
  type StaffMember,
  updateMemberRoleAction,
} from "@/lib/actions/settingsActions";
import { StaffRemovalModal } from "@/components/settings/StaffRemovalModal";
import { useSyncPendingAction } from "@/components/ui/PendingActionProvider";
import { Button } from "@/components/ui/Button";
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
import {
  FormField,
  FormLabel,
  FormInput,
  FormSelect,
  FormError,
  FormSelectOption,
} from "@/components/ui/form";

interface StaffManagementProps {
  staffMembers: StaffMember[];
  storeId: string;
  role: "owner" | "manager" | "cashier" | "viewer";
}

function InviteStaffButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      isLoading={pending}
      icon={<UserPlus size={16} />}
    >
      Send invite
    </Button>
  );
}

export function StaffManagement({
  staffMembers,
  storeId,
  role,
}: StaffManagementProps) {
  const { storeId: ctxStoreId } = useStoreContext();
  const effectiveStoreId = storeId || ctxStoreId;
  const isOwnerOrManager = role === "owner" || role === "manager";
  const isOwner = role === "owner";

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [actionState, setActionState] = useState<StaffActionState>({
    error: null,
  });
  const [isPending, startTransition] = useTransition();
  const [selectedForRemoval, setSelectedForRemoval] =
    useState<StaffMember | null>(null);
  const [selectedForRoleEdit, setSelectedForRoleEdit] =
    useState<StaffMember | null>(null);
  const [pendingRole, setPendingRole] = useState<
    "manager" | "cashier" | "viewer"
  >("cashier");
  const [memberActionError, setMemberActionError] = useState<string | null>(
    null,
  );

  useSyncPendingAction(isPending, {
    message: "Saving changes…",
  });

  function resetInviteFlow() {
    setActionState({ error: null });
  }

  function openInviteModal() {
    resetInviteFlow();
    setIsInviteOpen(true);
  }

  function closeInviteModal() {
    setIsInviteOpen(false);
    resetInviteFlow();
  }

  function openRemovalModal(member: StaffMember) {
    setMemberActionError(null);
    setSelectedForRemoval(member);
  }

  function openRoleModal(member: StaffMember) {
    if (member.role === "owner") return;
    setMemberActionError(null);
    setSelectedForRoleEdit(member);
    setPendingRole(member.role as "manager" | "cashier" | "viewer");
  }

  function closeRemovalModal() {
    if (isPending) return;
    setSelectedForRemoval(null);
  }

  function closeRoleModal() {
    if (isPending) return;
    setSelectedForRoleEdit(null);
  }

  async function handleInviteSubmit(formData: FormData) {
    if (!effectiveStoreId) return;
    formData.append("storeId", effectiveStoreId);
    const result = await inviteStaffAction(actionState, formData);
    setActionState(result);
  }

  function handleRoleChange(
    memberId: string,
    nextRole: "manager" | "cashier" | "viewer",
  ) {
    if (!effectiveStoreId) return;
    setMemberActionError(null);
    startTransition(async () => {
      const result = await updateMemberRoleAction(
        memberId,
        effectiveStoreId,
        nextRole,
      );
      if (result.error) setMemberActionError(result.error);
    });
  }

  function confirmRoleChange() {
    if (!selectedForRoleEdit) return;

    if (selectedForRoleEdit.role === pendingRole) {
      setSelectedForRoleEdit(null);
      return;
    }

    handleRoleChange(selectedForRoleEdit.id, pendingRole);
    setSelectedForRoleEdit(null);
  }

  function confirmRemoveMember() {
    if (!selectedForRemoval || !effectiveStoreId) return;
    setMemberActionError(null);
    startTransition(async () => {
      const result = await removeMemberAction(
        selectedForRemoval.id,
        effectiveStoreId,
      );
      if (result.error) {
        setMemberActionError(result.error);
        return;
      }
      setSelectedForRemoval(null);
    });
  }

  const roleColors: Record<string, string> = {
    owner: "bg-danger-100 text-danger-800",
    manager: "bg-brand-100 text-brand-800",
    cashier: "bg-info-100 text-info-800",
    viewer: "bg-neutral-100 text-neutral-800",
  };

  const roleIcons = {
    owner: Shield,
    manager: UserCog,
    cashier: BadgeCheck,
    viewer: UserSquare2,
  } as const;

  return (
    <div className="space-y-6">
      {/* ── Staff list ── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="inline-flex items-center gap-2 text-xl font-semibold">
            Staff Members
          </h2>
          {isOwnerOrManager && (
            <Button
              type="button"
              onClick={openInviteModal}
              icon={<UserPlus size={16} />}
            >
              Invite Staff
            </Button>
          )}
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                {isOwner && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberActionError && (
                <TableRow>
                  <TableCell colSpan={isOwner ? 4 : 3} className="py-3">
                    <p className="rounded-md bg-danger-50 px-3 py-2 text-xs text-danger-700">
                      {memberActionError}
                    </p>
                  </TableCell>
                </TableRow>
              )}
              {staffMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isOwner ? 4 : 3}
                    className="py-10 text-center text-neutral-400"
                  >
                    <span className="inline-flex items-center gap-2">
                      No staff members yet.
                    </span>
                  </TableCell>
                </TableRow>
              ) : (
                staffMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium text-neutral-900">
                      <span className="inline-flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold uppercase text-neutral-700">
                          {member.displayName.slice(0, 1)}
                        </span>
                        <span>{member.displayName}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium capitalize ${
                          roleColors[member.role]
                        }`}
                      >
                        {(() => {
                          const RoleIcon =
                            roleIcons[member.role as keyof typeof roleIcons];
                          return RoleIcon ? <RoleIcon size={12} /> : null;
                        })()}
                        {member.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-neutral-500">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </TableCell>
                    {isOwner && (
                      <TableCell className="text-right">
                        {member.role !== "owner" ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isPending}
                              onClick={() => openRemovalModal(member)}
                              icon={<UserMinus size={16} />}
                              className="inline-flex items-center gap-1 text-sm font-medium text-danger-500 transition hover:text-danger-800"
                            >
                              Remove
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isPending}
                              onClick={() => openRoleModal(member)}
                              icon={<Edit size={16} />}
                              className="inline-flex items-center gap-1 text-sm font-medium text-neutral-500 transition hover:text-neutral-800"
                            >
                              Edit role
                            </Button>
                          </div>
                        ) : null}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <Modal open={isInviteOpen} onClose={closeInviteModal} size="md">
        <ModalHeader
          title="Invite Staff"
          description="Invite an existing account by email to join this store."
          onClose={closeInviteModal}
        />
        <form action={handleInviteSubmit}>
          <ModalBody className="space-y-4">
            <FormField>
              <FormLabel htmlFor="email" required>
                <Mail size={16} className="text-neutral-500" />
                Email
              </FormLabel>
              <FormInput
                id="email"
                type="email"
                name="email"
                required
                placeholder="staff@example.com"
              />
              <p className="text-xs text-neutral-500 mt-1">
                This email must already have an account.
              </p>
            </FormField>
            <FormField>
              <FormLabel htmlFor="role" required>
                <Shield size={16} className="text-neutral-500" />
                Role
              </FormLabel>
              <FormSelect id="role" name="role" defaultValue="cashier" required>
                {isOwner && (
                  <FormSelectOption value="manager">
                    Manager - Full store access
                  </FormSelectOption>
                )}
                <FormSelectOption value="cashier">
                  Cashier - Sales only
                </FormSelectOption>
                <FormSelectOption value="viewer">
                  Viewer - View only
                </FormSelectOption>
              </FormSelect>
            </FormField>
            <FormField>
              <FormLabel htmlFor="note">Note (optional)</FormLabel>
              <FormInput
                id="note"
                type="text"
                name="note"
                placeholder="e.g. Weekend cashier"
                maxLength={255}
              />
            </FormField>
            {actionState.data?.message && !actionState.error && (
              <p className="text-xs text-success-700 bg-success-50 p-2 rounded">
                {actionState.data.message}
              </p>
            )}
            <FormError message={actionState.error} />
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={closeInviteModal}>
              Cancel
            </Button>
            <InviteStaffButton />
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        open={Boolean(selectedForRoleEdit)}
        onClose={closeRoleModal}
        size="sm"
      >
        <ModalHeader
          title="Edit staff role"
          description={
            selectedForRoleEdit
              ? `Update access for ${selectedForRoleEdit.displayName}.`
              : undefined
          }
          onClose={closeRoleModal}
        />
        <ModalBody className="space-y-4">
          <div>
            <label className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-neutral-700">
              Role
            </label>
            <FormSelect
              value={pendingRole}
              disabled={isPending}
              onChange={(value) =>
                setPendingRole(value as "manager" | "cashier" | "viewer")
              }
              className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800"
            >
              <FormSelectOption value="manager">
                Manager - Full store access
              </FormSelectOption>
              <FormSelectOption value="cashier">
                Cashier - Sales only
              </FormSelectOption>
              <FormSelectOption value="viewer">
                Viewer - View only
              </FormSelectOption>
            </FormSelect>
          </div>
          <p className="text-xs text-neutral-500">
            Changes take effect immediately after saving.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={closeRoleModal}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={confirmRoleChange}
            disabled={isPending}
            isLoading={isPending}
          >
            Save role
          </Button>
        </ModalFooter>
      </Modal>

      <StaffRemovalModal
        open={Boolean(selectedForRemoval)}
        memberName={selectedForRemoval?.displayName ?? "this staff member"}
        isPending={isPending}
        onClose={closeRemovalModal}
        onConfirm={confirmRemoveMember}
      />
    </div>
  );
}
