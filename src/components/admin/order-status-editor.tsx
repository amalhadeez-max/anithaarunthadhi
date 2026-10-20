"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Truck, BadgeIndianRupee } from "lucide-react";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { updateOrderStatus, updateTracking, markRefunded } from "@/actions/admin-orders";
import { nextStatuses } from "@/lib/order-status";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmButton } from "./confirm-button";

export function OrderStatusEditor({
  orderId,
  status,
  paymentMethod,
  paymentStatus,
  courier,
  trackingNumber,
}: {
  orderId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  courier: string | null;
  trackingNumber: string | null;
}) {
  const router = useRouter();
  const options = nextStatuses(status);
  const [next, setNext] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");
  const [c, setC] = useState(courier ?? "");
  const [t, setT] = useState(trackingNumber ?? "");
  const [refundId, setRefundId] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="font-semibold">Update status</h2>
        <p className="text-sm text-muted-foreground">
          Current: <strong>{ORDER_STATUS_LABEL[status]}</strong>
        </p>
        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground">This order is in a final state.</p>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label>New status</Label>
              <Select value={next} onValueChange={(v) => setNext(v as OrderStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose next status" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((s) => (
                    <SelectItem key={s} value={s}>
                      {ORDER_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">Note to customer (optional)</Label>
              <Textarea
                id="note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Dispatched via Delhivery, expect delivery in 3 days"
                maxLength={300}
              />
            </div>
            <Button
              disabled={!next}
              loading={pending}
              onClick={() =>
                start(async () => {
                  const res = await updateOrderStatus({ orderId, status: next, note });
                  if (res.ok) {
                    toast.success(res.message);
                    setNext("");
                    setNote("");
                    router.refresh();
                  } else toast.error(res.error);
                })
              }
            >
              Save status & notify customer
            </Button>
          </>
        )}
      </section>

      <section className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <Truck className="h-4 w-4" /> Courier & tracking
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            value={c}
            onChange={(e) => setC(e.target.value)}
            placeholder="Courier (Delhivery, DTDC…)"
            aria-label="Courier"
          />
          <Input
            value={t}
            onChange={(e) => setT(e.target.value)}
            placeholder="Tracking number"
            aria-label="Tracking number"
          />
        </div>
        <Button
          variant="outline"
          loading={pending}
          onClick={() =>
            start(async () => {
              const res = await updateTracking({ orderId, courier: c, trackingNumber: t });
              if (res.ok) {
                toast.success(res.message);
                router.refresh();
              } else toast.error(res.error);
            })
          }
        >
          Save tracking
        </Button>
      </section>

      {paymentMethod === "razorpay" &&
        (paymentStatus === "refund_pending" ||
          (paymentStatus === "paid" && ["cancelled", "returned"].includes(status))) && (
          <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="flex items-center gap-2 font-semibold text-amber-900">
              <BadgeIndianRupee className="h-4 w-4" /> Refund required
            </h2>
            <p className="text-sm text-amber-800">
              This prepaid order was cancelled/returned. Issue the refund from the Razorpay dashboard, then
              mark it here.
            </p>
            <Input
              value={refundId}
              onChange={(e) => setRefundId(e.target.value)}
              placeholder="Razorpay refund id (optional)"
              className="bg-white"
            />
            <ConfirmButton
              title="Mark this order as refunded?"
              description="Only do this after the refund has been processed in Razorpay."
              confirmLabel="Mark refunded"
              action={() => markRefunded(orderId, refundId)}
            >
              Mark as refunded
            </ConfirmButton>
          </section>
        )}
    </div>
  );
}
