import type { components } from "./schema";

/**
 * Short names for the API models (generated from the backend OpenAPI: npm run api:types).
 */
type Schemas = components["schemas"];

export type Category = Schemas["CategoryResource"];
export type Product = Schemas["ProductListResource"];
export type ProductDetails = Schemas["ProductResource"];
export type Image = Schemas["ImageResource"];
export type NewsItem = Schemas["NewsListResource"];
export type NewsDetails = Schemas["NewsResource"];
export type Banner = Schemas["BannerResource"];
export type AdminProduct = Schemas["AdminProductResource"];
export type AdminOrder = Schemas["AdminOrderResource"] & { next_statuses: { value: string; label: string }[] };
export type AdminUser = Schemas["AdminUserResource"];

/** GET /admin/stats */
export type AdminStats = {
  period: { days: number; from: string; to: string };
  users: { total: number; new_today: number; new_7_days: number; new_30_days: number; new_in_period: number; blocked: number; staff: number };
  orders: { total: number; in_period: number; awaiting: number; by_status: { value: string; label: string; count: number }[] };
  revenue: { completed_all_time: number; completed_in_period: number; orders_amount_in_period: number; average_check: number };
  top_products: { product_id: number | null; name: string; quantity: number; amount: number }[];
  catalog: { products: number; active_products: number; out_of_stock: number; low_stock: number; categories: number };
  charts: { date: string; registrations: number; orders: number; amount: number }[];
};

export type Paginated<T> = {
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
};

export type StoreSettings = {
  store: {
    name: string;
    description: string | null;
    phones: string[];
    email: string | null;
    address: string | null;
    work_hours: string | null;
    map: { lat: number | null; lng: number | null };
    socials: Partial<Record<"instagram" | "telegram" | "telegram_chat" | "whatsapp" | "facebook" | "youtube", string | null>>;
  };
  delivery: { price: number; free_from: number; pickup_address: string | null; note: string | null };
  payment: { card_number: string | null; card_holder: string | null; bank: string | null; note: string | null };
  currency: { code: string; name: string; symbol: string; minor_units: number };
};

/** Cart line (written by hand: the generated schema has the totals as strings). */
export type CartItem = {
  id: number;
  product: Product | null;
  quantity: number;
  /** Price per unit now, dirams. */
  price: number;
  total: number;
  /** Why the line cannot be ordered: unavailable | not_enough_stock | below_min_order. */
  problem: "unavailable" | "not_enough_stock" | "below_min_order" | null;
};

export type Cart = {
  items: CartItem[];
  items_count: number;
  /** Sum of the lines without problems, dirams. */
  subtotal: number;
  has_problems: boolean;
  can_checkout: boolean;
};

/** Saved delivery address of the user (/me/addresses). */
export type Address = {
  id: number;
  title: string | null;
  city: string;
  street: string;
  house: string;
  apartment: string | null;
  comment: string | null;
  is_default: boolean;
  full: string;
};

type Labeled<T extends string> = { value: T; label: string };

/** Order as the API returns it after checkout and on the order page. */
export type Order = {
  id: number;
  number: string;
  status: Labeled<string>;
  payment_method: Labeled<"cash" | "card_transfer" | "transfer">;
  payment_status: Labeled<string>;
  delivery_type: Labeled<"delivery" | "pickup">;
  total: number;
  subtotal: number;
  delivery_price: number;
  can_cancel: boolean;
  created_at: string;
  address: { full?: string; city?: string; street?: string; house?: string } | null;
  customer: { name: string; phone: string; email: string };
  comment: string | null;
  items: { id: number; product_slug: string | null; name: string; unit: { label: string }; price: number; quantity: number; total: number; image: string | null }[];
};

/** Order in lists (/orders, dashboard): without items and history. */
export type OrderSummary = Pick<Order, "id" | "number" | "status" | "payment_method" | "payment_status" | "delivery_type" | "total" | "can_cancel" | "created_at"> & {
  items_count: number;
};

export type OrderHistoryEntry = { status: { value: string; label: string }; comment: string | null; created_at: string };

export type AppNotification = {
  id: string;
  type: string | null;
  title: string | null;
  text: string | null;
  order_number: string | null;
  is_read: boolean;
  created_at: string;
};

export type Session = { id: number; device: string; is_current: boolean; last_used_at: string | null; created_at: string; expires_at: string | null };
