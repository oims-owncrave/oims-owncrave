"use client";

import { useState } from "react";
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
      <h2 className="text-2xl font-bold text-dark dark:text-white">Manajemen Pengguna</h2>

      <UserTable
        data={users}
        currentUserId={currentUserId}
        onAdd={() => {
          setEditUser(null);
          setModalOpen(true);
        }}
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
