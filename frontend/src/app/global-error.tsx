"use client";

/**
 * The last safety net: the root layout itself failed, so there are no styles, fonts or texts —
 * a self-contained page in Russian and Tajik with a reload button and the shop phone.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#0a0a0a",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, Roboto, Arial, sans-serif",
          textAlign: "center",
          padding: 16,
        }}
      >
        <main style={{ maxWidth: 440 }}>
          <div style={{ width: 72, height: 72, margin: "0 auto", borderRadius: 20, background: "#ffb800", color: "#0a0a0a", display: "grid", placeItems: "center", fontSize: 40, fontWeight: 800 }}>
            B
          </div>
          <h1 style={{ fontSize: 26, margin: "24px 0 8px" }}>Сайт временно недоступен</h1>
          <p style={{ color: "rgba(255,255,255,.75)", margin: 0, lineHeight: 1.6 }}>
            Мы уже чиним. Попробуйте через минуту или позвоните:{" "}
            <a href="tel:+992907666609" style={{ color: "#ffb800" }}>
              +992 90 766 66 09
            </a>
          </p>
          <p lang="tg" style={{ color: "rgba(255,255,255,.6)", margin: "8px 0 0" }}>
            Сайт муваққатан дастнорас аст — баъд аз як дақиқа кӯшиш кунед.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ marginTop: 24, height: 44, padding: "0 22px", border: 0, borderRadius: 12, background: "#ffb800", color: "#0a0a0a", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
          >
            Обновить страницу
          </button>
          {error.digest && <p style={{ marginTop: 24, fontSize: 12, color: "rgba(255,255,255,.5)", fontFamily: "monospace" }}>#{error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
