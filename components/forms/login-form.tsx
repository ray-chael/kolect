"use client";

import { useTransition } from "react";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function LoginForm() {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    startTransition(async () => {
      const result = await signIn.email({ email, password });
      if (result.error) {
        toast.error(result.error.message ?? "Login failed");
        return;
      }
      toast.success("Welcome back!");
      const callbackUrl = new URLSearchParams(window.location.search).get(
        "callbackUrl",
      );
      const user = result.data?.user as { role?: string } | undefined;
      const defaultDest = user?.role === "ADMIN" ? "/admin" : "/dashboard";
      window.location.href = callbackUrl ?? defaultDest;
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          minLength={8}
          required
          disabled={isPending}
        />
      </div>

      <Button
        type="submit"
        className="w-full h-11 rounded-full font-medium tracking-wide"
        disabled={isPending}
      >
        {isPending ? "Signing in..." : "Sign In"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <a
          href="/register"
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Create one
        </a>
      </p>
    </form>
  );
}
