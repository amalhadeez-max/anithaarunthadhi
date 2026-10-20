/* eslint-disable no-console */
/**
 * Seed: brands (2W / 4W / truck), models, variants (year × type), categories,
 * 30 products with specs + compatibility, site settings, one admin + one customer.
 *
 * Users: if SUPABASE_SERVICE_ROLE_KEY is present, auth users are created through the
 * Supabase Admin API (the DB trigger creates the profile row and we then set the role).
 * Otherwise (local Postgres without Supabase) profiles are inserted with fixed UUIDs.
 */
import { PrismaClient, Segment, VehicleType, Prisma } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const img = (text: string, bg = "f4f4f5") =>
  `https://placehold.co/800x800/${bg}/18181b/png?text=${encodeURIComponent(text)}`;
const logo = (text: string) =>
  `https://placehold.co/300x300/ffffff/111111/png?text=${encodeURIComponent(text)}`;

type ModelSeed = { name: string; from: number; to: number; type: VehicleType };
type BrandSeed = { name: string; segments: Segment[]; models: Partial<Record<Segment, ModelSeed[]>> };

const Y = (from: number, to = 2026) => ({ from, to });

const BRANDS: BrandSeed[] = [
  // ── Two wheelers ──
  {
    name: "Honda",
    segments: ["two_wheeler", "four_wheeler"],
    models: {
      two_wheeler: [
        { name: "Activa 6G", ...Y(2020), type: "scooter" },
        { name: "Shine 125", ...Y(2018), type: "bike" },
        { name: "CB350", ...Y(2021), type: "bike" },
      ],
      four_wheeler: [
        { name: "City", ...Y(2020), type: "sedan" },
        { name: "Amaze", ...Y(2018), type: "sedan" },
        { name: "Elevate", ...Y(2023), type: "suv" },
      ],
    },
  },
  {
    name: "Suzuki",
    segments: ["two_wheeler"],
    models: {
      two_wheeler: [
        { name: "Access 125", ...Y(2018), type: "scooter" },
        { name: "Gixxer SF", ...Y(2019), type: "bike" },
      ],
    },
  },
  {
    name: "Yamaha",
    segments: ["two_wheeler"],
    models: {
      two_wheeler: [
        { name: "FZ-S V3", ...Y(2019), type: "bike" },
        { name: "R15 V4", ...Y(2021), type: "bike" },
        { name: "Fascino 125", ...Y(2019), type: "scooter" },
      ],
    },
  },
  {
    name: "TVS",
    segments: ["two_wheeler"],
    models: {
      two_wheeler: [
        { name: "Jupiter", ...Y(2018), type: "scooter" },
        { name: "Apache RTR 160", ...Y(2018), type: "bike" },
        { name: "iQube", ...Y(2020), type: "ev" },
        { name: "XL100", ...Y(2018), type: "moped" },
      ],
    },
  },
  {
    name: "Hero",
    segments: ["two_wheeler"],
    models: {
      two_wheeler: [
        { name: "Splendor Plus", ...Y(2018), type: "bike" },
        { name: "HF Deluxe", ...Y(2018), type: "bike" },
        { name: "Xtreme 160R", ...Y(2020), type: "bike" },
        { name: "Destini 125", ...Y(2019), type: "scooter" },
      ],
    },
  },
  {
    name: "Bajaj",
    segments: ["two_wheeler"],
    models: {
      two_wheeler: [
        { name: "Pulsar 150", ...Y(2018), type: "bike" },
        { name: "Pulsar NS200", ...Y(2018), type: "bike" },
        { name: "Chetak", ...Y(2020), type: "ev" },
      ],
    },
  },
  {
    name: "Vespa",
    segments: ["two_wheeler"],
    models: { two_wheeler: [{ name: "VXL 125", ...Y(2018), type: "scooter" }] },
  },
  {
    name: "Aprilia",
    segments: ["two_wheeler"],
    models: { two_wheeler: [{ name: "SR 160", ...Y(2018), type: "scooter" }] },
  },
  {
    name: "KTM",
    segments: ["two_wheeler"],
    models: {
      two_wheeler: [
        { name: "Duke 200", ...Y(2018), type: "bike" },
        { name: "RC 390", ...Y(2019), type: "bike" },
      ],
    },
  },
  {
    name: "Royal Enfield",
    segments: ["two_wheeler"],
    models: {
      two_wheeler: [
        { name: "Classic 350", ...Y(2018), type: "bike" },
        { name: "Hunter 350", ...Y(2022), type: "bike" },
        { name: "Himalayan 450", ...Y(2023), type: "bike" },
      ],
    },
  },
  {
    name: "Mahindra 2 Wheelers",
    segments: ["two_wheeler"],
    models: { two_wheeler: [{ name: "Mojo 300", ...Y(2018, 2022), type: "bike" }] },
  },
  {
    name: "Husqvarna",
    segments: ["two_wheeler"],
    models: { two_wheeler: [{ name: "Svartpilen 250", ...Y(2020), type: "bike" }] },
  },
  {
    name: "Benelli",
    segments: ["two_wheeler"],
    models: { two_wheeler: [{ name: "TRK 502", ...Y(2019), type: "bike" }] },
  },
  {
    name: "Jawa",
    segments: ["two_wheeler"],
    models: { two_wheeler: [{ name: "Jawa 42", ...Y(2019), type: "bike" }] },
  },
  {
    name: "BMW",
    segments: ["two_wheeler", "four_wheeler"],
    models: {
      two_wheeler: [{ name: "G 310 R", ...Y(2018), type: "bike" }],
      four_wheeler: [
        { name: "X1", ...Y(2020), type: "suv" },
        { name: "3 Series", ...Y(2019), type: "sedan" },
      ],
    },
  },
  {
    name: "Ola",
    segments: ["two_wheeler"],
    models: { two_wheeler: [{ name: "S1 Pro", ...Y(2021), type: "ev" }] },
  },
  // ── Four wheelers ──
  {
    name: "Maruti Suzuki",
    segments: ["four_wheeler"],
    models: {
      four_wheeler: [
        { name: "Swift", ...Y(2018), type: "hatchback" },
        { name: "Baleno", ...Y(2019), type: "hatchback" },
        { name: "Dzire", ...Y(2018), type: "sedan" },
        { name: "Brezza", ...Y(2020), type: "suv" },
        { name: "Ertiga", ...Y(2018), type: "muv" },
      ],
    },
  },
  {
    name: "Hyundai",
    segments: ["four_wheeler"],
    models: {
      four_wheeler: [
        { name: "i20", ...Y(2020), type: "hatchback" },
        { name: "Creta", ...Y(2020), type: "suv" },
        { name: "Venue", ...Y(2019), type: "suv" },
        { name: "Verna", ...Y(2020), type: "sedan" },
      ],
    },
  },
  {
    name: "Tata",
    segments: ["four_wheeler"],
    models: {
      four_wheeler: [
        { name: "Nexon", ...Y(2020), type: "suv" },
        { name: "Punch", ...Y(2021), type: "suv" },
        { name: "Harrier", ...Y(2019), type: "suv" },
        { name: "Tiago", ...Y(2018), type: "hatchback" },
      ],
    },
  },
  {
    name: "Mahindra",
    segments: ["four_wheeler"],
    models: {
      four_wheeler: [
        { name: "XUV700", ...Y(2021), type: "suv" },
        { name: "Thar", ...Y(2020), type: "suv" },
        { name: "Scorpio-N", ...Y(2022), type: "suv" },
        { name: "Bolero Pik-Up", ...Y(2018), type: "pickup" },
      ],
    },
  },
  {
    name: "Toyota",
    segments: ["four_wheeler"],
    models: {
      four_wheeler: [
        { name: "Innova Crysta", ...Y(2018), type: "muv" },
        { name: "Fortuner", ...Y(2018), type: "suv" },
        { name: "Urban Cruiser Hyryder", ...Y(2022), type: "suv" },
      ],
    },
  },
  {
    name: "Kia",
    segments: ["four_wheeler"],
    models: {
      four_wheeler: [
        { name: "Seltos", ...Y(2019), type: "suv" },
        { name: "Sonet", ...Y(2020), type: "suv" },
        { name: "Carens", ...Y(2022), type: "muv" },
      ],
    },
  },
  {
    name: "Skoda",
    segments: ["four_wheeler"],
    models: {
      four_wheeler: [
        { name: "Kushaq", ...Y(2021), type: "suv" },
        { name: "Slavia", ...Y(2022), type: "sedan" },
      ],
    },
  },
  {
    name: "Volkswagen",
    segments: ["four_wheeler"],
    models: {
      four_wheeler: [
        { name: "Taigun", ...Y(2021), type: "suv" },
        { name: "Virtus", ...Y(2022), type: "sedan" },
      ],
    },
  },
  {
    name: "MG",
    segments: ["four_wheeler"],
    models: {
      four_wheeler: [
        { name: "Hector", ...Y(2019), type: "suv" },
        { name: "Astor", ...Y(2021), type: "suv" },
      ],
    },
  },
  {
    name: "Mercedes-Benz",
    segments: ["four_wheeler"],
    models: {
      four_wheeler: [
        { name: "C-Class", ...Y(2019), type: "sedan" },
        { name: "GLA", ...Y(2020), type: "suv" },
      ],
    },
  },
  // ── Trucks / commercial ──
  {
    name: "Tata Motors",
    segments: ["truck"],
    models: {
      truck: [
        { name: "Ace Gold", ...Y(2018), type: "light_truck" },
        { name: "407", ...Y(2018), type: "light_truck" },
        { name: "Signa 2818", ...Y(2019), type: "heavy_truck" },
        { name: "Prima 2830", ...Y(2019), type: "tipper" },
      ],
    },
  },
  {
    name: "Ashok Leyland",
    segments: ["truck"],
    models: {
      truck: [
        { name: "Dost", ...Y(2018), type: "light_truck" },
        { name: "Partner", ...Y(2019), type: "light_truck" },
        { name: "2820", ...Y(2019), type: "heavy_truck" },
        { name: "Viking", ...Y(2018), type: "bus" },
      ],
    },
  },
  {
    name: "Eicher",
    segments: ["truck"],
    models: {
      truck: [
        { name: "Pro 2049", ...Y(2018), type: "light_truck" },
        { name: "Pro 3015", ...Y(2019), type: "heavy_truck" },
        { name: "Skyline Pro", ...Y(2019), type: "bus" },
      ],
    },
  },
  {
    name: "BharatBenz",
    segments: ["truck"],
    models: {
      truck: [
        { name: "1015R", ...Y(2019), type: "light_truck" },
        { name: "2823C", ...Y(2020), type: "tipper" },
      ],
    },
  },
  {
    name: "Mahindra Trucks",
    segments: ["truck"],
    models: {
      truck: [
        { name: "Blazo X 28", ...Y(2019), type: "heavy_truck" },
        { name: "Furio 7", ...Y(2020), type: "light_truck" },
      ],
    },
  },
  {
    name: "Volvo Trucks",
    segments: ["truck"],
    models: {
      truck: [
        { name: "FM 420", ...Y(2019), type: "heavy_truck" },
        { name: "FMX 460", ...Y(2020), type: "tipper" },
      ],
    },
  },
  {
    name: "SML Isuzu",
    segments: ["truck"],
    models: {
      truck: [
        { name: "Sartaj GS", ...Y(2018), type: "light_truck" },
        { name: "Samrat GS", ...Y(2019), type: "light_truck" },
      ],
    },
  },
];

