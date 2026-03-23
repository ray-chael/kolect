"use client";

import { useState, useTransition } from "react";
import { createGroupBuy } from "@/actions/group-buy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/lib/auth-client";
import { SignInLink } from "@/components/shared/sign-in-link";
import { DEADLINE_OPTIONS } from "@/lib/consts";
import { toast } from "sonner";

interface CreateGroupBuyFormProps {
  productId: string;
  colors: string[];
  sizes: string[];
}

export function CreateGroupBuyForm({
  productId,
  colors,
  sizes,
}: CreateGroupBuyFormProps) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [splitType, setSplitType] = useState("FLEXIBLE");
  const [deadlineDays, setDeadlineDays] = useState("30");
  const [maxMembers, setMaxMembers] = useState("10");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const creatorEmail = session?.user?.email?.trim().toLowerCase() ?? "";
  const [allowedEmails, setAllowedEmails] = useState<string[]>(
    creatorEmail ? [creatorEmail] : [],
  );
  const [emailInput, setEmailInput] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
      >
        <p className="text-sm font-semibold tracking-tight">
          Contribute to Buy
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Start a group buy — friends pool money for this product
        </p>
      </button>
    );
  }

  function handleSubmit(formData: FormData) {
    if (!title.trim() || title.trim().length < 3) {
      toast.error("Title must be at least 3 characters");
      return;
    }

    if (allowedEmails.length < 2) {
      toast.error("Add at least 2 member emails for the group buy");
      return;
    }

    formData.set("productId", productId);
    formData.set("title", title.trim());
    formData.set("splitType", splitType);
    formData.set("deadlineDays", deadlineDays);
    formData.set("maxMembers", maxMembers);
    if (selectedColor) formData.set("selectedColor", selectedColor);
    if (selectedSize) formData.set("selectedSize", selectedSize);
    formData.set("allowedEmails", allowedEmails.join(","));

    startTransition(async () => {
      const result = await createGroupBuy(formData);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (result.data?.slug) {
        window.location.href = `/group-buy/${result.data.slug}`;
      }
    });
  }

  const selectedDeadline = DEADLINE_OPTIONS.find(
    (d) => String(d.days) === deadlineDays,
  );

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg tracking-tight">
          Start a Group Buy
        </h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Create a group buy link to share with friends. Everyone contributes and
        co-owns the product.
      </p>

      {session ? (
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gb-title">Title</Label>
            <Input
              id="gb-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Birthday gift for the squad"
              disabled={isPending}
              className="rounded-xl"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Split type</Label>
              <Select
                value={splitType}
                onValueChange={(v) => v && setSplitType(v)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FLEXIBLE">
                    Flexible — pay any amount
                  </SelectItem>
                  <SelectItem value="EQUAL">Equal — split evenly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Max members</Label>
              <Input
                type="number"
                min={2}
                max={50}
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                disabled={isPending}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Deadline</Label>
            <Select
              value={deadlineDays}
              onValueChange={(v) => v && setDeadlineDays(v)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEADLINE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.days} value={String(opt.days)}>
                    {opt.label}
                    {opt.interestPercent > 0
                      ? ` (+${opt.interestPercent}% fee)`
                      : " (no fee)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDeadline && selectedDeadline.interestPercent > 0 && (
              <p className="text-xs text-warm">
                A {selectedDeadline.interestPercent}% platform fee applies for
                the {selectedDeadline.label} deadline.
              </p>
            )}
          </div>

          {colors.length > 0 && (
            <div className="space-y-2">
              <Label>Color</Label>
              <Select
                value={selectedColor}
                onValueChange={(v) => v && setSelectedColor(v)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choose a color" />
                </SelectTrigger>
                <SelectContent>
                  {colors.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="space-y-2">
              <Label>Size</Label>
              <Select
                value={selectedSize}
                onValueChange={(v) => v && setSelectedSize(v)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choose a size" />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Allowed contributors emails */}
          <div className="space-y-2">
            <Label>
              Group members (emails) <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              Your email is included automatically. Add every other person in
              this group buy — only these people will be able to contribute.
            </p>
            <div className="flex gap-2">
              <Input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    const email = emailInput.trim().toLowerCase();
                    if (
                      email &&
                      email.includes("@") &&
                      !allowedEmails.includes(email)
                    ) {
                      setAllowedEmails([...allowedEmails, email]);
                      setEmailInput("");
                    }
                  }
                }}
                placeholder="Type email and press Enter"
                disabled={isPending}
                className="rounded-xl flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl shrink-0"
                onClick={() => {
                  const email = emailInput.trim().toLowerCase();
                  if (
                    email &&
                    email.includes("@") &&
                    !allowedEmails.includes(email)
                  ) {
                    setAllowedEmails([...allowedEmails, email]);
                    setEmailInput("");
                  }
                }}
              >
                Add
              </Button>
            </div>
            {allowedEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {allowedEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {email}
                    {email !== creatorEmail && (
                      <button
                        type="button"
                        onClick={() =>
                          setAllowedEmails(
                            allowedEmails.filter((e) => e !== email),
                          )
                        }
                        className="hover:text-destructive transition-colors ml-0.5"
                      >
                        &times;
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-11 rounded-full font-medium tracking-wide"
          >
            {isPending ? "Creating..." : "Create Group Buy"}
          </Button>
        </form>
      ) : (
        <SignInLink className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-medium tracking-wide text-primary-foreground hover:bg-primary/90 transition-all duration-300">
          Log in to start a group buy
        </SignInLink>
      )}
    </div>
  );
}
