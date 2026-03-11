import { getSession } from "@/lib/session";
import Link from "next/link";

export async function HeroCTA() {
  const session = await getSession();

  if (session) {
    const dashboardHref = session.user.role === "CRIMSON" ? "/admin" : "/dashboard";
    return (
      <Link
        href={dashboardHref}
        className="inline-flex h-12 items-center rounded-full border border-border px-8 text-sm font-medium tracking-wide hover:border-primary/50 hover:text-primary transition-all duration-300"
      >
        Go to Dashboard
      </Link>
    );
  }

  return (
    <Link
      href="/register"
      className="inline-flex h-12 items-center rounded-full border border-border px-8 text-sm font-medium tracking-wide hover:border-primary/50 hover:text-primary transition-all duration-300"
    >
      Create Account
    </Link>
  );
}