const CATEGORIES: { name: string; segment?: Segment }[] = [
  { name: "Helmets", segment: "two_wheeler" },
  { name: "Crash Guards", segment: "two_wheeler" },
  { name: "Bike Covers", segment: "two_wheeler" },
  { name: "Mobile Holders", segment: "two_wheeler" },
  { name: "Seat Covers", segment: "four_wheeler" },
  { name: "Dash Cams", segment: "four_wheeler" },
  { name: "Floor Mats", segment: "four_wheeler" },
  { name: "Car Covers", segment: "four_wheeler" },
  { name: "Interior Accessories", segment: "four_wheeler" },
  { name: "Tarpaulins", segment: "truck" },
  { name: "Tail Lamps", segment: "truck" },
  { name: "Mud Flaps", segment: "truck" },
  { name: "Horns", segment: "truck" },
  { name: "Lighting" },
  { name: "Mirrors" },
  { name: "Care & Cleaning" },
  { name: "Tool Kits" },
];

type ProductSeed = {
  name: string;
  category: string;
  brand: string;
  models: string[];
  price: number;
  discount?: number;
  stock: number;
  specs: Record<string, string>;
  description: string;
  youtube?: string;
};

const PRODUCTS: ProductSeed[] = [
  // Two wheeler
  {
    name: "Full Face ISI Helmet – Matte Black",
    category: "Helmets",
    brand: "Hero",
    models: ["Splendor Plus", "HF Deluxe", "Xtreme 160R"],
    price: 2499,
    discount: 1899,
    stock: 40,
    specs: {
      Size: "M / L / XL",
      Shell: "ABS",
      Certification: "ISI & DOT",
      Visor: "Anti-scratch clear",
      Weight: "1.35 kg",
    },
    description:
      "Aerodynamic full-face helmet with quick-release buckle, multi-density EPS liner and washable cheek pads. Suitable for daily commuting and highway rides.",
    youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    name: "Open Face Helmet with Peak – Gloss White",
    category: "Helmets",
    brand: "Honda",
    models: ["Activa 6G"],
    price: 1699,
    discount: 1399,
    stock: 55,
    specs: {
      Size: "M / L",
      Shell: "HIPS",
      Certification: "ISI",
      Visor: "Detachable peak",
      Weight: "1.05 kg",
    },
    description:
      "Lightweight open-face helmet ideal for scooters and city commutes. Breathable liner and UV-protected finish.",
  },
  {
    name: "Steel Crash Guard – Splendor Plus",
    category: "Crash Guards",
    brand: "Hero",
    models: ["Splendor Plus"],
    price: 1299,
    discount: 999,
    stock: 30,
    specs: {
      Material: "Mild steel, 22mm tube",
      Finish: "Powder coated black",
      Mounting: "Bolt-on, no drilling",
      Weight: "2.1 kg",
    },
    description:
      "Heavy-duty leg guard that protects the engine and your legs during slow-speed falls. Fits factory mounting points.",
  },
  {
    name: "Engine Crash Guard – Classic 350 (Chrome)",
    category: "Crash Guards",
    brand: "Royal Enfield",
    models: ["Classic 350", "Hunter 350"],
    price: 2899,
    discount: 2499,
    stock: 18,
    specs: {
      Material: "Stainless steel 25mm",
      Finish: "Mirror chrome",
      Mounting: "OEM bolt points",
      Weight: "3.4 kg",
    },
    description:
      "Chrome crash guard with integrated slider pads. Adds classic character while protecting the engine casing.",
  },
  {
    name: "Frame Slider Kit – Pulsar NS200",
    category: "Crash Guards",
    brand: "Bajaj",
    models: ["Pulsar NS200"],
    price: 1599,
    stock: 22,
    specs: { Material: "CNC aluminium + Delrin puck", Colour: "Black / Red", Pack: "2 pcs" },
    description: "CNC machined frame sliders that absorb impact and protect fairings and engine covers.",
  },
  {
    name: "Waterproof Bike Body Cover – Universal Large",
    category: "Bike Covers",
    brand: "Hero",
    models: ["Splendor Plus", "HF Deluxe", "Xtreme 160R", "Destini 125"],
    price: 899,
    discount: 649,
    stock: 120,
    specs: {
      Material: "190T polyester with PU coating",
      Size: "Fits bikes up to 2.1 m",
      Features: "Mirror pockets, elastic hem, lock holes",
    },
    description: "All-weather cover protecting against rain, dust and UV. Compact carry pouch included.",
  },
  {
    name: "Scooter Body Cover – Activa / Jupiter",
    category: "Bike Covers",
    brand: "TVS",
    models: ["Jupiter", "iQube"],
    price: 799,
    discount: 599,
    stock: 80,
    specs: {
      Material: "Taffeta with silver coating",
      Size: "Scooter",
      Features: "Buckle strap, mirror pockets",
    },
    description: "Heat-reflective scooter cover that keeps the seat cool and paint protected.",
  },
  {
    name: "Aluminium Mobile Holder with USB Charger",
    category: "Mobile Holders",
    brand: "Yamaha",
    models: ["FZ-S V3", "R15 V4"],
    price: 1199,
    discount: 899,
    stock: 65,
    specs: {
      Material: "Aluminium alloy",
      "Phone size": "4.7 – 7 inch",
      Charger: "USB-A 2.1A, waterproof cap",
      Mount: "Handlebar 22–32 mm",
    },
    description:
      "360° rotating phone mount with anti-vibration cradle and inline USB charger for navigation on the go.",
  },
  {
    name: "Quad-lock Style Mount – KTM Duke",
    category: "Mobile Holders",
    brand: "KTM",
    models: ["Duke 200", "RC 390"],
    price: 1499,
    stock: 25,
    specs: { Material: "Glass-filled nylon", Lock: "Twist-lock", Mount: "Handlebar / mirror stem" },
    description: "Secure twist-lock mount with vibration dampener designed for high-revving singles.",
  },
  {
    name: "LED Auxiliary Fog Lamps – 20W Pair",
    category: "Lighting",
    brand: "Royal Enfield",
    models: ["Himalayan 450", "Classic 350"],
    price: 2699,
    discount: 2199,
    stock: 35,
    specs: { Power: "20W each", Lumen: "2000 lm each", Beam: "Spot + flood", Rating: "IP67", Voltage: "12V" },
    description:
      "Bright, compact LED aux lights with a relay harness and handlebar switch for safer night riding.",
  },
  {
    name: "Bar-end Mirrors – Round Black",
    category: "Mirrors",
    brand: "Jawa",
    models: ["Jawa 42"],
    price: 1299,
    stock: 40,
    specs: { Material: "Aluminium", Glass: "Convex anti-glare", Fit: "13–18 mm inner bar" },
    description: "Retro round bar-end mirrors with adjustable arms for a clean, classic look.",
  },
  {
    name: "Riding Gloves – Knuckle Protection",
    category: "Helmets",
    brand: "Ola",
    models: ["S1 Pro"],
    price: 999,
    discount: 749,
    stock: 60,
    specs: {
      Size: "M / L / XL",
      Material: "Mesh + synthetic leather",
      Protection: "TPU knuckle",
      Touchscreen: "Yes",
    },
    description: "Breathable riding gloves with touchscreen fingertips and hard knuckle protection.",
  },
  // Four wheeler
  {
    name: "PU Leather Seat Covers – Swift (Beige/Black)",
    category: "Seat Covers",
    brand: "Maruti Suzuki",
    models: ["Swift", "Baleno", "Dzire"],
    price: 6999,
    discount: 5499,
    stock: 20,
    specs: {
      Material: "PU leatherette",
      Fit: "Custom bucket fit",
      Airbag: "Compatible",
      Colour: "Beige / Black",
      Warranty: "1 year",
    },
    description:
      "Custom-fit seat covers with foam padding and airbag-compatible stitching. Easy to clean and fade resistant.",
  },
  {
    name: "Nappa Leather Seat Covers – Creta",
    category: "Seat Covers",
    brand: "Hyundai",
    models: ["Creta", "Venue"],
    price: 9999,
    discount: 8499,
    stock: 12,
    specs: { Material: "Nappa leather finish", Fit: "Custom", Airbag: "Compatible", Colour: "Tan / Black" },
    description: "Premium quilted seat covers with headrest and armrest covers included.",
  },
  {
    name: "4K Dual Channel Dash Cam with GPS",
    category: "Dash Cams",
    brand: "Tata",
    models: ["Nexon", "Harrier", "Punch"],
    price: 8999,
    discount: 7499,
    stock: 15,
    specs: {
      Resolution: "Front 4K / Rear 1080p",
      "Field of view": "150°",
      Storage: "microSD up to 256 GB",
      GPS: "Built-in",
      "Parking mode": "Yes (hardwire kit)",
    },
    description:
      "Crisp 4K recording with night vision, loop recording and Wi-Fi app for instant clip download.",
    youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    name: "Mirror-mount Dash Cam 1080p",
    category: "Dash Cams",
    brand: "Maruti Suzuki",
    models: ["Brezza", "Ertiga", "Swift"],
    price: 3999,
    discount: 3299,
    stock: 28,
    specs: {
      Resolution: "1080p",
      Display: "4.3 inch mirror",
      Storage: "microSD up to 128 GB",
      "Night vision": "WDR",
    },
    description: "Clip-on mirror dash cam that keeps your dashboard clean while recording every drive.",
  },
  {
    name: "7D Floor Mats – Nexon (Black/Red)",
    category: "Floor Mats",
    brand: "Tata",
    models: ["Nexon"],
    price: 4499,
    discount: 3799,
    stock: 24,
    specs: {
      Material: "PU leather + EVA",
      Layers: "7D with grass mat",
      Fit: "Custom",
      Colour: "Black with red stitching",
    },
    description: "Custom-fit 7D mats with raised edges to trap dirt and water. Anti-skid backing.",
  },
  {
    name: "3D Boot Mat – XUV700",
    category: "Floor Mats",
    brand: "Mahindra",
    models: ["XUV700", "Scorpio-N"],
    price: 2499,
    stock: 30,
    specs: { Material: "TPE rubber", Fit: "Custom", Features: "Raised lip, anti-slip" },
    description: "Waterproof, odourless TPE boot liner that protects the trunk from spills and mud.",
  },
  {
    name: "Waterproof Car Body Cover – Sedan",
    category: "Car Covers",
    brand: "Honda",
    models: ["City", "Amaze"],
    price: 2299,
    discount: 1799,
    stock: 35,
    specs: {
      Material: "Silver polyester with cotton lining",
      Size: "Sedan up to 4.6 m",
      Features: "Mirror pockets, elastic hem, buckle",
    },
    description: "Triple-layer body cover with soft lining to protect paint from scratches, dust and UV.",
  },
  {
    name: "Ambient LED Strip Kit – RGB App Control",
    category: "Interior Accessories",
    brand: "Kia",
    models: ["Seltos", "Sonet"],
    price: 1999,
    discount: 1499,
    stock: 45,
    specs: {
      Colours: "16M RGB",
      Control: "Bluetooth app + music sync",
      Length: "4 × 1.2 m fibre strips",
      Power: "12V cigarette lighter",
    },
    description: "Fibre-optic ambient lighting kit with app control for a premium cabin feel.",
  },
  {
    name: "Neck Rest Cushion Pair – Memory Foam",
    category: "Interior Accessories",
    brand: "Toyota",
    models: ["Innova Crysta", "Fortuner"],
    price: 1299,
    discount: 999,
    stock: 70,
    specs: { Material: "Memory foam + breathable mesh", Pack: "2 pcs", Strap: "Adjustable elastic" },
    description: "Ergonomic neck support for long drives, fits all headrests.",
  },
  {
    name: "Wireless Phone Charger Console – Creta",
    category: "Interior Accessories",
    brand: "Hyundai",
    models: ["Creta"],
    price: 3499,
    stock: 16,
    specs: { Output: "15W Qi", Fit: "Custom console insert", Input: "USB-C 12V" },
    description: "Drop-in wireless charging pad that replaces the factory console tray.",
  },
  {
    name: "Wide-angle Blind Spot Mirrors – Pair",
    category: "Mirrors",
    brand: "Skoda",
    models: ["Kushaq", "Slavia"],
    price: 499,
    discount: 349,
    stock: 150,
    specs: { Diameter: "50 mm", Glass: "HD convex", Mount: "3M adhesive, 360° swivel" },
    description: "Frameless blind-spot mirrors that make lane changes safer.",
  },
  {
    name: "Microfibre Car Care Kit – 8 pcs",
    category: "Care & Cleaning",
    brand: "Volkswagen",
    models: ["Taigun", "Virtus"],
    price: 1499,
    discount: 1199,
    stock: 90,
    specs: { Includes: "Shampoo 500 ml, wax 250 g, 3 microfibre towels, wheel brush, sponge, applicator" },
    description: "Everything you need for a showroom shine at home.",
  },
  // Truck / commercial
  {
    name: "HDPE Tarpaulin 24×18 ft – 200 GSM Blue",
    category: "Tarpaulins",
    brand: "Tata Motors",
    models: ["407", "Signa 2818", "Ace Gold"],
    price: 4999,
    discount: 4299,
    stock: 25,
    specs: {
      Material: "HDPE laminated",
      GSM: "200",
      Size: "24 × 18 ft",
      Eyelets: "Aluminium every 1 m",
      Colour: "Blue / Silver",
    },
    description:
      "UV-stabilised waterproof tarpaulin for covering cargo in all seasons. Reinforced hems and rope included.",
  },
  {
    name: "Heavy-duty Tarpaulin 30×20 ft – 250 GSM",
    category: "Tarpaulins",
    brand: "Ashok Leyland",
    models: ["2820", "Dost", "Partner"],
    price: 7499,
    discount: 6799,
    stock: 14,
    specs: {
      Material: "Cross-laminated HDPE",
      GSM: "250",
      Size: "30 × 20 ft",
      Eyelets: "Brass",
      Warranty: "1 year",
    },
    description: "Extra-thick tarpaulin for heavy trucks; tear resistant and rot proof.",
  },
  {
    name: "LED Tail Lamp Assembly – Eicher Pro (Pair)",
    category: "Tail Lamps",
    brand: "Eicher",
    models: ["Pro 2049", "Pro 3015"],
    price: 3299,
    discount: 2899,
    stock: 20,
    specs: {
      Type: "LED combination lamp",
      Functions: "Stop / tail / indicator / reverse",
      Voltage: "12–24V",
      Rating: "IP67",
    },
    description: "Direct-fit LED tail lamp assembly with sealed housing for long service life.",
    youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    name: "Tail Lamp Assembly – Ashok Leyland Dost",
    category: "Tail Lamps",
    brand: "Ashok Leyland",
    models: ["Dost", "Partner"],
    price: 1899,
    stock: 32,
    specs: { Type: "Bulb type", Functions: "Stop / tail / indicator", Voltage: "12V", Side: "Left + Right" },
    description: "OEM-spec replacement tail lamp housing with lens and bulb holders.",
  },
  {
    name: "Rubber Mud Flaps – Heavy Truck (Pair)",
    category: "Mud Flaps",
    brand: "BharatBenz",
    models: ["1015R", "2823C"],
    price: 1499,
    discount: 1249,
    stock: 40,
    specs: {
      Material: "Reinforced rubber",
      Size: "24 × 30 inch",
      Thickness: "6 mm",
      Mounting: "Steel bracket",
    },
    description: "Anti-sail mud flaps that reduce spray and protect the chassis from stone chips.",
  },
  {
    name: "Dual-tone Air Horn 24V – 150 dB",
    category: "Horns",
    brand: "Volvo Trucks",
    models: ["FM 420", "FMX 460"],
    price: 2999,
    discount: 2599,
    stock: 22,
    specs: {
      Voltage: "24V",
      Sound: "150 dB dual tone",
      Material: "Chrome-plated trumpets",
      Includes: "Compressor, relay, tubing",
    },
    description: "Loud, clear air horn set with compressor for highway safety.",
  },
  {
    name: "Truck Tool Kit – 42 pcs with Case",
    category: "Tool Kits",
    brand: "Mahindra Trucks",
    models: ["Blazo X 28", "Furio 7"],
    price: 3499,
    discount: 2999,
    stock: 18,
    specs: {
      Pieces: "42",
      Includes: "Sockets 8–32 mm, ratchet, spanners, pliers, screwdriver set",
      Case: "Blow-moulded",
    },
    description: "Roadside essentials kit for drivers, packed in a durable carry case.",
  },
  {
    name: "Cabin LED Work Light Bar 12/24V",
    category: "Lighting",
    brand: "SML Isuzu",
    models: ["Sartaj GS", "Samrat GS"],
    price: 1799,
    discount: 1499,
    stock: 36,
    specs: { Power: "36W", Lumen: "3600 lm", Voltage: "12–24V", Rating: "IP68", Length: "7 inch" },
    description: "Compact LED light bar for loading yards and night-time deliveries.",
  },
];

