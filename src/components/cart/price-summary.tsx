import { formatINR } from "@/lib/utils";
import type { CartTotals } from "@/lib/pricing";

export function PriceSummary({
  totals,
  freeDeliveryThreshold,
  className = "",
}: {
  totals: CartTotals;
  freeDeliveryThreshold: number;
  className?: string;
}) {
  const remaining = freeDeliveryThreshold - totals.itemsTotal;
  return (
    <div className={`rounded-xl border bg-white p-4 ${className}`}>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price details</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt>
            Price ({totals.itemCount} item{totals.itemCount === 1 ? "" : "s"})
          </dt>
          <dd className="tabular-nums">{formatINR(totals.subtotal)}</dd>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-emerald-700">
            <dt>Discount</dt>
            <dd className="tabular-nums">− {formatINR(totals.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>Delivery</dt>
          <dd className="tabular-nums">
            {totals.deliveryCharge === 0 ? (
              <span className="text-emerald-700">FREE</span>
            ) : (
              formatINR(totals.deliveryCharge)
            )}
          </dd>
        </div>
        <div className="my-2 h-px bg-border" />
        <div className="flex justify-between text-base font-bold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatINR(totals.total)}</dd>
        </div>
      </dl>
      {totals.discount > 0 && (
        <p className="mt-3 text-xs font-medium text-emerald-700">
          You save {formatINR(totals.discount)} on this order
        </p>
      )}
      {remaining > 0 && totals.itemsTotal > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          Add {formatINR(remaining)} more for free delivery
        </p>
      )}
    </div>
  );
}
