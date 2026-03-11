import { ProtectedHeader } from "@/components/shared/protected-header";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <ProtectedHeader />
      <main>{children}</main>
    </div>
  );
}