async function seedUsers() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const users = [
    {
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@anithaarunthadhi.test",
      password: process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345",
      name: "Store Admin",
      role: "admin" as const,
      fallbackId: "00000000-0000-4000-8000-000000000001",
    },
    {
      email: process.env.SEED_CUSTOMER_EMAIL ?? "customer@anithaarunthadhi.test",
      password: process.env.SEED_CUSTOMER_PASSWORD ?? "Customer@12345",
      name: "Demo Customer",
      role: "customer" as const,
      fallbackId: "00000000-0000-4000-8000-000000000002",
    },
  ];

  const ids: Record<string, string> = {};

  if (url && key && !url.includes("YOUR-PROJECT-REF")) {
    const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    for (const u of users) {
      let id: string | undefined;
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.name },
      });
      if (error) {
        // already exists → look it up
        const list = await supabase.auth.admin.listUsers({ perPage: 1000 });
        id = list.data.users.find((x) => x.email?.toLowerCase() === u.email.toLowerCase())?.id;
        if (!id) throw error;
      } else id = data.user!.id;
      await prisma.profile.upsert({
        where: { id },
        create: { id, email: u.email, fullName: u.name, role: u.role, phone: "9000000000" },
        update: { role: u.role, fullName: u.name },
      });
      ids[u.role] = id;
      console.log(`  user ${u.email} (${u.role}) → ${id}`);
    }
  } else {
    console.log("  Supabase service key not set — inserting profiles with fixed UUIDs (local mode)");
    for (const u of users) {
      await prisma.profile.upsert({
        where: { id: u.fallbackId },
        create: { id: u.fallbackId, email: u.email, fullName: u.name, role: u.role, phone: "9000000000" },
        update: { role: u.role },
      });
      ids[u.role] = u.fallbackId;
    }
  }
  return ids;
}

