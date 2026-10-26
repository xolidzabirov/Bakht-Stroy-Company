/**
 * Static company data — used as a fallback when the API (settings) is not available.
 */
export const site = {
  name: "Bakht Stroy Company",
  shortName: "Bakht Stroy",
  description:
    "Все виды строительных материалов в Душанбе: цемент, кирпич, бетон с доставкой миксерами, окна и двери, сантехника, трубы, мебель и бытовая техника.",
  tagline: "Таъмини ҳама намудҳои масолеҳи сохтмонӣ",
  phones: ["+992907666609", "+992929666609", "+992306666609"],
  email: "bahktstroy90@gmail.com",
  address: "Душанбе, ул. Джабор Расулов",
  workHours: "Пн–Сб 08:00–17:30",
  socials: {
    instagram: "https://www.instagram.com/bakht_stroy_company",
    telegram: "https://t.me/bakht_stroy_dushanbe",
    telegram_chat: "https://t.me/bakhtsroy01",
    whatsapp: "https://wa.me/992907666609",
  },
} as const;

export const routes = {
  home: "/",
  catalog: "/catalog",
  category: (slug: string) => `/catalog/${slug}`,
  product: (slug: string) => `/product/${slug}`,
  news: "/news",
  newsItem: (slug: string) => `/news/${slug}`,
  cart: "/cart",
  favorites: "/favorites",
  login: "/login",
  register: "/register",
  account: "/account",
  about: "/about",
  contacts: "/contacts",
  delivery: "/delivery",
} as const;
