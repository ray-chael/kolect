import { RegisterForm } from "@/components/forms/register-form";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Get started with flexible payments on curated goods
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
