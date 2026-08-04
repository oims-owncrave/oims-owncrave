import { z } from "zod";

export const userSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(30)
    .regex(/^[a-z0-9_]+$/, "Hanya huruf kecil, angka, underscore"),
  displayName: z.string().min(1, "Nama wajib diisi").max(100),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum([
    "owner",
    "admin_gudang",
    "admin_produksi",
    "keuangan",
    "viewer",
  ]),
});

// Update schema: pick from base + add isActive (only relevant on update, not create)
export const userUpdateSchema = userSchema
  .pick({ displayName: true, role: true })
  .extend({
    isActive: z.boolean(),
    newPassword: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
  })
  .partial();

export type UserInput = z.infer<typeof userSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
