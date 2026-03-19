"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  computeDeliveryFeeKobo,
  type DeliveryRates,
} from "@/lib/utils/delivery-rates";
import { createOrder } from "@/actions/orders";
import { initiatePayment } from "@/actions/orders";
import { getSpeedafQuote } from "@/actions/shipping";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useSession } from "@/lib/auth-client";
import {
  formatNaira,
  type PickupLocationSummary,
  type ProductCustomField,
  type SavedAddressSummary,
} from "@/lib/types";
import {
  calculateContributionPlan,
  clampContributionDuration,
  getContributionDurationLimits,
  type ContributionCadence,
} from "@/lib/utils";
import { toast } from "sonner";

type PurchaseMode = "buy-now" | "contribute";

const CADENCE_OPTIONS: Array<{ value: ContributionCadence; label: string }> = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

interface ProductPurchasePanelProps {
  productId: string;
  productName: string;
  colors: string[];
  sizes: string[];
  customFields: ProductCustomField[];
  pickupLocations: PickupLocationSummary[];
  savedAddresses: SavedAddressSummary[];
  moq: number;
  totalPrice: number;
  salePrice?: number;
  priceLockDays: number;
  hasAcceptedTerms: boolean;
  speedafEnabled: boolean;
  productWeightKg: number;
  /** Distance-based delivery rates from admin settings. */
  deliveryRates: DeliveryRates;
}

