import { productService } from "@/lib/services/product.service";
import { pickupLocationService } from "@/lib/services/pickup-location.service";
import { formatNaira } from "@/lib/types";
import { notFound } from "next/navigation";
import { calculateDeposit } from "@/lib/utils";
import Image from "next/image";
import { InstallmentCalculator } from "./installment-calculator";
import { ProductPurchasePanel } from "@/components/forms/product-purchase-panel";
import { coerceProductCustomFields } from "@/lib/types";
import { getSession } from "@/lib/session";
import { getUserAddresses } from "@/actions/addresses";
import { getSettingValue } from "@/actions/settings";
import { parseDeliveryRates } from "@/lib/utils/delivery-rates";
import type { SavedAddressSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await productService.getBySlug(slug);

  if (!product) {
    notFound();
  }

  const activeSale = product.flashSales?.[0] ?? null;
  const effectivePrice = activeSale
    ? activeSale.salePrice
    : product.markupPrice;
  const deposit = calculateDeposit(effectivePrice);
  const remaining = effectivePrice - deposit;
  const customFields = coerceProductCustomFields(product.customFields);
  const pickupLocations = await pickupLocationService.getActive();
  const session = await getSession();
  const hasAcceptedTerms = session?.user.hasAcceptedTerms ?? false;
  const savedAddresses: SavedAddressSummary[] = session
    ? ((await getUserAddresses()).data ?? [])
    : [];
  const speedafEnabled = (await getSettingValue("enableSpeedaf")) === "true";
  const [defaultFeeNaira, lagosLgaRatesJson, stateDeliveryRatesJson] =
    await Promise.all([
      getSettingValue("defaultDeliveryFee").then((v) => Number(v) || 0),
      getSettingValue("lagosLgaRates").then((v) => v || "{}"),
      getSettingValue("stateDeliveryRates").then((v) => v || "{}"),
    ]);
  const deliveryRates = parseDeliveryRates(
    lagosLgaRatesJson,
    stateDeliveryRatesJson,
    defaultFeeNaira,
  );

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
      <a
        href="/products"
        className="text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        &larr; Back to Collection
      </a>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        {/* Product images */}
        <div className="space-y-3">
          {product.images.length > 0 ? (
            <>
              <div className="relative aspect-square rounded-2xl bg-muted/60 overflow-hidden">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(1).map((img, i) => (
                    <div
                      key={img}
                      className="relative aspect-square rounded-xl bg-muted/60 overflow-hidden"
                    >
                      <Image
                        src={img}
                        alt={`${product.name} ${i + 2}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 25vw, 12vw"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-square rounded-2xl bg-muted/60 flex items-center justify-center">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}

          {/* Videos */}
          {product.videos && product.videos.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
                Videos
              </h3>
              {product.videos.map((url) => (
                <video
                  key={url}
                  src={url}
                  controls
                  preload="metadata"
                  className="w-full rounded-xl border border-border/60 bg-black"
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {product.isPreorder && (
                <span className="inline-block rounded-full bg-warm/10 px-3 py-1 text-xs font-medium text-warm">
                  Pre-order
                </span>
              )}
              {product.category && (
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {product.category.name}
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight">
              {product.name}
            </h1>
            {product.description && (
              <div
                className="mt-3 prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}
          </div>

          <div className="space-y-1">
            {activeSale ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-display text-3xl md:text-4xl text-primary">
                    {formatNaira(activeSale.salePrice)}
                  </p>
                  <p className="font-display text-xl text-muted-foreground line-through">
                    {formatNaira(product.markupPrice)}
                  </p>
                  <span className="rounded-full bg-destructive/10 text-destructive px-3 py-1 text-xs font-medium">
                    {Math.round(
                      (1 - activeSale.salePrice / product.markupPrice) * 100,
                    )}
                    % off
                  </span>
                </div>
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {activeSale.label}
                </span>
                <p className="text-sm text-muted-foreground">
                  or start with{" "}
                  <span className="font-medium text-primary">
                    {formatNaira(deposit)}
                  </span>{" "}
                  deposit (20%)
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-3xl md:text-4xl text-foreground">
                  {formatNaira(product.markupPrice)}
                </p>
                <p className="text-sm text-muted-foreground">
                  or start with{" "}
                  <span className="font-medium text-primary">
                    {formatNaira(deposit)}
                  </span>{" "}
                  deposit (20%)
                </p>
              </>
            )}
          </div>

          <ProductPurchasePanel
            productId={product.id}
            productName={product.name}
            colors={product.colors}
            sizes={product.sizes}
            customFields={customFields}
            pickupLocations={pickupLocations}
            savedAddresses={savedAddresses}
            moq={product.moq}
            totalPrice={product.markupPrice}
            salePrice={activeSale?.salePrice}
            priceLockDays={product.priceLockDays}
            hasAcceptedTerms={hasAcceptedTerms}
            speedafEnabled={speedafEnabled}
            productWeightKg={product.weightKg ?? 0.5}
            deliveryRates={deliveryRates}
          />

          {product.expectedProcurementAt && (
            <p className="text-sm text-muted-foreground">
              Expected procurement:{" "}
              {new Date(product.expectedProcurementAt).toLocaleDateString(
                "en-NG",
                {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                },
              )}
            </p>
          )}
        </div>
      </div>

      <div className="mt-10">
        <InstallmentCalculator
          totalPrice={effectivePrice}
          deposit={deposit}
          remaining={remaining}
          priceLockDays={product.priceLockDays}
        />
      </div>
    </div>
  );
}