async function main() {
  console.log("Seeding Anithaarunthadhi …");

  // Site settings
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      storeName: "Anithaarunthadhi",
      tagline: "Accessories for every ride — bikes, cars & trucks",
      heroYoutubeUrl: "https://youtube.com/shorts/Gjhb-jiVqZY",
      homeDescription:
        "Anithaarunthadhi is your one-stop shop for genuine and aftermarket accessories for two-wheelers, cars, SUVs and commercial vehicles. From helmets and crash guards to seat covers, dash cams, tarpaulins and lighting — we stock parts that fit your exact make, model and year, delivered to your doorstep across India.",
      aboutStory:
        "Started as a small roadside accessories shop, Anithaarunthadhi has grown into a trusted destination for riders, drivers and fleet owners. We hand-pick every product for fit, durability and value.",
      aboutMission:
        "Our mission is simple: make it effortless to find accessories that fit your vehicle perfectly, at honest prices, backed by real people who know vehicles.",
      aboutGallery: [
        img("Store front", "e5e7eb"),
        img("Workshop", "e5e7eb"),
        img("Helmets wall", "e5e7eb"),
        img("Truck accessories", "e5e7eb"),
      ],
      mapEmbedUrl: "https://www.google.com/maps?q=Chennai%2C%20Tamil%20Nadu&output=embed",
      contactPhone: "+91 86086 12481",
      contactEmail: "hello@anithaarunthadhi.in",
      addressLine1: "12, Bypass Road, Near Bus Stand",
      addressLine2: "Vadapalani",
      city: "Chennai, Tamil Nadu 600026",
      altContactName: "Arun",
      altContactPhone: "+91 98400 00000",
      youtubeUrl: "https://youtube.com/@anithaarunthadhi",
      instagramUrl: "https://instagram.com/anithaarunthadhi",
      whatsappNumber: "918608612481",
      deliveryCharge: 49,
      freeDeliveryThreshold: 999,
      codEnabled: true,
    },
    update: {},
  });

  // Categories
  const categoryIds: Record<string, string> = {};
  for (const [i, c] of CATEGORIES.entries()) {
    const row = await prisma.category.upsert({
      where: { slug: slugify(c.name) },
      create: { name: c.name, slug: slugify(c.name), segment: c.segment, sortOrder: i },
      update: { segment: c.segment, sortOrder: i },
    });
    categoryIds[c.name] = row.id;
  }
  console.log(`  ${CATEGORIES.length} categories`);

  // Brands → models → variants
  const brandIds: Record<string, string> = {};
  const modelVariantIds: Record<string, string[]> = {}; // key: `${brand}::${model}`
  let variantCount = 0;
  for (const [i, b] of BRANDS.entries()) {
    const slug = slugify(b.name);
    const brand = await prisma.brand.upsert({
      where: { slug },
      create: {
        name: b.name,
        slug,
        logoUrl: logo(b.name),
        sortOrder: i,
        segments: { create: b.segments.map((segment) => ({ segment })) },
      },
      update: { name: b.name, sortOrder: i },
    });
    brandIds[b.name] = brand.id;
    for (const segment of b.segments) {
      await prisma.brandSegment.upsert({
        where: { brandId_segment: { brandId: brand.id, segment } },
        create: { brandId: brand.id, segment },
        update: {},
      });
      for (const m of b.models[segment] ?? []) {
        const mslug = slugify(m.name);
        const model = await prisma.vehicleModel.upsert({
          where: { brandId_slug: { brandId: brand.id, slug: mslug } },
          create: {
            brandId: brand.id,
            segment,
            name: m.name,
            slug: mslug,
            imageUrl: img(`${b.name} ${m.name}`, "ffffff"),
          },
          update: { segment, name: m.name },
        });
        const ids: string[] = [];
        for (let year = m.from; year <= m.to; year++) {
          const v = await prisma.vehicleVariant.upsert({
            where: { modelId_year_vehicleType: { modelId: model.id, year, vehicleType: m.type } },
            create: { modelId: model.id, year, vehicleType: m.type },
            update: {},
          });
          ids.push(v.id);
          variantCount++;
        }
        modelVariantIds[`${b.name}::${m.name}`] = ids;
      }
    }
  }
  console.log(
    `  ${BRANDS.length} brands, ${Object.keys(modelVariantIds).length} models, ${variantCount} variants`,
  );

  // Products
  for (const [i, p] of PRODUCTS.entries()) {
    const slug = slugify(p.name);
    const sku = `AN-${String(i + 1).padStart(4, "0")}`;
    const variantIds = p.models.flatMap((m) => modelVariantIds[`${p.brand}::${m}`] ?? []);
    if (variantIds.length === 0) console.warn(`  ! no variants found for ${p.name}`);
    const product = await prisma.product.upsert({
      where: { slug },
      create: {
        name: p.name,
        slug,
        sku,
        brandId: brandIds[p.brand],
        categoryId: categoryIds[p.category],
        description: p.description,
        specs: p.specs,
        price: new Prisma.Decimal(p.price),
        discountPrice: p.discount ? new Prisma.Decimal(p.discount) : null,
        stock: p.stock,
        isActive: true,
        images: {
          create: [
            { url: img(p.name.split(" – ")[0]), alt: p.name, sortOrder: 0 },
            {
              url: img(`${p.name.split(" – ")[0]} – side`, "e4e4e7"),
              alt: `${p.name} side view`,
              sortOrder: 1,
            },
            {
              url: img(`${p.name.split(" – ")[0]} – detail`, "d4d4d8"),
              alt: `${p.name} detail`,
              sortOrder: 2,
            },
          ],
        },
        videos: p.youtube ? { create: [{ kind: "youtube", url: p.youtube }] } : undefined,
        compat: { create: variantIds.map((vehicleVariantId) => ({ vehicleVariantId })) },
      },
      update: {
        price: new Prisma.Decimal(p.price),
        discountPrice: p.discount ? new Prisma.Decimal(p.discount) : null,
        stock: p.stock,
        specs: p.specs,
      },
    });
    void product;
  }
  console.log(`  ${PRODUCTS.length} products`);

  const ids = await seedUsers();

  // A sample delivered order for the demo customer so they can post a review
  const customerId = ids.customer;
  const sample = await prisma.product.findFirst({ where: { slug: slugify(PRODUCTS[0].name) } });
  if (customerId && sample) {
    const existing = await prisma.order.findFirst({ where: { userId: customerId } });
    if (!existing) {
      const unit = sample.discountPrice ?? sample.price;
      const address = await prisma.address.create({
        data: {
          userId: customerId,
          fullName: "Demo Customer",
          phone: "9000000000",
          line1: "5, Anna Nagar Main Road",
          city: "Chennai",
          state: "Tamil Nadu",
          pincode: "600040",
          isDefault: true,
        },
      });
      await prisma.order.create({
        data: {
          orderNumber: `AN-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-0001`,
          userId: customerId,
          addressId: address.id,
          shippingAddress: {
            fullName: address.fullName,
            phone: address.phone,
            line1: address.line1,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
          },
          status: "delivered",
          paymentMethod: "cod",
          paymentStatus: "paid",
          subtotal: unit,
          discount: 0,
          deliveryCharge: 0,
          total: unit,
          deliveredAt: new Date(),
          items: {
            create: [
              {
                productId: sample.id,
                name: sample.name,
                sku: sample.sku,
                imageUrl: img(sample.name.split(" – ")[0]),
                unitPrice: unit,
                quantity: 1,
                lineTotal: unit,
              },
            ],
          },
          history: {
            create: [
              { toStatus: "placed", note: "Order placed (seed)" },
              { fromStatus: "placed", toStatus: "delivered", note: "Delivered (seed)" },
            ],
          },
          payment: { create: { provider: "cod", amount: unit, status: "paid" } },
        },
      });
      console.log("  1 sample delivered order");
    }
  }

  console.log("Done ✔");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
