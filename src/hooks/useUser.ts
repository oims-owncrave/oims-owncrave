"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listUsers, createUser, updateUser, deactivateUser } from "@/services/user";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => listUsers(),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("User berhasil dibuat", toastStyles.primary);
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof updateUser>[1];
    }) => updateUser(id, input),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("User diperbarui", toastStyles.primary);
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.error("User dinonaktifkan");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
