"use client";

import { useMemo, useState } from "react";
import { formatNaira } from "@/lib/types";
import {
    calculateContributionPlan,
    clampContributionDuration,
    getContributionDurationLimits,
    type ContributionCadence,
} from "@/lib/utils";

const CADENCE_OPTIONS: Array<{ value: ContributionCadence; label: string }> = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

interface InstallmentCalculatorProps {
  totalPrice: number;
  deposit: number;
  remaining: number;
  priceLockDays: number;
}

export function InstallmentCalculator({
  totalPrice,
  priceLockDays,
}: InstallmentCalculatorProps) {
  const [cadence, setCadence] = useState<ContributionCadence>("monthly");
  const [duration, setDuration] = useState(1);

  const plan = useMemo(
    () => calculateContributionPlan({ totalPrice, cadence, duration }),
    [cadence, duration, totalPrice],
  );
  const durationLimits = getContributionDurationLimits(cadence);

  function handleCadenceChange(nextCadence: ContributionCadence) {
    setCadence(nextCadence);
    setDuration((current) => clampContributionDuration(nextCadence, current));
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
      <h3 className="font-semibold tracking-tight">
        How &ldquo;Contribute to Buy&rdquo; works
      </h3>

      <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-4">
        <li>
          Choose daily, weekly, or monthly contributions that finish within 3 months
        </li>
        <li>
          Pay {formatNaira(plan.depositAmount)} deposit first to lock your selected plan
        </li>
        <li>Longer plans carry a higher total payable amount</li>
        <li>Price locked for {priceLockDays} days after your deposit is confirmed</li>
        <li>Once fully paid, we procure and deliver to your door</li>
      </ol>

      <div className="space-y-3 pt-2">
        <label className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
          Contribution cadence
        </label>
        <div className="flex flex-wrap gap-2">
          {CADENCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleCadenceChange(option.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                cadence === option.value
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-tight">Plan duration</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Adjust the duration, but keep it inside the 3-month maximum.
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium tracking-tight">{plan.durationLabel}</p>
            <p className="text-xs text-muted-foreground">
              {Math.round(plan.surchargeRate * 100)}% uplift on the cash price
            </p>
          </div>
        </div>

        <input
          type="range"
          title="Contribution duration"
          aria-label="Contribution duration"
          min={durationLimits.min}
          max={durationLimits.max}
          step={durationLimits.step}
          value={plan.duration}
          onChange={(event) =>
            setDuration(clampContributionDuration(cadence, Number(event.target.value)))
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

      <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cash price</span>
          <span className="font-medium">{formatNaira(totalPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Contribution uplift</span>
          <span className="font-medium">{formatNaira(plan.surchargeAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Plan total</span>
          <span className="font-medium">{formatNaira(plan.adjustedTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Deposit (20%)</span>
          <span className="font-medium text-primary">{formatNaira(plan.depositAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Remaining balance</span>
          <span className="font-medium">{formatNaira(plan.remainingBalance)}</span>
        </div>
        <div className="border-t border-border/60 pt-2 flex justify-between">
          <span className="text-muted-foreground">
            {CADENCE_OPTIONS.find((option) => option.value === cadence)?.label} target × {plan.installmentCount}
          </span>
          <span className="font-display text-lg font-semibold text-foreground">
            {formatNaira(plan.installmentAmount)}/{plan.intervalLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
