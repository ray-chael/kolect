import { getSession } from "@/lib/session";
import Link from "next/link";

export async function AuthNav() {
  const session = await getSession();

  if (session) {
    const dashboardHref = session.user.role === "CRIMSON" ? "/admin" : "/dashboard";
    return (
      <Link
        href={dashboardHref}
        className="text-sm tracking-wide px-4 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
      >
        Dashboard
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="text-sm tracking-wide px-4 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
    >
      Sign In
    </Link>
  );
}
