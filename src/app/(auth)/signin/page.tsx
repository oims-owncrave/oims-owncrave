"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { signinSchema, type SigninInput } from "@/lib/schemas/auth";
import { signInAction } from "@/services/auth";

export default function SigninPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SigninInput>({
    resolver: zodResolver(signinSchema),
  });

  async function onSubmit(data: SigninInput) {
    const result = await signInAction(data);
    if (result?.error) {
      toast.error(result.error);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">OIMS Owncrave</h1>
          <p className="mt-1 text-sm text-gray-500">Masuk ke akun Anda</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            id="username"
            type="text"
            label="Username"
            placeholder="superadmin"
            autoComplete="username"
            error={errors.username?.message}
            required
            {...register("username")}
          />
          <PasswordInput
            id="password"
            label="Password"
            placeholder="••••••••"
            error={errors.password?.message}
            required
            {...register("password")}
          />
          <Button
            type="submit"
            className="mt-2 w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Masuk..." : "Masuk"}
          </Button>
        </form>
      </div>
    </div>
  );
}
