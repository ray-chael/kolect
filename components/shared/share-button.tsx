"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonProps {
  url: string;
  title?: string;
  text?: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ShareButton({
  url,
  title,
  text,
  label = "Share",
  variant = "outline",
  size = "sm",
  className,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (e) {
        // User cancelled or API not available — fall through to clipboard
        if ((e as DOMException)?.name === "AbortError") return;
      }
    }
    await copyToClipboard();
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Could not copy link. Please copy it manually.");
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleShare}
      className={className}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Share2 className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied!" : label}
    </Button>
  );
}
