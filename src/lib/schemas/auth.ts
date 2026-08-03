import { z } from "zod";

// Login pakai username saja — di-map ke email sintetis di Server Action.
export const signinSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(30, "Username maksimal 30 karakter")
    .regex(/^[a-z0-9_]+$/, "Username hanya huruf kecil, angka, underscore"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export type SigninInput = z.infer<typeof signinSchema>;
