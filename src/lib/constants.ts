import type { Segment, VehicleType, OrderStatus, ContactSubject } from "@prisma/client";

export const STORE_NAME_DEFAULT = "Anithaarunthadhi";

export const SEGMENTS: { value: Segment; label: string; short: string }[] = [
  { value: "two_wheeler", label: "2 Wheeler", short: "2W" },
  { value: "four_wheeler", label: "4 Wheeler", short: "4W" },
  { value: "truck", label: "Truck", short: "Truck" },
];

export const SEGMENT_LABEL: Record<Segment, string> = {
  two_wheeler: "2 Wheeler",
  four_wheeler: "4 Wheeler",
  truck: "Truck / Commercial",
};

export const VEHICLE_TYPES_BY_SEGMENT: Record<Segment, VehicleType[]> = {
  two_wheeler: ["bike", "scooter", "ev", "moped"],
  four_wheeler: ["hatchback", "sedan", "suv", "muv", "pickup"],
  truck: ["light_truck", "heavy_truck", "tipper", "trailer", "bus"],
};

export const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
  bike: "Bike",
  scooter: "Scooter",
  ev: "EV",
  moped: "Moped",
  hatchback: "Hatchback",
  sedan: "Sedan",
  suv: "SUV",
  muv: "MUV",
  pickup: "Pickup",
  light_truck: "Light truck",
  heavy_truck: "Heavy truck",
  tipper: "Tipper",
  trailer: "Trailer",
  bus: "Bus",
};

export const ALL_VEHICLE_TYPES = Object.keys(VEHICLE_TYPE_LABEL) as VehicleType[];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Pending payment",
  placed: "Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export const CONTACT_SUBJECTS: { value: ContactSubject; label: string }[] = [
  { value: "general_inquiry", label: "General Inquiry" },
  { value: "product_question", label: "Product Question" },
  { value: "support", label: "Support" },
  { value: "partnership", label: "Partnership" },
];

export const YEAR_MIN = 2000;
export const YEAR_MAX = new Date().getFullYear() + 1;

export const PAGE_SIZE = 24;
export const ADMIN_PAGE_SIZE = 20;
export const LOW_STOCK_THRESHOLD = 5;
