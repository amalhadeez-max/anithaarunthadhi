"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, RotateCcw, XCircle, CreditCard } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { cancelOrder, reorderLines } from "@/actions/orders";
import { customerCanCancel } from "@/lib/order-status";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function OrderActions({
  orderId,
  status,
  canRetryPayment,
}: {
  orderId: string;
  status: OrderStatus;
  canRetryPayment: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const addItem = useCartStore((s) => s.addItem);

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm">
        <a href={`/api/orders/${orderId}/invoice`} target="_blank" rel="noopener">
          <Download /> Invoice (PDF)
        </a>
      </Button>
      <Button
        variant="outline"
        size="sm"
        loading={pending}
        onClick={() =>
          start(async () => {
            const res = await reorderLines(orderId);
            if (res.ok) {
              res.data!.forEach((l) => addItem(l, l.quantity));
              toast.success(res.message);
              router.push("/cart");
            } else toast.error(res.error);
          })
        }
      >
        <RotateCcw /> Reorder
      </Button>
      {canRetryPayment && (
        <Button asChild size="sm" variant="brand">
          <a href="/checkout">
            <CreditCard /> Retry payment
          </a>
        </Button>
      )}
      {customerCanCancel(status) && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setOpen(true)}
          >
            <XCircle /> Cancel order
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel this order?</DialogTitle>
                <DialogDescription>
                  Items will be released back to stock. Prepaid amounts are refunded to the original payment
                  method within 5–7 working days.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                rows={3}
                placeholder="Reason (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={300}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Keep order
                </Button>
                <Button
                  variant="destructive"
                  loading={pending}
                  onClick={() =>
                    start(async () => {
                      const res = await cancelOrder(orderId, reason);
                      if (res.ok) {
                        toast.success(res.message);
                        setOpen(false);
                        router.refresh();
                      } else toast.error(res.error);
                    })
                  }
                >
                  Cancel order
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
