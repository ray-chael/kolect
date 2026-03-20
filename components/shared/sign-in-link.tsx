"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SignInLink({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const href = `/login?callbackUrl=${encodeURIComponent(pathname)}`;

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
