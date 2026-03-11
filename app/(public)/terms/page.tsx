import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const sections = [
  {
    title: "1. Procurement & Pre-Order Terms",
    items: [
      {
        heading: "1.1 Sourcing Nature",
        body:
          "Ade's Kolekt operates as a procurement agent. Items are carefully selected from trusted third-party suppliers and sorted only after order aggregation is complete.",
      },
      {
        heading: "1.2 Price Volatility Clause",
        body:
          "Because local supplier pricing and FX conditions can move quickly, all listed prices are provisional. If supplier cost rises by more than 10% between payment and physical procurement, the customer will be notified and may either pay the difference or request a full refund for that specific item.",
      },
      {
        heading: "1.3 Out-of-Stock Protocol",
        body:
          "If an item becomes unavailable at procurement time, the customer will be offered a comparable swap, store credit, or a full refund to the original payment method within 3 to 5 business days.",
      },
    ],
  },
  {
    title: "2. Contribute to Buy Policy",
    items: [
      {
        heading: "2.1 Commitment Deposit",
        body:
          "Starting an installment plan requires a non-refundable commitment deposit of 20% of the total item value. This covers administrative handling and secures the customer's procurement slot.",
      },
      {
        heading: "2.2 Payment Schedule",
        body:
          "Installment plans must be completed within 90 days unless the Company explicitly states otherwise. Customers are expected to make at least one payment every 30 days to keep the plan active.",
      },
      {
        heading: "2.3 Price Locking Limits",
        body:
          "The initial price is locked for the period stated on the product or order at checkout. If an installment plan extends beyond that lock period and the market price has risen significantly, the final balance may be adjusted to match the current market rate.",
      },
      {
        heading: "2.4 Default and Cancellation",
        body:
          "If no payment is made for 45 consecutive days, the plan is treated as defaulted. On default or customer-initiated cancellation, the 20% commitment deposit is forfeited and any remaining installment balance is issued as store credit only. Partial installment payments are not refunded in cash.",
      },
    ],
  },
  {
    title: "3. Delivery & Logistics",
    items: [
      {
        heading: "3.1 Dispatch Timeline",
        body:
          "Procurement runs in batches. After a batch closes and items are secured, allow 3 to 7 business days for sorting, quality checks, and dispatch or pickup preparation.",
      },
      {
        heading: "3.2 Delivery Fees",
        body:
          "Delivery is handled by third-party logistics providers. Fees are based on the chosen delivery destination and are not included in the product price. Ade's Kolekt is not liable for courier delays caused by traffic, weather, or external operational issues once items have left the hub.",
      },
      {
        heading: "3.3 Risk of Loss",
        body:
          "Risk passes to the customer upon delivery to the specified address or confirmed pickup handover. Customers should inspect items immediately on receipt.",
      },
    ],
  },
  {
    title: "4. Quality Assurance & Returns",
    items: [
      {
        heading: "4.1 Market Sourcing Reality",
        body:
          "Items are inspected at the point of purchase, but minor variations in color or texture caused by photography or lighting are not treated as defects.",
      },
      {
        heading: "4.2 Return Window",
        body:
          "Claims for damaged or dead-on-arrival kitchen appliances or electronics must be made within 24 hours of delivery, together with photo or video evidence.",
      },
      {
        heading: "4.3 Non-Returnable Items",
        body:
          "Returns are not accepted for changes of mind after procurement, items already used or handled by the customer, souvenirs, or customized orders.",
      },
    ],
  },
  {
    title: "5. Limitation of Liability",
    items: [
      {
        heading: "Liability Cap",
        body:
          "Ade's Kolekt is not liable for indirect, incidental, or consequential losses arising from procurement or delivery delays. Total liability is limited to the amount paid for the specific product in question.",
      },
    ],
  },
];

export default async function TermsPage() {
  const session = await getSession();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <a href="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors">
        &larr; Back to Collection
      </a>

      <div className="mt-6 rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">Legal</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight">Service Agreement &amp; Terms of Use</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: March 9, 2026</p>

        <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground">
          <p>
            This agreement governs the purchase of goods through Ade&apos;s Kolekt. By placing a pre-order,
            selecting a buy-now purchase, or starting a Contribute to Buy installment plan, you confirm that
            you have read, understood, and agreed to the terms below.
          </p>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-foreground">
            <p className="font-medium tracking-tight">Important checkout notice</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You must agree to the 20% non-refundable deposit policy and the applicable product price-lock period before you can continue with checkout.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="space-y-4">
              <h2 className="font-display text-2xl tracking-tight text-foreground">{section.title}</h2>
              <div className="space-y-4">
                {section.items.map((item) => (
                  <div key={item.heading} className="rounded-2xl border border-border/50 bg-background/60 p-5">
                    <h3 className="text-base font-semibold tracking-tight text-foreground">{item.heading}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.body}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border/60 bg-muted/20 p-5">
          <h2 className="font-semibold tracking-tight text-foreground">Acceptance</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            By proceeding with payment, you acknowledge that you have read, understood, and agreed to these terms and conditions.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/products"
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium tracking-wide text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Continue Shopping
            </a>
            {!session && (
              <a
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-full border border-border/60 px-6 text-sm font-medium tracking-wide text-foreground hover:border-primary/40 transition-colors"
              >
                Log In to Order
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}