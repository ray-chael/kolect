"use client";

import { useState, useTransition } from "react";
import {
  createPickupLocation,
  deletePickupLocation,
  updatePickupLocation,
} from "@/actions/pickup-locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { LogisticsProvider } from "@/lib/types";

interface PickupLocationItem {
  id: string;
  name: string;
  description: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  landmark: string | null;
  contactName: string | null;
  contactPhone: string | null;
  pickupInstructions: string | null;
  logisticsProvider: LogisticsProvider;
  externalReference: string | null;
  isActive: boolean;
}

const PROVIDERS: LogisticsProvider[] = ["INTERNAL", "SPEEDAF"];

export function PickupLocationManager({
  locations,
}: {
  locations: PickupLocationItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createPickupLocation(formData);
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success("Pickup location created");
      window.location.reload();
    });
  }

  function handleUpdate(locationId: string, formData: FormData) {
    startTransition(async () => {
      const result = await updatePickupLocation(locationId, formData);
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success("Pickup location updated");
      setEditingId(null);
      window.location.reload();
    });
  }

  function handleDelete(locationId: string, name: string) {
    if (!confirm(`Delete pickup location "${name}"?`)) return;

    startTransition(async () => {
      const result = await deletePickupLocation(locationId);
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success("Pickup location deleted");
      window.location.reload();
    });
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
        <h2 className="font-display text-xl tracking-tight">Add Pickup Location</h2>

        <form action={handleCreate} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Location name</Label>
            <Input id="name" name="name" required className="rounded-xl" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" className="rounded-xl" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="addressLine1">Address line 1</Label>
            <Input id="addressLine1" name="addressLine1" required className="rounded-xl" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="addressLine2">Address line 2</Label>
            <Input id="addressLine2" name="addressLine2" className="rounded-xl" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" required className="rounded-xl" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" required className="rounded-xl" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmark">Landmark</Label>
            <Input id="landmark" name="landmark" className="rounded-xl" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName">Contact name</Label>
            <Input id="contactName" name="contactName" className="rounded-xl" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Contact phone</Label>
            <Input id="contactPhone" name="contactPhone" className="rounded-xl" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="externalReference">External reference</Label>
            <Input id="externalReference" name="externalReference" className="rounded-xl" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Pickup instructions</Label>
            <textarea
              name="pickupInstructions"
              title="Pickup instructions"
              aria-label="Pickup instructions"
              placeholder="How should shoppers collect from this location?"
              rows={3}
              className="flex w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logisticsProvider">Logistics provider</Label>
            <select
              id="logisticsProvider"
              name="logisticsProvider"
              title="Logistics provider"
              defaultValue="INTERNAL"
              className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm"
            >
              {PROVIDERS.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="isActive">Status</Label>
            <select
              id="isActive"
              name="isActive"
              title="Pickup location status"
              defaultValue="true"
              className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={isPending} className="rounded-full">
              {isPending ? "Saving..." : "Create Pickup Location"}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
        <h2 className="font-display text-xl tracking-tight">Pickup Locations</h2>

        {locations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pickup locations yet.</p>
        ) : (
          <div className="space-y-4">
            {locations.map((location) => {
              const isEditing = editingId === location.id;

              return (
                <div key={location.id} className="rounded-2xl border border-border/50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium tracking-tight">{location.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {location.addressLine1}, {location.city}, {location.state}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {location.logisticsProvider} • {location.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setEditingId(isEditing ? null : location.id)}
                      >
                        {isEditing ? "Close" : "Edit"}
                      </Button>
                      <button
                        type="button"
                        title="Delete pickup location"
                        onClick={() => handleDelete(location.id, location.name)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <form
                      action={(formData) => handleUpdate(location.id, formData)}
                      className="mt-4 grid gap-4 md:grid-cols-2"
                    >
                      <div className="space-y-2 md:col-span-2">
                        <Label>Location name</Label>
                        <Input name="name" defaultValue={location.name} required className="rounded-xl" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Description</Label>
                        <Input name="description" defaultValue={location.description ?? ""} className="rounded-xl" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Address line 1</Label>
                        <Input name="addressLine1" defaultValue={location.addressLine1} required className="rounded-xl" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Address line 2</Label>
                        <Input name="addressLine2" defaultValue={location.addressLine2 ?? ""} className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input name="city" defaultValue={location.city} required className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Input name="state" defaultValue={location.state} required className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label>Landmark</Label>
                        <Input name="landmark" defaultValue={location.landmark ?? ""} className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact name</Label>
                        <Input name="contactName" defaultValue={location.contactName ?? ""} className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact phone</Label>
                        <Input name="contactPhone" defaultValue={location.contactPhone ?? ""} className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label>External reference</Label>
                        <Input name="externalReference" defaultValue={location.externalReference ?? ""} className="rounded-xl" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Pickup instructions</Label>
                        <textarea
                          name="pickupInstructions"
                          title="Pickup instructions"
                          aria-label="Pickup instructions"
                          placeholder="How should shoppers collect from this location?"
                          rows={3}
                          defaultValue={location.pickupInstructions ?? ""}
                          className="flex w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Logistics provider</Label>
                        <select
                          name="logisticsProvider"
                          title="Logistics provider"
                          defaultValue={location.logisticsProvider}
                          className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm"
                        >
                          {PROVIDERS.map((provider) => (
                            <option key={provider} value={provider}>
                              {provider}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <select
                          name="isActive"
                          title="Pickup location status"
                          defaultValue={String(location.isActive)}
                          className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <Button type="submit" disabled={isPending} className="rounded-full">
                          {isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}