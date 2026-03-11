"use client";

import { useMemo, useState, useTransition } from "react";
import { createOrder } from "@/actions/orders";
import { initiatePayment } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/auth-client";
import {
  formatNaira,
  type PickupLocationSummary,
  type ProductCustomField,
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

interface ProductPurchasePanelProps {
  productId: string;
  productName: string;
  colors: string[];
  sizes: string[];
  customFields: ProductCustomField[];
  pickupLocations: PickupLocationSummary[];
  moq: number;
  totalPrice: number;
  priceLockDays: number;
  hasAcceptedTerms: boolean;
}

export function ProductPurchasePanel({
  productId,
  productName,
  colors,
  sizes,
  customFields,
  pickupLocations,
  moq,
  totalPrice,
  priceLockDays,
  hasAcceptedTerms,
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
  const [termsAccepted, setTermsAccepted] = useState(hasAcceptedTerms);
  const [customSelections, setCustomSelections] = useState<
    Record<string, string>
  >({});

  const effectiveTotal = totalPrice * quantity;
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

    return [
      { label: "Recipient name", value: recipientName },
      { label: "Phone", value: phone },
      { label: "Address", value: addressLine1 },
      { label: "City", value: city },
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
    formData.set("recipientName", recipientName);
    formData.set("phone", phone);
    formData.set("addressLine1", addressLine1);
    formData.set("addressLine2", addressLine2);
    formData.set("city", city);
    formData.set("state", state);
    formData.set("purchaseMode", purchaseMode);
    formData.set("installmentMonths", String(selectedInstallmentMonths));
    formData.set("contributionCadence", contributionCadence);
    formData.set("contributionDuration", String(contributionPlan.duration));
    formData.set("selectedColor", selectedColor);
    formData.set("selectedSize", selectedSize);
    formData.set("customSelections", JSON.stringify(customSelections));

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

        if (purchaseMode === "buy-now") {
          const paymentFormData = new FormData();
          paymentFormData.set("orderId", orderId);
          paymentFormData.set("amount", String(effectiveTotal));

          const paymentResult = await initiatePayment(paymentFormData);
          if (!paymentResult.success) {
            toast.error(paymentResult.message ?? "Unable to start payment.");
            window.location.href = `/orders/${orderId}`;
            return;
          }

          toast.success("Order created. Redirecting to secure checkout...");
          if (paymentResult.data?.authorizationUrl) {
            window.location.href = paymentResult.data.authorizationUrl;
            return;
          }
        }

        toast.success(
          "Order created. Complete your deposit to lock the price.",
        );
        window.location.href = `/orders/${orderId}`;
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-primary">
          Configure
        </p>
        <h3 className="mt-2 font-display text-2xl tracking-tight">
          Choose your setup
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick the right variant for {productName}, then choose whether to pay
          outright now or switch to contribute-to-buy.
        </p>
      </div>

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
              <p className="mt-1 text-xs text-muted-foreground">
                Pay the full {formatNaira(effectiveTotal)} now. This is the
                default option.
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
              <p className="mt-1 text-xs text-muted-foreground">
                Start with {formatNaira(contributionPlan.depositAmount)} and
                spread the balance up to 3 months.
              </p>
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div>
            <Label>Fulfillment</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Delivery requires the shopper address. Pickup lets the customer
              collect from a registered location.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleDeliveryMethodChange("DELIVERY")}
              className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                deliveryMethod === "DELIVERY"
                  ? "border-primary bg-primary/5"
                  : "border-border/60 bg-background hover:border-primary/30"
              }`}
            >
              <p className="text-sm font-semibold tracking-tight">
                Door delivery
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Collect the shopper address now so dispatch is not blocked
                later.
              </p>
            </button>
            <button
              type="button"
              disabled={pickupLocations.length === 0}
              onClick={() => handleDeliveryMethodChange("PICKUP")}
              className={`rounded-2xl border px-4 py-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                deliveryMethod === "PICKUP"
                  ? "border-primary bg-primary/5"
                  : "border-border/60 bg-background hover:border-primary/30"
              }`}
            >
              <p className="text-sm font-semibold tracking-tight">Pickup</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {pickupLocations.length > 0
                  ? "Let the shopper pick a collection point instead of entering a delivery address."
                  : "No pickup locations are active yet."}
              </p>
            </button>
          </div>

          {deliveryMethod === "DELIVERY" ? (
            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label htmlFor="address-line-2">Address line 2</Label>
                <Input
                  id="address-line-2"
                  value={addressLine2}
                  onChange={(event) => setAddressLine2(event.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(event) => setState(event.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="pickup-location">Pickup location</Label>
                <select
                  id="pickup-location"
                  title="Pickup location"
                  value={pickupLocationId}
                  onChange={(event) => setPickupLocationId(event.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="">Choose a pickup location</option>
                  {pickupLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} - {location.city}, {location.state}
                    </option>
                  ))}
                </select>
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

          {purchaseMode === "contribute" ? (
            <div className="space-y-2">
              <Label>Contribution cadence</Label>
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
          ) : (
            <div className="space-y-2">
              <Label>Checkout</Label>
              <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                You will be redirected to Paystack to pay the full amount
                immediately.
              </div>
            </div>
          )}
        </div>

        {purchaseMode === "contribute" && (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="contribution-duration">Duration</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose a {contributionCadence} plan that finishes within 3
                  months.
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium tracking-tight">
                  {contributionPlan.durationLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  Longer plans cost more overall.
                </p>
              </div>
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
                  <select
                    title={field.label}
                    id={field.id}
                    value={customSelections[field.id] ?? ""}
                    onChange={(event) =>
                      handleCustomSelection(field.id, event.target.value)
                    }
                    className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Choose {field.label.toLowerCase()}</option>
                    {field.options.map((option) => (
                      <option
                        key={`${field.id}-${option.value}`}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
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
                Price stays locked for {priceLockDays} days after your deposit
                is confirmed.
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
              <div className="border-t border-border/60 pt-2 flex justify-between">
                <span className="text-muted-foreground">Pay now</span>
                <span className="font-display text-lg font-semibold">
                  {formatNaira(effectiveTotal)}
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
            You have already agreed to the{" "}
            <a
              href="/terms"
              className="font-medium text-primary hover:underline"
            >
              service agreement
            </a>
            .
          </p>
        ) : (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
            <div>
              <Label htmlFor="terms-accepted">Terms and Conditions</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Review the service agreement before you pay. The 20% commitment
                deposit is non-refundable and each product carries its own
                price-lock period.
              </p>
            </div>
            <label
              htmlFor="terms-accepted"
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 text-sm"
            >
              <input
                id="terms-accepted"
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-muted-foreground">
                I agree to the 20% non-refundable deposit, the applicable
                price-lock period for this product, and the full terms in{" "}
                <a
                  href="/terms"
                  className="font-medium text-primary hover:underline"
                >
                  the service agreement
                </a>
                .
              </span>
            </label>
          </div>
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