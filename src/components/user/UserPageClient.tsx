"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { UserTable } from "./UserTable";
import { UserFormModal } from "./UserFormModal";
import type { User } from "@/db/schema";
import { useUsers } from "@/hooks/useUser";

interface Props {
  initialUsers: User[];
  currentUserId: string;
}

export function UserPageClient({ initialUsers, currentUserId }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const { data } = useUsers();

  const users = data ?? initialUsers;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark dark:text-white">
            Manajemen Pengguna
          </h2>
          <p className="text-sm text-dark-5 dark:text-dark-6">
            Kelola akun dan hak akses tim Owncrave
          </p>
        </div>
        <Button
          onClick={() => {
            setEditUser(null);
            setModalOpen(true);
          }}
        >
          + Tambah User
        </Button>
      </div>

      <UserTable
        data={users}
        currentUserId={currentUserId}
        onEdit={(user) => {
          setEditUser(user);
          setModalOpen(true);
        }}
      />

      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editUser={editUser}
      />
    </div>
  );
}
