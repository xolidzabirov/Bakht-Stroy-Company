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
