import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AddressManager } from "@/components/forms/address-manager";

export default async function ProfilePage() {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/login");

  const addresses = await prisma.deliveryAddress.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 space-y-12">
      {/* Header */}
      <div>
        <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">Account</p>
        <h1 className="font-display text-4xl tracking-tight">My Profile</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account information and delivery addresses.
        </p>
      </div>

      {/* Account info */}
      <section className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
          Account Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Full Name</p>
            <p className="text-sm font-medium">{session.user.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Email Address</p>
            <p className="text-sm font-medium">{session.user.email}</p>
          </div>
          {(session.user as { phone?: string }).phone && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Phone Number</p>
              <p className="text-sm font-medium">
                {(session.user as { phone?: string }).phone}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Delivery addresses */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
            Delivery Addresses
          </h2>
        </div>
        <AddressManager addresses={addresses} />
      </section>
    </div>
  );
}
