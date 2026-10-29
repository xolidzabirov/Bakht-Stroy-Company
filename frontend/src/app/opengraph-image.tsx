import { ImageResponse } from "next/og";
import { site } from "@/shared/config/site";
import { formatPhone } from "@/shared/lib/format";

/**
 * Link preview (Telegram, WhatsApp, Facebook, search): the brand card for every page
 * that has no picture of its own (products and posts use their photo). Built once, at deploy.
 * Latin text only: the default font of the image renderer has no Cyrillic.
 */
export const alt = "Bakht Stroy Company — building materials in Dushanbe";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0A0A0A", color: "#FFFFFF", fontFamily: "sans-serif" }}>
        <div style={{ width: 28, height: "100%", background: "#FFB800" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px 80px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <svg width="120" height="120" viewBox="0 0 100 100">
              <rect width="100" height="100" rx="24" fill="#FFB800" />
              <path d="M22 41 A30 30 0 0 1 74 28" fill="none" stroke="#0A0A0A" strokeWidth="7" />
              <path d="M78 59 A30 30 0 0 1 26 72" fill="none" stroke="#0A0A0A" strokeWidth="7" />
              <path d="M14 41 H30" stroke="#0A0A0A" strokeWidth="7" />
              <path d="M70 59 H86" stroke="#0A0A0A" strokeWidth="7" />
              <path
                d="M38 30 H54 C62 30 66 34 66 40 C66 44 64 47 60.5 48.5 C65 50 68 53.5 68 58.5 C68 65.5 63 70 54.5 70 H38 Z M47 37.5 V46 H53 C56 46 57.5 44.5 57.5 41.8 C57.5 39 56 37.5 53 37.5 Z M47 52.5 V62.5 H54 C57.5 62.5 59 60.8 59 57.6 C59 54.3 57.5 52.5 54 52.5 Z"
                fill="#0A0A0A"
                fillRule="evenodd"
              />
            </svg>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -1 }}>BAKHT STROY</div>
              <div style={{ fontSize: 26, letterSpacing: 8, color: "#FFB800" }}>COMPANY · DUSHANBE</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.15, maxWidth: 900 }}>Building materials for every project — with delivery to your site</div>
            <div style={{ fontSize: 30, color: "rgba(255,255,255,0.7)" }}>Asphalt · Cement & concrete · Bricks · Rebar · Windows & doors</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 34, fontWeight: 700 }}>
            <div style={{ display: "flex", background: "#FFB800", color: "#0A0A0A", borderRadius: 16, padding: "10px 24px" }}>{formatPhone(site.phones[0])}</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontWeight: 400 }}>Mon–Sat 08:00–17:30</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
