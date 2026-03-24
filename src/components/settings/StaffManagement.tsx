"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useStoreContext } from "@/lib/store-context";
import {
  inviteStaffAction,
  type StaffActionState,
} from "@/lib/actions/staff";
import {
  removeMemberAction,
  revokeInviteCodeAction,
  type StaffMember,
  type InviteCodeRow,
} from "@/lib/actions/settingsActions";
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

interface StaffManagementProps {
  staffMembers: StaffMember[];
  inviteCodes: InviteCodeRow[];
  storeId: string;
  role: "owner" | "manager" | "cashier" | "viewer";
}

function InviteStaffButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
    >
      {pending ? "Creating…" : "Create invite code"}
    </button>
  );
}

export function StaffManagement({
  staffMembers,
  inviteCodes,
  storeId,
  role,
}: StaffManagementProps) {
  const { storeId: ctxStoreId } = useStoreContext();
  const effectiveStoreId = storeId || ctxStoreId;
  const isOwnerOrManager = role === "owner" || role === "manager";
  const isOwner = role === "owner";

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [actionState, setActionState] = useState<StaffActionState>({ error: null });
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  function resetInviteFlow() {
    setInviteCode(null);
    setActionState({ error: null });
    setCopied(false);
  }

  function openInviteModal() {
    resetInviteFlow();
    setIsInviteOpen(true);
  }

  function closeInviteModal() {
    setIsInviteOpen(false);
    resetInviteFlow();
  }

  async function handleInviteSubmit(formData: FormData) {
    if (!effectiveStoreId) return;
    formData.append("storeId", effectiveStoreId);
    const result = await inviteStaffAction(actionState, formData);
    setActionState(result);
    if (!result.error && result.data?.code) {
      setInviteCode(result.data.code);
    }
  }

  function copyToClipboard() {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const roleColors: Record<string, string> = {
    owner: "bg-danger-100 text-danger-800",
    manager: "bg-brand-100 text-brand-800",
    cashier: "bg-info-100 text-info-800",
    viewer: "bg-neutral-100 text-neutral-800",
  };

  // Active: not revoked, not expired, not fully used
  const activeCodes = inviteCodes.filter(
    (c) =>
      !c.is_revoked &&
      c.used_count < c.max_uses &&
      (!c.expires_at || new Date(c.expires_at) > new Date()),
  );

  return (
    <div className="space-y-6">
      {/* ── Staff list ── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Staff Members</h2>
          {isOwnerOrManager && (
            <button
              type="button"
              onClick={openInviteModal}
              className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 text-sm"
            >
              + Invite Staff
            </button>
          )}
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                {isOwner && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isOwner ? 4 : 3} className="py-10 text-center text-neutral-400">
                    No staff members yet.
                  </TableCell>
                </TableRow>
              ) : (
                staffMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium text-neutral-900">{member.displayName}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          roleColors[member.role]
                        }`}
                      >
                        {member.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-neutral-500">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </TableCell>
                    {isOwner && (
                      <TableCell className="text-right">
                        {member.role !== "owner" && (
                          <button
                            type="button"
                            onClick={() =>
                              startTransition(async () => {
                                if (confirm(`Remove ${member.displayName} from this store?`)) {
                                  await removeMemberAction(member.id, effectiveStoreId);
                                }
                              })
                            }
                            className="text-xs text-danger-600 hover:text-danger-800"
                          >
                            Remove
                          </button>
                        )}
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
          description="Create a secure invite code for your team member."
          onClose={closeInviteModal}
        />
        {inviteCode ? (
          <>
            <ModalBody>
              <div className="bg-success-50 border border-success-200 rounded p-4">
                <p className="text-sm text-neutral-600 mb-2">Invite code created:</p>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-3 py-2 rounded font-mono font-bold text-lg flex-1">
                    {inviteCode}
                  </code>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="px-3 py-2 bg-brand-500 text-white rounded hover:bg-brand-600 text-sm"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  Share this code with your staff member. Valid for 7 days.
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <button
                type="button"
                onClick={closeInviteModal}
                className="px-4 py-2 text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-50 text-sm"
              >
                Close
              </button>
            </ModalFooter>
          </>
        ) : (
          <form action={handleInviteSubmit}>
            <ModalBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Role</label>
                <select
                  name="role"
                  defaultValue="cashier"
                  required
                  className="w-full px-3 py-2 border border-neutral-200 rounded-md text-sm bg-white"
                >
                  {isOwner && (
                    <option value="manager">Manager — Full store access</option>
                  )}
                  <option value="cashier">Cashier — Sales only</option>
                  <option value="viewer">Viewer — View only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Expires in
                </label>
                <select
                  name="expiresInDays"
                  defaultValue="7"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-md text-sm bg-white"
                >
                  <option value="1">1 day</option>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Note (optional)
                </label>
                <input
                  type="text"
                  name="note"
                  placeholder="e.g. Weekend cashier"
                  maxLength={255}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-md text-sm"
                />
              </div>
              {actionState.error && (
                <p className="text-xs text-danger-700 bg-danger-50 p-2 rounded">
                  {actionState.error}
                </p>
              )}
            </ModalBody>
            <ModalFooter>
              <button
                type="button"
                onClick={closeInviteModal}
                className="px-4 py-2 text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-50 text-sm"
              >
                Cancel
              </button>
              <InviteStaffButton />
            </ModalFooter>
          </form>
        )}
      </Modal>

      {/* ── Active invite codes ── */}
      {isOwnerOrManager && activeCodes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-neutral-800">Active Invite Codes</h3>
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Code</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <code className="font-mono font-semibold text-neutral-900">{code.code}</code>
                    </TableCell>
                    <TableCell className="capitalize text-neutral-600">{code.role}</TableCell>
                    <TableCell className="text-neutral-500 text-xs">
                      {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : "No expiry"}
                    </TableCell>
                    <TableCell className="text-neutral-400 text-xs">{code.note ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={() =>
                          startTransition(async () => {
                            if (confirm("Revoke this invite code?")) {
                              await revokeInviteCodeAction(code.id, effectiveStoreId);
                            }
                          })
                        }
                        className="text-xs text-danger-600 hover:text-danger-800"
                      >
                        Revoke
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}
    </div>
  );
}
