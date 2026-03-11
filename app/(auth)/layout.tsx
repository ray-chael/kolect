import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary/5 grain">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-warm/10" />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <Link href="/" className="font-display text-xl text-foreground">
            Ade&apos;s Kolekt
          </Link>
          <div className="max-w-md">
            <p className="font-display text-4xl leading-snug tracking-tight text-foreground">
              Premium goods, flexible payments.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Join thousands of savvy shoppers who save on curated items
              by paying at their own pace.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Ade&apos;s Kolekt</p>
        </div>
      </div>

      {/* Right auth form */}
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden mb-8">
            <Link href="/" className="font-display text-xl text-foreground">
              Ade&apos;s Kolekt
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
