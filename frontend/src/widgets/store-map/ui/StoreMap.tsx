"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MapLibreMap, Marker, Popup } from "maplibre-gl";
import { Box, Loader2, Map as MapIcon, MapPinOff, Maximize2, Minimize2, Satellite } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { mapLinks } from "@/shared/lib/maps";
import { applyRelief, type Base, cameraDuration, styleFor, type Theme } from "./mapStyle";

export type StorePoint = { name: string; address: string | null; lat: number; lng: number };

/** The map does not leave Tajikistan and the land around it. */
const MAX_BOUNDS: [[number, number], [number, number]] = [
  [64.5, 35.2],
  [78, 42.6],
];

const PIN_ICON =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12M6 14h12"/><path d="M6 22V10h12v12"/></svg>';

/** The theme lives in <html data-theme>, the toggle in the header changes it. */
function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const currentTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
const serverTheme = (): Theme => "light";

function boundsOf(points: StorePoint[]): [[number, number], [number, number]] {
  const lngs = points.map((point) => point.lng);
  const lats = points.map((point) => point.lat);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

function textNode(className: string, text: string) {
  const node = document.createElement("p");
  node.className = className;
  node.textContent = text;
  return node;
}

/** The card of a warehouse. Built from text nodes: the names come from the admin panel. */
function popupCard(point: StorePoint, workHours: string | null, routeLabel: string) {
  const card = document.createElement("div");
  card.className = "store-popup__card";
  card.append(textNode("store-popup__name", point.name));
  if (point.address) card.append(textNode("store-popup__text", point.address));
  if (workHours) card.append(textNode("store-popup__text", workHours));
  const route = mapLinks(null, point)?.route;
  if (route) {
    const link = document.createElement("a");
    link.className = "store-popup__route";
    link.href = route;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = routeLabel;
    card.append(link);
  }
  return card;
}

/**
 * The warehouses of the company on an open map: a mark for each of them, a card with the route on click,
 * scheme / satellite / 3D, full screen. The library and the tiles load only when the map is near the screen.
 */
export function StoreMap({ points, workHours, label, className }: { points: StorePoint[]; workHours: string | null; label: string; className?: string }) {
  const { t, locale } = useI18n();
  const m = t.contacts.map;
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, serverTheme);

  const frame = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const libraryRef = useRef<typeof import("maplibre-gl") | null>(null);
  const styleKey = useRef("");
  const collapseButton = useRef<HTMLButtonElement>(null);
  const expandButton = useRef<HTMLButtonElement>(null);
  const wasExpanded = useRef(false);

  const [near, setNear] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [base, setBase] = useState<Base>("scheme");
  const [is3d, setIs3d] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // What the map callbacks need, without rebuilding the map.
  const latest = useRef({ m, points, base, theme, is3d, locale });
  useEffect(() => {
    latest.current = { m, points, base, theme, is3d, locale };
  });

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true);
      },
      { rootMargin: "400px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // One map for the life of the page.
  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    let map: MapLibreMap | null = null;

    void (async () => {
      const library = await import("maplibre-gl").catch(() => null);
      const container = host.current;
      if (cancelled || !container) return;
      if (!library) return setState("error");
      libraryRef.current = library;
      library.setWorkerUrl(`/vendor/maplibre/${library.getVersion()}/maplibre-gl-worker.mjs`);

      const { m: words, points: start, base: firstBase, theme: firstTheme } = latest.current;
      try {
        map = new library.Map({
          container,
          style: styleFor(firstBase, firstTheme),
          bounds: boundsOf(start),
          fitBoundsOptions: { padding: 70, maxZoom: 13 },
          maxBounds: MAX_BOUNDS,
          maxPitch: 70,
          attributionControl: { compact: true },
          // The page scroll stays the page scroll: Ctrl + wheel or two fingers move the map.
          cooperativeGestures: true,
          locale: {
            "CooperativeGesturesHandler.WindowsHelpText": words.gestureDesktop,
            "CooperativeGesturesHandler.MacHelpText": words.gestureMac,
            "CooperativeGesturesHandler.MobileHelpText": words.gestureMobile,
            "NavigationControl.ZoomIn": words.zoomIn,
            "NavigationControl.ZoomOut": words.zoomOut,
            "NavigationControl.ResetBearing": words.resetNorth,
            "GeolocateControl.FindMyLocation": words.locate,
            "GeolocateControl.LocationNotAvailable": words.locateUnavailable,
          },
        });
      } catch {
        return setState("error"); // No WebGL.
      }

      const created = map;
      mapRef.current = created;
      styleKey.current = `${firstBase}:${firstTheme}`;
      // OpenFreeMap styles point at a few images missing from their sprite: a transparent pixel keeps the console clean.
      created.setMissingStyleImageResolver((id) => {
        if (!created.hasImage(id)) created.addImage(id, { width: 1, height: 1, data: new Uint8Array(4) });
      });

      created.addControl(new library.NavigationControl({ visualizePitch: true }), "top-right");
      created.addControl(new library.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, fitBoundsOptions: { maxZoom: 15 } }), "top-right");
      created.addControl(new library.ScaleControl({ unit: "metric" }), "bottom-right");

      let styleLoaded = false;
      created.once("style.load", () => {
        styleLoaded = true;
      });
      // Failed tiles are not fatal; a style that never arrives is.
      created.on("error", () => {
        if (!styleLoaded) setState("error");
      });
      created.once("load", () => {
        applyRelief(created, latest.current);
        // On a phone the open credits would lie over the buttons: the "i" keeps them one tap away.
        if (container.clientWidth < 640) {
          const credits = container.querySelector(".maplibregl-ctrl-attrib");
          credits?.removeAttribute("open");
          credits?.classList.remove("maplibregl-compact-show");
        }
        setState("ready");
      });
    })();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
  }, [near]);

  // The marks of the warehouses.
  useEffect(() => {
    const map = mapRef.current;
    const library = libraryRef.current;
    if (state !== "ready" || !map || !library) return;

    const markers: Marker[] = [];
    let popup: Popup | null = null;
    for (const point of points) {
      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = "store-pin";
      pin.title = point.name;
      pin.setAttribute("aria-label", point.name);
      pin.innerHTML = `<span class="store-pin__mark">${PIN_ICON}</span>`;
      pin.addEventListener("click", (event) => {
        // Otherwise the map takes this click for a click beside the card and closes it.
        event.stopPropagation();
        popup?.remove();
        popup = new library.Popup({ offset: 46, maxWidth: "280px", className: "store-popup", focusAfterOpen: false })
          .setLngLat([point.lng, point.lat])
          .setDOMContent(popupCard(point, workHours, latest.current.m.route))
          .addTo(map);
        map.easeTo({ center: [point.lng, point.lat], offset: [0, 70], duration: cameraDuration(400) });
      });
      markers.push(new library.Marker({ element: pin, anchor: "bottom" }).setLngLat([point.lng, point.lat]).addTo(map));
    }

    return () => {
      popup?.remove();
      for (const marker of markers) marker.remove();
    };
  }, [state, points, workHours]);

  // Scheme / satellite, the light / dark theme, 3D.
  useEffect(() => {
    const map = mapRef.current;
    if (state !== "ready" || !map) return;

    const key = `${base}:${theme}`;
    if (styleKey.current !== key) {
      styleKey.current = key;
      map.setStyle(styleFor(base, theme), { diff: false });
      map.once("style.load", () => applyRelief(map, latest.current));
    } else {
      applyRelief(map, latest.current);
    }
    map.easeTo({ pitch: is3d ? 55 : 0, duration: cameraDuration(700) });
  }, [state, base, theme, is3d]);

  // Full screen: Esc leaves it, the page behind does not scroll, the focus moves with the button.
  useEffect(() => {
    mapRef.current?.resize();
    if (!expanded) {
      if (wasExpanded.current) expandButton.current?.focus();
      wasExpanded.current = false;
      return;
    }
    wasExpanded.current = true;
    collapseButton.current?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", close);
    };
  }, [expanded]);

  const panel = "bg-surface/90 shadow-[0_8px_24px_rgba(0,0,0,0.25)] ring-1 ring-border backdrop-blur-md";
  const baseButton = (active: boolean) => cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors", active ? "bg-brand text-on-brand" : "text-muted-foreground hover:text-foreground");

  return (
    // The outer box keeps its place on the page; the inner one becomes the full screen.
    <section ref={frame} aria-label={label} className={cn("relative", className)}>
      <div
        role={expanded ? "dialog" : undefined}
        aria-modal={expanded || undefined}
        aria-label={expanded ? m.fullscreen : undefined}
        className={cn("overflow-hidden bg-surface-muted", expanded ? "fixed inset-0 z-[70]" : "absolute inset-0 rounded-[var(--radius-card)] border border-border")}
      >
        {/* A style, not a class: the MapLibre stylesheet sets position: relative on the container. */}
        <div ref={host} style={{ position: "absolute", inset: 0 }} />

        {state !== "ready" && (
          <div className="absolute inset-0 grid place-items-center bg-surface-muted">
            <p role="status" className="flex items-center gap-2.5 px-6 text-center text-sm text-muted-foreground">
              {state === "loading" ? <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden /> : <MapPinOff className="size-5 shrink-0" aria-hidden />}
              {state === "loading" ? m.loading : m.error}
            </p>
          </div>
        )}

        {state === "ready" && (
          <>
            <div role="group" aria-label={m.baseLabel} className={cn("absolute bottom-10 left-3 z-10 flex rounded-full p-1", panel)}>
              {(["scheme", "satellite"] as const).map((option) => (
                <button key={option} type="button" aria-pressed={base === option} onClick={() => setBase(option)} className={baseButton(base === option)}>
                  {option === "satellite" ? <Satellite className="size-3.5" aria-hidden /> : <MapIcon className="size-3.5" aria-hidden />}
                  {m[option]}
                </button>
              ))}
              <span className="mx-1 my-1 w-px bg-border" aria-hidden />
              <button type="button" aria-pressed={is3d} title={m.mode3dHint} onClick={() => setIs3d((value) => !value)} className={baseButton(is3d)}>
                <Box className="size-3.5" aria-hidden />
                3D
              </button>
            </div>

            {expanded ? (
              <button ref={collapseButton} type="button" onClick={() => setExpanded(false)} className={cn("absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors hover:text-muted-foreground", panel)}>
                <Minimize2 className="size-4" aria-hidden />
                {m.collapse}
              </button>
            ) : (
              // On a phone the bottom is taken by the switch above.
              <button ref={expandButton} type="button" onClick={() => setExpanded(true)} className={cn("absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors hover:text-muted-foreground sm:bottom-4 sm:left-1/2 sm:top-auto sm:-translate-x-1/2", panel)}>
                <Maximize2 className="size-4" aria-hidden />
                {m.expand}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
