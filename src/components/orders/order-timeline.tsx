import { Check, Circle, X, RotateCcw, Clock } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { ORDER_FLOW, flowIndex } from "@/lib/order-status";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { formatDateTime, cn } from "@/lib/utils";

type HistoryRow = { toStatus: OrderStatus; createdAt: Date | string; note?: string | null };

/** Horizontal (desktop) / vertical (mobile) progress: Placed → Confirmed → Packed → Shipped → Out for delivery → Delivered */
export function OrderTimeline({ status, history }: { status: OrderStatus; history: HistoryRow[] }) {
  const idx = flowIndex(status);
  const terminalBad = status === "cancelled" || status === "returned";
  const pending = status === "pending_payment";
  const at = (s: OrderStatus) => history.filter((h) => h.toStatus === s).at(-1)?.createdAt;

  return (
    <div>
      {(terminalBad || pending) && (
        <div
          className={cn(
            "mb-4 flex items-center gap-2 rounded-lg p-3 text-sm font-medium",
            pending ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-800",
          )}
        >
          {pending ? (
            <Clock className="h-4 w-4" />
          ) : status === "returned" ? (
            <RotateCcw className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
          {ORDER_STATUS_LABEL[status]}
          {at(status) ? ` · ${formatDateTime(at(status)!)}` : ""}
        </div>
      )}
      <ol className="relative flex flex-col gap-0 md:flex-row md:items-start" aria-label="Order progress">
        {ORDER_FLOW.map((s, i) => {
          const done = idx >= i && !terminalBad && !pending;
          const current = idx === i && !terminalBad && !pending;
          const ts = at(s);
          return (
            <li
              key={s}
              className="relative flex flex-1 gap-3 pb-6 md:flex-col md:items-center md:gap-2 md:pb-0 md:text-center"
            >
              {/* connectors */}
              {i < ORDER_FLOW.length - 1 && (
                <span
                  className={cn(
                    "absolute left-[11px] top-6 h-[calc(100%-8px)] w-0.5 md:left-1/2 md:top-3 md:h-0.5 md:w-full",
                    idx > i && !terminalBad && !pending ? "bg-emerald-500" : "bg-neutral-200",
                  )}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-white",
                  done
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-neutral-300 text-neutral-300",
                  current && "ring-4 ring-emerald-100",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2 fill-current" />}
              </span>
              <div className="min-w-0">
                <div className={cn("text-sm font-medium", done ? "text-neutral-900" : "text-neutral-400")}>
                  {ORDER_STATUS_LABEL[s]}
                </div>
                {ts && <div className="text-xs text-muted-foreground">{formatDateTime(ts)}</div>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
