"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  userSchema,
  userUpdateSchema,
  type UserInput,
  type UserUpdateInput,
} from "@/lib/schemas/user";
import { useCreateUser, useUpdateUser } from "@/hooks/useUser";
import type { User } from "@/db/schema";

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "admin_gudang", label: "Admin Gudang" },
  { value: "admin_produksi", label: "Admin Produksi" },
  { value: "keuangan", label: "Keuangan" },
  { value: "viewer", label: "Viewer" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  editUser?: User | null;
}

export function UserFormModal({ open, onClose, editUser }: Props) {
  const isEdit = !!editUser;
  const create = useCreateUser();
  const update = useUpdateUser();

  const createForm = useForm<UserInput>({ resolver: zodResolver(userSchema) });
  const editForm = useForm<UserUpdateInput>({
    resolver: zodResolver(userUpdateSchema),
  });

  useEffect(() => {
    if (editUser) {
      editForm.reset({
        displayName: editUser.displayName,
        role: editUser.role,
        isActive: editUser.isActive,
      });
    }
  }, [editUser]);

  if (!open) return null;

  async function onCreateSubmit(data: UserInput) {
    const res = await create.mutateAsync(data);
    if (!res.error) {
      createForm.reset();
      onClose();
    }
  }

  async function onEditSubmit(data: UserUpdateInput) {
    if (!editUser) return;
    const res = await update.mutateAsync({ id: editUser.id, input: data });
    if (!res.error) onClose();
  }

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark">
        <h2 className="mb-5 text-lg font-semibold text-dark dark:text-white">
          {isEdit ? "Edit User" : "Tambah User"}
        </h2>

        {isEdit ? (
          <form
            onSubmit={editForm.handleSubmit(onEditSubmit)}
            className="flex flex-col gap-4"
          >
            <Input
              id="edit-displayName"
              label="Nama"
              error={editForm.formState.errors.displayName?.message}
              required
              {...editForm.register("displayName")}
            />
            <Select
              id="edit-role"
              label="Role"
              options={ROLE_OPTIONS}
              error={editForm.formState.errors.role?.message}
              {...editForm.register("role")}
            />
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="edit-isActive"
                {...editForm.register("isActive")}
                className="size-4"
              />
              <label
                htmlFor="edit-isActive"
                className="text-sm font-medium text-dark-4 dark:text-dark-6"
              >
                Aktif
              </label>
            </div>
            <PasswordInput
              id="edit-newPassword"
              label="Password Baru (opsional)"
              placeholder="Kosongkan jika tidak ingin ganti"
              error={editForm.formState.errors.newPassword?.message}
              {...editForm.register("newPassword")}
            />
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={update.isPending}
              >
                {update.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={createForm.handleSubmit(onCreateSubmit)}
            className="flex flex-col gap-4"
          >
            <Input
              id="create-username"
              label="Username"
              placeholder="admin_gudang1"
              error={createForm.formState.errors.username?.message}
              required
              {...createForm.register("username")}
            />
            <Input
              id="create-displayName"
              label="Nama Lengkap"
              error={createForm.formState.errors.displayName?.message}
              required
              {...createForm.register("displayName")}
            />
            <PasswordInput
              id="create-password"
              label="Password"
              error={createForm.formState.errors.password?.message}
              required
              {...createForm.register("password")}
            />
            <Select
              id="create-role"
              label="Role"
              options={ROLE_OPTIONS}
              error={createForm.formState.errors.role?.message}
              {...createForm.register("role")}
            />
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={create.isPending}
              >
                {create.isPending ? "Membuat..." : "Buat User"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
