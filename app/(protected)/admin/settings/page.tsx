import { getSystemSettings } from "@/actions/settings";
import { SettingsForm } from "@/components/forms/settings-form";
import { DangerZone } from "@/components/admin/danger-zone";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSystemSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      <div>
        <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">
          Admin
        </p>
        <h1 className="font-display text-4xl tracking-tight">
          System Settings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Configure system-wide defaults and operational parameters.
        </p>
      </div>

      <SettingsForm settings={settings} />

      <DangerZone />
    </div>
  );
}
