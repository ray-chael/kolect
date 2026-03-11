import { PickupLocationManager } from "@/components/forms/pickup-location-manager";
import { pickupLocationService } from "@/lib/services/pickup-location.service";

export const dynamic = "force-dynamic";

export default async function AdminPickupLocationsPage() {
  const locations = await pickupLocationService.getAll();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <a
        href="/admin"
        className="text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        &larr; Back to Dashboard
      </a>

      <div className="mt-6 mb-8">
        <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">Fulfillment</p>
        <h1 className="font-display text-3xl tracking-tight">Pickup Locations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage store pickup points now and keep external references ready for future Speedaf integration.
        </p>
      </div>

      <PickupLocationManager locations={locations} />
    </div>
  );
}