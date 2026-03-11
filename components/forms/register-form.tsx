"use client";

import { useTransition } from "react";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function RegisterForm() {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    startTransition(async () => {
      const result = await signUp.email({ name, email, password });
      if (result.error) {
        toast.error(result.error.message ?? "Registration failed");
        return;
      }
      toast.success("Account created!");
      window.location.href = "/dashboard";
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Ade Johnson"
          minLength={2}
          required
          disabled={isPending}
        />
      </div>

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

      <Button type="submit" className="w-full h-11 rounded-full font-medium tracking-wide" disabled={isPending}>
        {isPending ? "Creating account..." : "Create Account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <a href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
          Sign in
        </a>
      </p>
    </form>
  );
}
