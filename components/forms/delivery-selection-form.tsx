"use client";

import { useEffect, useState, useTransition } from "react";
import { selectDeliveryMethod } from "@/actions/orders";
import { getUserAddresses } from "@/actions/addresses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { PickupLocationSummary, SavedAddressSummary } from "@/lib/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

interface DeliverySelectionFormProps {
  orderId: string;
  pickupLocations: PickupLocationSummary[];
}

export function DeliverySelectionForm({
  orderId,
  pickupLocations,
}: DeliverySelectionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deliveryMethod, setDeliveryMethod] = useState<"DELIVERY" | "PICKUP">(
    "DELIVERY",
  );

  // Address state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressSummary[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("new");
  const [addressLabel, setAddressLabel] = useState("Home");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [lagosLgas, setLagosLgas] = useState<string[]>([]);

  // Pickup state
  const [pickupLocationId, setPickupLocationId] = useState("");

  // Load saved addresses
  useEffect(() => {
    getUserAddresses().then((res) => {
      if (res.success && res.data) {
        setSavedAddresses(res.data);
        const defaultAddr = res.data.find((a) => a.isDefault);
        if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      }
    });
  }, []);

  // Load Lagos LGAs
  useEffect(() => {
    if (state !== "Lagos" || selectedAddressId !== "new") return;
    if (lagosLgas.length > 0) return;
    let cancelled = false;
    fetch("https://isce-utils-6pzaw.ondigitalocean.app/v1/lgas/states/LA")
      .then((r) => r.json() as Promise<{ data: { name: string }[] }>)
      .then((data) => {
        if (!cancelled) setLagosLgas(data.data.map((lga) => lga.name).sort());
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [state, selectedAddressId, lagosLgas.length]);

  const selectedPickup = pickupLocations.find((l) => l.id === pickupLocationId);

  function handleSubmit() {
    if (deliveryMethod === "PICKUP" && !pickupLocationId) {
      toast.error("Please select a pickup location");
      return;
    }
    if (
      deliveryMethod === "DELIVERY" &&
      selectedAddressId === "new" &&
      (!recipientName || !phone || !addressLine1 || !city || !state)
    ) {
      toast.error("Please fill in all address fields");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("orderId", orderId);
      formData.set("deliveryMethod", deliveryMethod);

      if (deliveryMethod === "PICKUP") {
        formData.set("pickupLocationId", pickupLocationId);
      } else {
        if (selectedAddressId !== "new") {
          formData.set("addressId", selectedAddressId);
        } else {
          formData.set("addressId", "new");
          formData.set("addressLabel", addressLabel);
          formData.set("recipientName", recipientName);
          formData.set("phone", phone);
          formData.set("addressLine1", addressLine1);
          formData.set("addressLine2", addressLine2);
          formData.set("city", city);
          formData.set("state", state);
        }
      }

      const result = await selectDeliveryMethod(formData);
      if (result.success) {
        toast.success("Delivery method saved");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
        Your order is fully paid! Please select how you&apos;d like to receive
        your item.
      </div>

      <Label>Fulfillment method</Label>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setDeliveryMethod("DELIVERY")}
          className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
            deliveryMethod === "DELIVERY"
              ? "border-primary bg-primary/5"
              : "border-border/60 bg-background hover:border-primary/30"
          }`}
        >
          <p className="text-sm font-semibold tracking-tight">Door delivery</p>
        </button>
        <button
          type="button"
          disabled={pickupLocations.length === 0}
          onClick={() => setDeliveryMethod("PICKUP")}
          className={`rounded-2xl border px-3 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            deliveryMethod === "PICKUP"
              ? "border-primary bg-primary/5"
              : "border-border/60 bg-background hover:border-primary/30"
          }`}
        >
          <p className="text-sm font-semibold tracking-tight">Pickup</p>
        </button>
      </div>

      {deliveryMethod === "DELIVERY" ? (
        <div className="space-y-4">
          {savedAddresses.length > 0 && (
            <RadioGroup
              value={selectedAddressId}
              onValueChange={setSelectedAddressId}
              className="space-y-2"
            >
              {savedAddresses.map((addr) => (
                <label
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    selectedAddressId === addr.id
                      ? "border-primary bg-primary/5"
                      : "border-border/60 bg-background hover:border-primary/30"
                  }`}
                >
                  <RadioGroupItem value={addr.id} className="mt-1" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {addr.recipientName} · {addr.phone}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {addr.addressLine1}
                      {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                      {`, ${addr.city}, ${addr.state}`}
                    </p>
                  </div>
                </label>
              ))}
              <label
                onClick={() => setSelectedAddressId("new")}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  selectedAddressId === "new"
                    ? "border-primary bg-primary/5"
                    : "border-border/60 bg-background hover:border-primary/30"
                }`}
              >
                <RadioGroupItem value="new" />
                <span className="text-sm font-medium">Use a new address</span>
              </label>
            </RadioGroup>
          )}

          {selectedAddressId === "new" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ds-address-label">Save address as</Label>
                <Input
                  id="ds-address-label"
                  value={addressLabel}
                  onChange={(e) => setAddressLabel(e.target.value)}
                  placeholder="Home, Office, etc."
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-recipient-name">Recipient name</Label>
                <Input
                  id="ds-recipient-name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-phone">Phone</Label>
                <Input
                  id="ds-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ds-address-line-1">Address line 1</Label>
                <Input
                  id="ds-address-line-1"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ds-address-line-2">
                  Address line 2 (optional)
                </Label>
                <Input
                  id="ds-address-line-2"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-state">State</Label>
                <Select
                  value={state}
                  onValueChange={(v) => {
                    setState(v ?? "");
                    setCity("");
                  }}
                >
                  <SelectTrigger id="ds-state" className="w-full rounded-xl">
                    <SelectValue placeholder="Choose a state" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {state === "Lagos" ? (
                <div className="space-y-2">
                  <Label htmlFor="ds-lga">LGA / Area</Label>
                  <Select value={city} onValueChange={(v) => setCity(v ?? "")}>
                    <SelectTrigger id="ds-lga" className="w-full rounded-xl">
                      <SelectValue
                        placeholder={
                          lagosLgas.length === 0
                            ? "Loading areas…"
                            : "Choose your LGA"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {lagosLgas.map((lga) => (
                        <SelectItem key={lga} value={lga}>
                          {lga}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="ds-city">City</Label>
                  <Input
                    id="ds-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="ds-pickup-location">Pickup location</Label>
            <Select
              value={pickupLocationId}
              onValueChange={(v) => setPickupLocationId(v ?? "")}
            >
              <SelectTrigger
                id="ds-pickup-location"
                className="w-full rounded-xl"
              >
                {selectedPickup ? (
                  <span>
                    {selectedPickup.name} - {selectedPickup.city},{" "}
                    {selectedPickup.state}
                  </span>
                ) : (
                  <SelectValue placeholder="Choose a pickup location" />
                )}
              </SelectTrigger>
              <SelectContent>
                {pickupLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name} - {location.city}, {location.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPickup && (
            <div className="rounded-xl border border-border/60 bg-background px-4 py-3 text-sm">
              <p className="font-medium tracking-tight">
                {selectedPickup.name}
              </p>
              <p className="mt-1 text-muted-foreground">
                {selectedPickup.addressLine1}
                {selectedPickup.addressLine2
                  ? `, ${selectedPickup.addressLine2}`
                  : ""}
                {`, ${selectedPickup.city}, ${selectedPickup.state}`}
              </p>
              {(selectedPickup.contactName || selectedPickup.contactPhone) && (
                <p className="mt-1 text-muted-foreground">
                  {selectedPickup.contactName ?? "Pickup contact"}
                  {selectedPickup.contactPhone
                    ? ` · ${selectedPickup.contactPhone}`
                    : ""}
                </p>
              )}
              {selectedPickup.pickupInstructions && (
                <p className="mt-1 text-xs text-muted-foreground italic">
                  {selectedPickup.pickupInstructions}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full rounded-xl"
      >
        {isPending ? "Saving…" : "Confirm delivery method"}
      </Button>
    </div>
  );
}
