import { getSession } from "@/lib/session";
import Link from "next/link";
import { SignInLink } from "@/components/shared/sign-in-link";

export async function AuthNav() {
  const session = await getSession();

  if (session) {
    const dashboardHref =
      session.user.role === "CRIMSON" ? "/admin" : "/dashboard";
    return (
      <Link
        href={dashboardHref}
        className="text-xs sm:text-sm tracking-wide px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
      >
        Dashboard
      </Link>
    );
  }

  return (
    <SignInLink className="text-xs sm:text-sm tracking-wide px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300">
      Sign In
    </SignInLink>
  );
}
