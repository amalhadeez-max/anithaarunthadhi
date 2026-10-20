import type { OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABEL } from "@/lib/constants";

const ORDER_VARIANT: Record<
  OrderStatus,
  "secondary" | "info" | "warning" | "success" | "destructive" | "outline"
> = {
  pending_payment: "warning",
  placed: "info",
  confirmed: "info",
  packed: "info",
  shipped: "info",
  out_for_delivery: "warning",
  delivered: "success",
  cancelled: "destructive",
  returned: "outline",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={ORDER_VARIANT[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}

export function PaymentStatusBadge({ status, method }: { status: PaymentStatus; method?: PaymentMethod }) {
  const v =
    status === "paid"
      ? "success"
      : status === "failed"
        ? "destructive"
        : status === "refunded"
          ? "outline"
          : "warning";
  const label = status === "pending" && method === "cod" ? "COD · Pay on delivery" : status.replace("_", " ");
  return (
    <Badge variant={v} className="capitalize">
      {label}
      {method && status !== "pending" ? ` · ${method === "cod" ? "COD" : "Razorpay"}` : ""}
    </Badge>
  );
}
