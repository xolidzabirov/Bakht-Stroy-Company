import type { LightSpecification, Map as MapLibreMap, SkySpecification, StyleSpecification } from "maplibre-gl";

/*
 * Open map data, no keys needed:
 *  - scheme: OpenFreeMap (OpenStreetMap);
 *  - satellite: Esri World Imagery, through the official service when NEXT_PUBLIC_ARCGIS_KEY is set;
 *  - relief: AWS Terrain Tiles; buildings: the `building` layer of the OpenFreeMap tiles.
 */
export type Base = "scheme" | "satellite";
export type Theme = "light" | "dark";

const SCHEME: Record<Theme, string> = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
};

const ARCGIS_KEY = process.env.NEXT_PUBLIC_ARCGIS_KEY;
const esri = (service: string) =>
  ARCGIS_KEY
    ? `https://ibasemaps-api.arcgis.com/arcgis/rest/services/${service}/MapServer/tile/{z}/{y}/{x}?token=${ARCGIS_KEY}`
    : `https://services.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/tile/{z}/{y}/{x}`;

const SATELLITE: StyleSpecification = {
  version: 8,
  sources: {
    imagery: { type: "raster", tiles: [esri("World_Imagery")], tileSize: 256, maxzoom: 19, attribution: "Esri, Maxar, Earthstar Geographics, GIS User Community" },
    places: { type: "raster", tiles: [esri("Reference/World_Boundaries_and_Places")], tileSize: 256, maxzoom: 19 },
    // Outlines of the buildings for 3D on top of the photo.
    openmaptiles: { type: "vector", url: "https://tiles.openfreemap.org/planet" },
  },
  layers: [
    { id: "imagery", type: "raster", source: "imagery" },
    { id: "places", type: "raster", source: "places" },
  ],
};

export const styleFor = (base: Base, theme: Theme) => (base === "satellite" ? SATELLITE : SCHEME[theme]);

const DEM = {
  type: "raster-dem" as const,
  tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
  tileSize: 256,
  encoding: "terrarium" as const,
  maxzoom: 14,
  attribution: '<a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">AWS Terrain Tiles</a>',
};
// Two sources, as MapLibre advises: one source for both breaks the tile cache.
const TERRAIN_SOURCE = "bakht-terrain";
const HILLSHADE_SOURCE = "bakht-hillshade";
const HILLSHADE_LAYER = "bakht-hillshade";
const BUILDINGS_LAYER = "bakht-buildings-3d";

const SHADE: Record<Theme, { shadow: string; highlight: string; exaggeration: number }> = {
  dark: { shadow: "#000000", highlight: "#8f8f96", exaggeration: 0.35 },
  light: { shadow: "#6b6b70", highlight: "#ffffff", exaggeration: 0.3 },
};

const BUILDINGS: Record<Theme | "satellite", { low: string; high: string; opacity: number }> = {
  dark: { low: "#26262b", high: "#4a4a52", opacity: 0.9 },
  light: { low: "#dcd8cf", high: "#f5f3ee", opacity: 0.9 },
  satellite: { low: "#c9c1b2", high: "#ece8e0", opacity: 0.72 },
};

const SKY: Record<Theme, SkySpecification> = {
  dark: { "sky-color": "#0f0f12", "horizon-color": "#26262b", "fog-color": "#0f0f12", "sky-horizon-blend": 0.6, "horizon-fog-blend": 0.6, "fog-ground-blend": 0.3 },
  light: { "sky-color": "#bfd9f2", "horizon-color": "#f1ede4", "fog-color": "#f8f6f0", "sky-horizon-blend": 0.6, "horizon-fog-blend": 0.6, "fog-ground-blend": 0.3 },
};

// The sun from the south-west, as on the satellite photo: walls differ in brightness, so buildings read as volumes.
const SUN: LightSpecification = { anchor: "map", position: [1.4, 215, 40], color: "#fff8ec", intensity: 0.45 };
const DEFAULT_LIGHT: LightSpecification = { anchor: "viewport", position: [1.15, 210, 30], color: "#ffffff", intensity: 0.5 };

/** Shadows and buildings go under the labels. */
function firstLabelLayer(map: MapLibreMap) {
  const layers = map.getStyle().layers ?? [];
  return (layers.find((layer) => layer.type === "symbol") ?? layers.find((layer) => layer.id === "places"))?.id;
}

/** One language on the labels instead of "Dushanbe / Душанбе"; road numbers stay as they are. */
function localizeLabels(map: MapLibreMap, locale: string) {
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.type !== "symbol") continue;
    const field = map.getLayoutProperty(layer.id, "text-field");
    if (field && JSON.stringify(field).includes("name")) {
      map.setLayoutProperty(layer.id, "text-field", ["coalesce", ["get", `name:${locale}`], ["get", "name"], ["get", "name_en"]]);
    }
  }
}

/** A new style drops the added layers, so this runs after every style load and every 3D switch. */
export function applyRelief(map: MapLibreMap, { base, theme, is3d, locale }: { base: Base; theme: Theme; is3d: boolean; locale: string }) {
  const beforeLabels = firstLabelLayer(map);
  localizeLabels(map, locale);

  // The photo has its own shadows.
  if (base === "scheme") {
    if (!map.getSource(HILLSHADE_SOURCE)) map.addSource(HILLSHADE_SOURCE, DEM);
    if (!map.getLayer(HILLSHADE_LAYER)) {
      const shade = SHADE[theme];
      map.addLayer(
        {
          id: HILLSHADE_LAYER,
          type: "hillshade",
          source: HILLSHADE_SOURCE,
          paint: { "hillshade-shadow-color": shade.shadow, "hillshade-highlight-color": shade.highlight, "hillshade-accent-color": shade.shadow, "hillshade-exaggeration": shade.exaggeration },
        },
        beforeLabels,
      );
    }
  }

  if (!is3d) {
    if (map.getLayer(BUILDINGS_LAYER)) map.removeLayer(BUILDINGS_LAYER);
    map.setTerrain(null);
    map.setLight(DEFAULT_LIGHT);
    return;
  }

  if (!map.getSource(TERRAIN_SOURCE)) map.addSource(TERRAIN_SOURCE, DEM);
  map.setTerrain({ source: TERRAIN_SOURCE, exaggeration: 1.25 });
  map.setSky(SKY[base === "satellite" ? "dark" : theme]);
  map.setLight(SUN);

  if (map.getSource("openmaptiles") && !map.getLayer(BUILDINGS_LAYER)) {
    const colors = BUILDINGS[base === "satellite" ? "satellite" : theme];
    map.addLayer(
      {
        id: BUILDINGS_LAYER,
        type: "fill-extrusion",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 13,
        paint: {
          "fill-extrusion-color": ["interpolate", ["linear"], ["to-number", ["coalesce", ["get", "render_height"], 0]], 0, colors.low, 60, colors.high],
          // Buildings rise smoothly between zoom 13 and 14.5.
          "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 13, 0, 14.5, ["to-number", ["coalesce", ["get", "render_height"], 0]]],
          "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 13, 0, 14.5, ["to-number", ["coalesce", ["get", "render_min_height"], 0]]],
          "fill-extrusion-opacity": colors.opacity,
          "fill-extrusion-vertical-gradient": true,
        },
      },
      beforeLabels,
    );
  }
}

/** Camera moves are instant for people who asked for less motion. */
export function cameraDuration(ms: number) {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms;
}