export function ProductPurchasePanel({
  productId,
  productName,
  colors,
  sizes,
  customFields,
  pickupLocations,
  savedAddresses,
  moq,
  totalPrice,
  salePrice,
  priceLockDays,
  hasAcceptedTerms,
  speedafEnabled,
  productWeightKg,
  deliveryRates,
}: ProductPurchasePanelProps) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>("buy-now");
  const [quantity, setQuantity] = useState(moq);
  const [deliveryMethod, setDeliveryMethod] = useState<"DELIVERY" | "PICKUP">(
    "DELIVERY",
  );
  const [pickupLocationId, setPickupLocationId] = useState(
    pickupLocations[0]?.id ?? "",
  );
  const [contributionCadence, setContributionCadence] =
    useState<ContributionCadence>("monthly");
  const [contributionDuration, setContributionDuration] = useState(1);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    savedAddresses.find((a) => a.isDefault)?.id ??
      savedAddresses[0]?.id ??
      "new",
  );
  const [addressLabel, setAddressLabel] = useState("Home");
  const [termsAccepted, setTermsAccepted] = useState(hasAcceptedTerms);
  const [logisticsProvider, setLogisticsProvider] = useState<
    "INTERNAL" | "SPEEDAF"
  >("INTERNAL");
  const [customSelections, setCustomSelections] = useState<
    Record<string, string>
  >({});
  const [speedafQuote, setSpeedafQuote] = useState<{
    fee: number;
    currency: string;
  } | null>(null);
  const [speedafQuoteLoading, setSpeedafQuoteLoading] = useState(false);
  const [speedafQuoteError, setSpeedafQuoteError] = useState<string | null>(
    null,
  );
  const [lagosLgas, setLagosLgas] = useState<string[]>([]);

  // Resolve the destination state from the chosen address or the new-address form
  const effectiveState = useMemo(() => {
    if (deliveryMethod !== "DELIVERY") return "";
    if (selectedAddressId !== "new") {
      return (
        savedAddresses.find((a) => a.id === selectedAddressId)?.state ?? ""
      );
    }
    return state;
  }, [deliveryMethod, selectedAddressId, savedAddresses, state]);

  // Resolve the LGA / city from the chosen address or the new-address form
  const effectiveCity = useMemo(() => {
    if (deliveryMethod !== "DELIVERY") return "";
    if (selectedAddressId !== "new") {
      return savedAddresses.find((a) => a.id === selectedAddressId)?.city ?? "";
    }
    return city;
  }, [deliveryMethod, selectedAddressId, savedAddresses, city]);

  // Fetch Lagos LGA list when user selects Lagos in the new-address form
  useEffect(() => {
    if (effectiveState !== "Lagos" || selectedAddressId !== "new") return;
    if (lagosLgas.length > 0) return; // already loaded
    let cancelled = false;
    fetch("https://isce-utils-6pzaw.ondigitalocean.app/v1/lgas/states/LA")
      .then((r) => r.json() as Promise<{ data: { name: string }[] }>)
      .then((data) => {
        if (!cancelled) setLagosLgas(data.data.map((lga) => lga.name).sort());
      })
      .catch(() => {
        /* silently ignore — user can type city manually */
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveState, selectedAddressId, lagosLgas.length]);

  // Auto-fetch Speedaf quote whenever the provider, destination state, or weight changes
  useEffect(() => {
    if (logisticsProvider !== "SPEEDAF" || !effectiveState) {
      setSpeedafQuote(null);
      setSpeedafQuoteError(null);
      return;
    }
    let cancelled = false;
    setSpeedafQuoteLoading(true);
    setSpeedafQuoteError(null);
    getSpeedafQuote(effectiveState, productWeightKg).then((result) => {
      if (cancelled) return;
      setSpeedafQuoteLoading(false);
      if (result.success && result.data) {
        setSpeedafQuote(result.data);
      } else {
        setSpeedafQuoteError(result.message ?? "Quote unavailable");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [logisticsProvider, effectiveState, productWeightKg]);

  const effectiveUnitPrice = salePrice ?? totalPrice;
  const effectiveTotal = effectiveUnitPrice * quantity;
  // Delivery fee only applies for standard (internal) door delivery — Speedaf is quoted separately
  const effectiveDeliveryFee = useMemo(
    () =>
      deliveryMethod === "DELIVERY" &&
      logisticsProvider !== "SPEEDAF" &&
      effectiveState
        ? computeDeliveryFeeKobo(effectiveState, effectiveCity, deliveryRates)
        : 0,
    [
      deliveryMethod,
      logisticsProvider,
      effectiveState,
      effectiveCity,
      deliveryRates,
    ],
  );
  const grandTotal = effectiveTotal + effectiveDeliveryFee;
  const contributionPlan = useMemo(
    () =>
      calculateContributionPlan({
        totalPrice: effectiveTotal,
        cadence: contributionCadence,
        duration: contributionDuration,
      }),
    [contributionCadence, contributionDuration, effectiveTotal],
  );
  const selectedInstallmentMonths =
    purchaseMode === "buy-now" ? 1 : contributionPlan.installmentMonths;
  const durationLimits = getContributionDurationLimits(contributionCadence);
  const selectedPickupLocation = pickupLocations.find(
    (location) => location.id === pickupLocationId,
  );

  const requiredFieldErrors = useMemo(() => {
    return customFields
      .filter((field) => field.required && !customSelections[field.id]?.trim())
      .map((field) => field.label);
  }, [customFields, customSelections]);

  const fulfillmentErrors = useMemo(() => {
    if (deliveryMethod === "PICKUP") {
      return pickupLocationId ? [] : ["Pickup location"];
    }

    if (selectedAddressId !== "new") {
      return [];
    }

    return [
      { label: "Recipient name", value: recipientName },
      { label: "Phone", value: phone },
      { label: "Address", value: addressLine1 },
      { label: state === "Lagos" ? "LGA / Area" : "City", value: city },
      { label: "State", value: state },
    ]
      .filter((field) => !field.value.trim())
      .map((field) => field.label);
  }, [
    addressLine1,
    city,
    deliveryMethod,
    phone,
    pickupLocationId,
    recipientName,
    selectedAddressId,
    state,
  ]);

  function handleCustomSelection(fieldId: string, value: string) {
    setCustomSelections((current) => ({ ...current, [fieldId]: value }));
  }

  function handleCadenceChange(nextCadence: ContributionCadence) {
    setContributionCadence(nextCadence);
    setContributionDuration((current) =>
      clampContributionDuration(nextCadence, current),
    );
  }

  function handleDeliveryMethodChange(nextMethod: "DELIVERY" | "PICKUP") {
    setDeliveryMethod(nextMethod);
    if (nextMethod === "PICKUP" && !pickupLocationId && pickupLocations[0]) {
      setPickupLocationId(pickupLocations[0].id);
    }
  }

  function handleStateChange(v: string | null) {
    setState(v ?? "");
    setCity(""); // reset city / LGA whenever the state changes
  }

  function handleSubmit(formData: FormData) {
    if (requiredFieldErrors.length > 0) {
      toast.error(
        `Complete required fields: ${requiredFieldErrors.join(", ")}`,
      );
      return;
    }

    if (fulfillmentErrors.length > 0) {
      toast.error(`Complete required details: ${fulfillmentErrors.join(", ")}`);
      return;
    }

    if (!termsAccepted) {
      toast.error(
        "You must agree to the terms and conditions before continuing.",
      );
      return;
    }

    formData.set("productId", productId);
    formData.set("quantity", String(quantity));
    formData.set("termsAccepted", String(termsAccepted));
    formData.set("deliveryMethod", deliveryMethod);
    formData.set("pickupLocationId", pickupLocationId);
    if (deliveryMethod === "DELIVERY" && selectedAddressId !== "new") {
      formData.set("addressId", selectedAddressId);
    } else {
      formData.set("recipientName", recipientName);
      formData.set("phone", phone);
      formData.set("addressLine1", addressLine1);
      formData.set("addressLine2", addressLine2);
      formData.set("city", city);
      formData.set("state", state);
      formData.set("addressLabel", addressLabel);
    }
    formData.set("purchaseMode", purchaseMode);
    formData.set("installmentMonths", String(selectedInstallmentMonths));
    formData.set("contributionCadence", contributionCadence);
    formData.set("contributionDuration", String(contributionPlan.duration));
    formData.set("selectedColor", selectedColor);
    formData.set("selectedSize", selectedSize);
    formData.set("customSelections", JSON.stringify(customSelections));
    formData.set("logisticsProvider", logisticsProvider);

    startTransition(async () => {
      const result = await createOrder(formData);
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      if (
        result.data &&
        typeof result.data === "object" &&
        "orderId" in result.data
      ) {
        const orderId = String(result.data.orderId);

        const paymentFormData = new FormData();
        paymentFormData.set("orderId", orderId);

        if (purchaseMode === "buy-now") {
          paymentFormData.set("amount", String(grandTotal));
        } else {
          // Contribute mode — collect 20% deposit upfront
          paymentFormData.set("amount", String(contributionPlan.depositAmount));
        }

        const paymentResult = await initiatePayment(paymentFormData);
        if (!paymentResult.success) {
          toast.error(paymentResult.message ?? "Unable to start payment.");
          window.location.href = `/orders/${orderId}`;
          return;
        }

        toast.success(
          purchaseMode === "buy-now"
            ? "Order created. Redirecting to secure checkout..."
            : "Order created. Redirecting to pay your 20% deposit...",
        );
        if (paymentResult.data?.authorizationUrl) {
          window.location.href = paymentResult.data.authorizationUrl;
          return;
        }

        window.location.href = `/orders/${orderId}`;
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-6">
      {salePrice && (
        <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-semibold text-primary">Flash Sale</span>
          <span className="text-muted-foreground line-through">
            {formatNaira(totalPrice)}
          </span>
          <span className="font-bold text-primary">
            {formatNaira(salePrice)}
          </span>
          <span className="text-xs text-primary/70">
            ({Math.round((1 - salePrice / totalPrice) * 100)}% off)
          </span>
        </div>
      )}
      <h3 className="font-display text-xl tracking-tight">Choose your setup</h3>

      <form action={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>Purchase option</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPurchaseMode("buy-now")}
              className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                purchaseMode === "buy-now"
                  ? "border-primary bg-primary/5"
                  : "border-border/60 bg-background hover:border-primary/30"
              }`}
            >
              <p className="text-sm font-semibold tracking-tight">
                Buy immediately
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatNaira(effectiveTotal)} full payment
              </p>
            </button>
            <button
              type="button"
              onClick={() => setPurchaseMode("contribute")}
              className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                purchaseMode === "contribute"
                  ? "border-primary bg-primary/5"
                  : "border-border/60 bg-background hover:border-primary/30"
              }`}
            >
              <p className="text-sm font-semibold tracking-tight">
                Contribute to buy
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                20% deposit + installments
              </p>
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
          <Label>Fulfillment</Label>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleDeliveryMethodChange("DELIVERY")}
              className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
                deliveryMethod === "DELIVERY"
                  ? "border-primary bg-primary/5"
                  : "border-border/60 bg-background hover:border-primary/30"
              }`}
            >
              <p className="text-sm font-semibold tracking-tight">
                Door delivery
              </p>
            </button>
            <button
              type="button"
              disabled={pickupLocations.length === 0}
              onClick={() => handleDeliveryMethodChange("PICKUP")}
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
                          <span className="text-sm font-medium">
                            {addr.label}
                          </span>
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
                    <span className="text-sm font-medium">
                      Use a new address
                    </span>
                  </label>
                </RadioGroup>
              )}

              {selectedAddressId === "new" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address-label">Save address as</Label>
                    <Input
                      id="address-label"
                      value={addressLabel}
                      onChange={(event) => setAddressLabel(event.target.value)}
                      placeholder="Home, Office, etc."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipient-name">Recipient name</Label>
                    <Input
                      id="recipient-name"
                      value={recipientName}
                      onChange={(event) => setRecipientName(event.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address-line-1">Address line 1</Label>
                    <Input
                      id="address-line-1"
                      value={addressLine1}
                      onChange={(event) => setAddressLine1(event.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address-line-2">
                      Address line 2 (optional)
                    </Label>
                    <Input
                      id="address-line-2"
                      value={addressLine2}
                      onChange={(event) => setAddressLine2(event.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select value={state} onValueChange={handleStateChange}>
                      <SelectTrigger id="state" className="w-full rounded-xl">
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

                  {/* City / LGA — LGA selector for Lagos, free-text otherwise */}
                  {state === "Lagos" ? (
                    <div className="space-y-2">
                      <Label htmlFor="lga">LGA / Area</Label>
                      <Select
                        value={city}
                        onValueChange={(v) => setCity(v ?? "")}
                      >
                        <SelectTrigger id="lga" className="w-full rounded-xl">
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
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(event) => setCity(event.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  )}
                </div>
              )}

              {speedafEnabled && (
                <div className="space-y-2">
                  <Label>Delivery provider</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setLogisticsProvider("INTERNAL")}
                      className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                        logisticsProvider === "INTERNAL"
                          ? "border-primary bg-primary/5"
                          : "border-border/60 bg-background hover:border-primary/30"
                      }`}
                    >
                      <p className="text-sm font-semibold tracking-tight">
                        Standard delivery
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Handled in-house by our team.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogisticsProvider("SPEEDAF")}
                      className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                        logisticsProvider === "SPEEDAF"
                          ? "border-primary bg-primary/5"
                          : "border-border/60 bg-background hover:border-primary/30"
                      }`}
                    >
                      <p className="text-sm font-semibold tracking-tight">
                        Speedaf Express
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Fast door-to-door delivery via Speedaf courier.
                      </p>
                      {logisticsProvider === "SPEEDAF" && (
                        <p className="mt-2 text-xs font-medium">
                          {speedafQuoteLoading ? (
                            <span className="text-muted-foreground animate-pulse">
                              Getting rate…
                            </span>
                          ) : speedafQuote ? (
                            <span className="text-primary">
                              {new Intl.NumberFormat("en-NG", {
                                style: "currency",
                                currency: speedafQuote.currency,
                                minimumFractionDigits: 0,
                              }).format(speedafQuote.fee)}{" "}
                              shipping
                            </span>
                          ) : speedafQuoteError ? (
                            <span className="text-destructive">
                              {speedafQuoteError}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Select a delivery state to see rate
                            </span>
                          )}
                        </p>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="pickup-location">Pickup location</Label>
                <Select
                  value={pickupLocationId}
                  onValueChange={(v) => setPickupLocationId(v ?? "")}
                >
                  <SelectTrigger
                    id="pickup-location"
                    className="w-full rounded-xl"
                  >
                    <SelectValue placeholder="Choose a pickup location" />
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

              {selectedPickupLocation && (
                <div className="rounded-xl border border-border/60 bg-background px-4 py-3 text-sm">
                  <p className="font-medium tracking-tight">
                    {selectedPickupLocation.name}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {selectedPickupLocation.addressLine1}
                    {selectedPickupLocation.addressLine2
                      ? `, ${selectedPickupLocation.addressLine2}`
                      : ""}
                    {`, ${selectedPickupLocation.city}, ${selectedPickupLocation.state}`}
                  </p>
                  {(selectedPickupLocation.contactName ||
                    selectedPickupLocation.contactPhone) && (
                    <p className="mt-1 text-muted-foreground">
                      {selectedPickupLocation.contactName ?? "Pickup contact"}
                      {selectedPickupLocation.contactPhone
                        ? ` • ${selectedPickupLocation.contactPhone}`
                        : ""}
                    </p>
                  )}
                  {selectedPickupLocation.pickupInstructions && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {selectedPickupLocation.pickupInstructions}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={moq}
              value={quantity}
              onChange={(event) =>
                setQuantity(Math.max(moq, Number(event.target.value) || moq))
              }
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              Minimum order quantity: {moq}
            </p>
          </div>

          {purchaseMode === "contribute" && (
            <div className="space-y-2">
              <Label>Cadence</Label>
              <div className="flex flex-wrap gap-2">
                {CADENCE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleCadenceChange(option.value)}
                    className={`rounded-full px-3 py-2 text-sm transition-colors ${
                      contributionCadence === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {purchaseMode === "contribute" && (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="contribution-duration">Duration</Label>
              <p className="font-medium tracking-tight text-sm">
                {contributionPlan.durationLabel}
              </p>
            </div>

            <input
              id="contribution-duration"
              type="range"
              title="Contribution duration"
              aria-label="Contribution duration"
              min={durationLimits.min}
              max={durationLimits.max}
              step={durationLimits.step}
              value={contributionPlan.duration}
              onChange={(event) =>
                setContributionDuration(
                  clampContributionDuration(
                    contributionCadence,
                    Number(event.target.value),
                  ),
                )
              }
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted"
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Min {durationLimits.min} {durationLimits.unit}
              </span>
              <span>
                Max {durationLimits.max} {durationLimits.unit}
              </span>
            </div>
          </div>
        )}

        {colors.length > 0 && (
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    selectedColor === color
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-background hover:border-primary/40"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}

        {sizes.length > 0 && (
          <div className="space-y-2">
            <Label>Size</Label>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    selectedSize === size
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-background hover:border-primary/40"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {customFields.length > 0 && (
          <div className="space-y-4">
            {customFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>
                  {field.label}
                  {field.required ? " *" : ""}
                </Label>

                {field.type === "select" ? (
                  <Select
                    value={customSelections[field.id] ?? ""}
                    onValueChange={(v) =>
                      handleCustomSelection(field.id, v ?? "")
                    }
                  >
                    <SelectTrigger id={field.id} className="w-full rounded-xl">
                      <SelectValue
                        placeholder={`Choose ${field.label.toLowerCase()}`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option) => (
                        <SelectItem
                          key={`${field.id}-${option.value}`}
                          value={option.value}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.id}
                    value={customSelections[field.id] ?? ""}
                    onChange={(event) =>
                      handleCustomSelection(field.id, event.target.value)
                    }
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="rounded-xl"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cash price</span>
            <span className="font-medium">{formatNaira(effectiveTotal)}</span>
          </div>
          {purchaseMode === "contribute" ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Contribution uplift (
                  {Math.round(contributionPlan.surchargeRate * 100)}%)
                </span>
                <span className="font-medium">
                  {formatNaira(contributionPlan.surchargeAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan total</span>
                <span className="font-medium">
                  {formatNaira(contributionPlan.adjustedTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Deposit to lock price
                </span>
                <span className="font-medium text-primary">
                  {formatNaira(contributionPlan.depositAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Remaining after deposit
                </span>
                <span className="font-medium">
                  {formatNaira(contributionPlan.remainingBalance)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fulfillment</span>
                <span className="font-medium">
                  {deliveryMethod === "PICKUP" ? "Pickup" : "Door delivery"}
                </span>
              </div>
              {logisticsProvider === "SPEEDAF" &&
                deliveryMethod === "DELIVERY" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Speedaf shipping
                    </span>
                    <span className="font-medium">
                      {speedafQuoteLoading ? (
                        <span className="animate-pulse text-muted-foreground">
                          Calculating…
                        </span>
                      ) : speedafQuote ? (
                        new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: speedafQuote.currency,
                          minimumFractionDigits: 0,
                        }).format(speedafQuote.fee)
                      ) : (
                        <span className="text-muted-foreground">TBD</span>
                      )}
                    </span>
                  </div>
                )}
              {logisticsProvider !== "SPEEDAF" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {deliveryMethod === "PICKUP"
                      ? "Pickup fee"
                      : "Standard delivery"}
                  </span>
                  <span className="font-medium">
                    {(() => {
                      if (deliveryMethod === "PICKUP")
                        return (
                          <span className="text-green-600 dark:text-green-400">
                            Free
                          </span>
                        );
                      if (!effectiveState)
                        return (
                          <span className="text-muted-foreground text-xs">
                            Select state
                          </span>
                        );
                      if (effectiveDeliveryFee === 0)
                        return (
                          <span className="text-green-600 dark:text-green-400">
                            Free
                          </span>
                        );
                      return formatNaira(effectiveDeliveryFee);
                    })()}
                  </span>
                </div>
              )}
              <div className="border-t border-border/60 pt-2 flex justify-between">
                <span className="text-muted-foreground">
                  {
                    CADENCE_OPTIONS.find(
                      (option) => option.value === contributionCadence,
                    )?.label
                  }{" "}
                  target × {contributionPlan.installmentCount}
                </span>
                <span className="font-display text-lg font-semibold">
                  {formatNaira(contributionPlan.installmentAmount)}/
                  {contributionPlan.intervalLabel}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                You will pay {formatNaira(contributionPlan.depositAmount)}{" "}
                deposit now. Price locked for {priceLockDays} days.
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fulfillment</span>
                <span className="font-medium">
                  {deliveryMethod === "PICKUP" ? "Pickup" : "Door delivery"}
                </span>
              </div>
              {logisticsProvider === "SPEEDAF" &&
                deliveryMethod === "DELIVERY" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Speedaf shipping
                    </span>
                    <span className="font-medium">
                      {speedafQuoteLoading ? (
                        <span className="animate-pulse text-muted-foreground">
                          Calculating…
                        </span>
                      ) : speedafQuote ? (
                        new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: speedafQuote.currency,
                          minimumFractionDigits: 0,
                        }).format(speedafQuote.fee)
                      ) : (
                        <span className="text-muted-foreground">TBD</span>
                      )}
                    </span>
                  </div>
                )}
              {logisticsProvider !== "SPEEDAF" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {deliveryMethod === "PICKUP"
                      ? "Pickup fee"
                      : "Standard delivery"}
                  </span>
                  <span className="font-medium">
                    {(() => {
                      if (deliveryMethod === "PICKUP")
                        return (
                          <span className="text-green-600 dark:text-green-400">
                            Free
                          </span>
                        );
                      if (!effectiveState)
                        return (
                          <span className="text-muted-foreground text-xs">
                            Select state
                          </span>
                        );
                      if (effectiveDeliveryFee === 0)
                        return (
                          <span className="text-green-600 dark:text-green-400">
                            Free
                          </span>
                        );
                      return formatNaira(effectiveDeliveryFee);
                    })()}
                  </span>
                </div>
              )}
              <div className="border-t border-border/60 pt-2 flex justify-between">
                <span className="text-muted-foreground">Pay now</span>
                <span className="font-display text-lg font-semibold">
                  {formatNaira(grandTotal)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Full-payment checkout starts immediately after the order is
                created.
              </p>
            </>
          )}
        </div>

        {hasAcceptedTerms ? (
          <p className="text-xs text-muted-foreground">
            You have agreed to the{" "}
            <a
              href="/terms"
              className="font-medium text-primary hover:underline"
            >
              service agreement
            </a>
            .
          </p>
        ) : (
          <label
            htmlFor="terms-accepted"
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm"
          >
            <Checkbox
              id="terms-accepted"
              checked={termsAccepted}
              onCheckedChange={(v) => setTermsAccepted(v === true)}
              className="mt-0.5"
            />
            <span className="text-muted-foreground">
              I agree to the{" "}
              <a
                href="/terms"
                className="font-medium text-primary hover:underline"
              >
                terms and conditions
              </a>
            </span>
          </label>
        )}

        {session ? (
          <Button
            type="submit"
            disabled={isPending}
            className="h-12 w-full rounded-full font-medium tracking-wide shadow-lg shadow-primary/20"
          >
            {isPending
              ? purchaseMode === "buy-now"
                ? "Starting checkout..."
                : "Creating order..."
              : purchaseMode === "buy-now"
                ? "Buy Immediately"
                : "Contribute to Buy"}
          </Button>
        ) : (
          <a
            href="/login"
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-medium tracking-wide text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/20"
          >
            Log in to continue
          </a>
        )}
      </form>
    </div>
  );
}