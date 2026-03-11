"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "next-themes";

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={resolvedTheme as "light" | "dark" | undefined}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        className: "rounded-xl font-sans",
      }}
    />
  );
}
