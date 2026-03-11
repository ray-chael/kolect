"use client";

import { useState, useTransition } from "react";
import { MapPin, Plus, Pencil, Trash2, Star, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/actions/addresses";
import type { DeliveryAddress } from "@/app/generated/prisma/client";

interface AddressManagerProps {
  addresses: DeliveryAddress[];
}

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

interface FormState {
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
}

const EMPTY_FORM: FormState = {
  label: "Home",
  recipientName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
};

function AddressForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
}: {
  initial: FormState;
  onSubmit: (data: FormState) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);

  function set(field: keyof FormState, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            value={form.label}
            onChange={(e) => set("label", e.target.value)}
            placeholder="Home / Office / etc."
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="recipientName">Recipient Name</Label>
          <Input
            id="recipientName"
            value={form.recipientName}
            onChange={(e) => set("recipientName", e.target.value)}
            placeholder="Full name of recipient"
            required
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="e.g. 08012345678"
            required
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="City"
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="addressLine1">Address Line 1</Label>
        <Input
          id="addressLine1"
          value={form.addressLine1}
          onChange={(e) => set("addressLine1", e.target.value)}
          placeholder="Street address, house number"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="addressLine2">Address Line 2 (optional)</Label>
        <Input
          id="addressLine2"
          value={form.addressLine2}
          onChange={(e) => set("addressLine2", e.target.value)}
          placeholder="Apartment, suite, landmark"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="state">State</Label>
        <select
        title='Select the state for this address'
          id="state"
          value={form.state}
          onChange={(e) => set("state", e.target.value)}
          required
          disabled={isPending}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select state</option>
          {NIGERIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" disabled={isPending} size="sm">
          <Check className="mr-1.5 h-4 w-4" />
          {isPending ? "Saving…" : "Save Address"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          <X className="mr-1.5 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function AddressManager({ addresses: initial }: AddressManagerProps) {
  const [addresses, setAddresses] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(data: FormState) {
    startTransition(async () => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.set(k, v));
      const result = await createAddress(fd);
      if (result.success) {
        toast.success("Address added");
        setShowAdd(false);
        // Refresh by re-fetching from server — simplest is to reload
        window.location.reload();
      } else {
        toast.error(result.message ?? "Failed to add address");
      }
    });
  }

  function handleUpdate(id: string, data: FormState) {
    startTransition(async () => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.set(k, v));
      const result = await updateAddress(id, fd);
      if (result.success) {
        toast.success("Address updated");
        setEditingId(null);
        window.location.reload();
      } else {
        toast.error(result.message ?? "Failed to update address");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteAddress(id);
      if (result.success) {
        toast.success("Address removed");
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      } else {
        toast.error(result.message ?? "Failed to delete address");
      }
    });
  }

  function handleSetDefault(id: string) {
    startTransition(async () => {
      const result = await setDefaultAddress(id);
      if (result.success) {
        toast.success("Default address updated");
        setAddresses((prev) =>
          prev.map((a) => ({ ...a, isDefault: a.id === id }))
        );
      } else {
        toast.error(result.message ?? "Failed to update default");
      }
    });
  }

  return (
    <div className="space-y-4">
      {addresses.length === 0 && !showAdd && (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card p-8 text-center space-y-3">
          <MapPin className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No delivery addresses yet.</p>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Address
          </Button>
        </div>
      )}

      {addresses.map((address) => (
        <div
          key={address.id}
          className="rounded-2xl border border-border/60 bg-card p-5 space-y-4"
        >
          {editingId === address.id ? (
            <AddressForm
              initial={{
                label: address.label,
                recipientName: address.recipientName,
                phone: address.phone,
                addressLine1: address.addressLine1,
                addressLine2: address.addressLine2 ?? "",
                city: address.city,
                state: address.state,
              }}
              onSubmit={(data) => handleUpdate(address.id, data)}
              onCancel={() => setEditingId(null)}
              isPending={isPending}
            />
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                    {address.label}
                  </span>
                  {address.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      <Star className="h-2.5 w-2.5 fill-primary" />
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">{address.recipientName}</p>
                <p className="text-sm text-muted-foreground">{address.phone}</p>
                <p className="text-sm text-muted-foreground">
                  {address.addressLine1}
                  {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  {address.city}, {address.state}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    disabled={isPending}
                    title="Set as default"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setEditingId(address.id)}
                  disabled={isPending}
                  title="Edit address"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  disabled={isPending}
                  title="Delete address"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add new address */}
      {showAdd ? (
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-4">
            New Address
          </p>
          <AddressForm
            initial={EMPTY_FORM}
            onSubmit={handleAdd}
            onCancel={() => setShowAdd(false)}
            isPending={isPending}
          />
        </div>
      ) : (
        addresses.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Another Address
          </Button>
        )
      )}
    </div>
  );
}
