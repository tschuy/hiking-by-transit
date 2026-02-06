import './style.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import TileArcGISRest from 'ol/source/TileArcGISRest.js';
import OSM from 'ol/source/OSM';
import KML from 'ol/format/KML.js';
import Overlay from 'ol/Overlay.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import GPX from 'ol/format/GPX.js';
import * as olProj from 'ol/proj';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js';

import { MapBrowserEvent } from 'ol';

import { platformModifierKeyOnly } from 'ol/events/condition.js';
import DragPan from 'ol/interaction/DragPan.js';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom.js';
import { defaults } from 'ol/interaction/defaults.js';

import VectorSource from 'ol/source/Vector.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import { intersects } from 'ol/extent';
import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';

import { fetchConfig, ConfigFile, RouteConfig, AgencyConfig } from './configLoader';
const config: ConfigFile = await fetchConfig('/assets/data/config.json');

// --------------------
// Styles for GPX features
// --------------------
const style: Record<string, Style> = {
  'Point': new Style({
    image: new CircleStyle({
      fill: new Fill({ color: 'rgba(255,255,0,0.4)' }),
      radius: 5,
      stroke: new Stroke({ color: '#ff0', width: 1 }),
    }),
  }),
  'LineString': new Style({
    stroke: new Stroke({ color: '#f00', width: 3 }),
  }),
  'MultiLineString': new Style({
    stroke: new Stroke({ color: '#38240b', width: 2.5 }),
  }),
};

// --------------------
// DOM Elements
// --------------------
const container = document.getElementById('popup')!;
const content = document.getElementById('popup-content')!;
const directionsLink = document.getElementById('popup-directions-link')! as HTMLAnchorElement;
const hikeLink = document.getElementById('popup-hike-link')! as HTMLAnchorElement;
const closer = document.getElementById('popup-closer')!;
const info = document.getElementById('info')!;

closer.onclick = () => {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};

// --------------------
// Overlay for popups
// --------------------
const overlay = new Overlay({
  element: container,
  offset: [0, -15],
  autoPan: { animation: { duration: 250 } },
});

// --------------------
// Helpers
// --------------------
function linkifyDescription(text: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/;
  return text.replace(urlRegex, '<a href="$1" target="_blank">Learn more &raquo;</a>');
}

function separateName(name: string): { parkname: string; trailhead?: string } {
  const segments = name.split(':');
  return segments.length > 1 ? { parkname: segments[0], trailhead: segments[1] } : { parkname: segments[0] };
}

function formatParkInfo(parkInfo: { parkname: string; trailhead?: string; description?: string }): string {
  const desc = parkInfo.description ?? '';
  return parkInfo.trailhead ? `<h3>${parkInfo.parkname}</h3><h4>${parkInfo.trailhead}</h4>${desc}` : `<h3>${parkInfo.parkname}</h3>${desc}`;
}

function formatHikeInfo(properties: any): string {
  return `<h3>${properties.title}</h3><ul><li>Length: ${properties.length}</li><li>Difficulty: ${properties.difficultyhuman}</li></ul>${properties.blurb}`;
}

function formatPolygonInfo(feature: any): string {
  console.log(feature);
  return feature.get('description') ?? '';
}

// --------------------
// Agencies / layers
// --------------------
const geojson_layers: Record<string, VectorLayer<VectorSource<Geometry>>> = {};
const featureCache: Record<string, any[]> = {};

function flattenAgencies(config: ConfigFile): Record<string, AgencyConfig> {
  const flat: Record<string, AgencyConfig> = {};
  for (const feed of Object.values(config.feeds)) {
    Object.assign(flat, feed.agencies);
  }
  return flat;
}

// Assuming you already have `config` loaded via top-level await:
const allAgencies = flattenAgencies(config);

export function combineRoutes(agencies: AgencyConfig[]): Record<string, RouteConfig> {
  const combined: Record<string, RouteConfig> = {};

  for (const agency of agencies) {
    if (agency.routes) {
      Object.assign(combined, agency.routes);
    }
  }

  return combined;
}

for (const feed of Object.keys(config.feeds)) {
  const agencies = Object.values(config.feeds[feed].agencies);
  const source = new VectorSource({
    loader: async (extent, resolution, projection) => {
      try {
        // Fetch and cache features if not already
        if (!featureCache[feed]) {
          const res = await fetch(`/assets/geojson/${feed}.geojson`);
          const geojson = await res.json();

          // Combine all routes from the agencies for this feed
          const routes = combineRoutes(agencies); // routes: Record<string, RouteConfig>

          // Filter features: only include routes that exist and are not hidden
          const filtered = geojson.features.filter(
            (f: any) => {
              const routeId = f.properties?.route_id;
              return !routeId || !routes[routeId] || !routes[routeId].hidden;
            }
          );

          featureCache[feed] = new GeoJSON().readFeatures(
            { type: 'FeatureCollection', features: filtered },
            { featureProjection: projection }
          );
        }

        // Clear previous features
        source.clear(true);

        // Only add features intersecting the current viewport
        const visible = featureCache[feed].filter(f => {
          const geom = f.getGeometry();
          return geom && intersects(extent, geom.getExtent());
        });

        source.addFeatures(visible);
      } catch (err) {
        console.error(`Failed loading ${feed}`, err);
      }
    },
  });

  geojson_layers[feed] = new VectorLayer({
    name: feed,
    source,
    renderMode: 'image',
  });
}

const southernCalifornia = new VectorLayer({
  name: 'southernCalifornia',
  source: new VectorSource({
    url: '/assets/geojson/southern_california.geojson',
    format: new GeoJSON(),
  }),
});

const groupedFeeds = new Set<string>(
  Object.values(config.feedGroups).flatMap(g => g.members)
);

const otherFeeds = Object.keys(config.feeds).filter(feed => !groupedFeeds.has(feed));

if (otherFeeds.length > 0) {
  config.feedGroups['other'] = {
    members: otherFeeds,
    hidden: true,
  };
}

for (const [groupName, group] of Object.entries(config.feedGroups)) {
  if (group.hidden) {
    for (const feed of group.members) {
      const layer = geojson_layers[feed];
      if (layer) {
        layer.setVisible(false);
      }
    }
  }
}

// --------------------
// KML layers
// --------------------
const kmlFormat = new KML({ showPointNames: false });
const trailhead_kml_layers: Record<string, VectorLayer<VectorSource<Geometry>>> = {};
for (const groupType of ['hardcoded', 'generated'] as const) {
  const groups = config.kmlGroups[groupType];

  for (const name of Object.keys(groups)) {
    trailhead_kml_layers[name] = new VectorLayer({
      name,
      source: new VectorSource({
        url: `/assets/kml/${name}.kml`,
        format: kmlFormat,
      }),
    });
  }
}
// --------------------
// GPX trails (global variable from template)
// --------------------
const trails: VectorLayer<VectorSource<Geometry>>[] = (hikes_with_gpx as any[]).map(e => new VectorLayer({
  source: new VectorSource({
    url: `/assets/gpx/${e.gpx}`,
    format: new GPX(),
    extractStyles: false,
  }),
  style: feature => style[feature.getGeometry().getType()] ?? undefined,
  properties: { ...e, type: 'gpx' }
}));

// --------------------
// Base map / layers
// --------------------
const cpadAttribution = 'CPAD data ©<a href="https://calands.org/cpad/">GreenInfo Network</a>';
const prodAttributions = [
  'Tiles ©<a href="https://www.thunderforest.com">Thunderforest</a>',
  'Map data ©<a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
];

const customUrl = localStorage.getItem('osmmapurl');
const prodOSM = new OSM({
  attributions: prodAttributions,
  url: customUrl ? decodeURIComponent(customUrl) : 'https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=d2ba8afb4a84444f878b429697465850'
});

const devOSM = new OSM({
  attributions: ['Map data ©<a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'],
  url: customUrl ? decodeURIComponent(customUrl) : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
});

const osm = location.hostname === 'localhost' ? devOSM : prodOSM;

const base = new TileLayer({ source: osm });
const cpadAccessLayer = new TileLayer({
  source: new TileArcGISRest({
    url: 'https://gis.cnra.ca.gov/arcgis/rest/services/Boundaries/CPAD_AccessType/MapServer',
    params: { LAYERS: 'show:1' }
  }),
  opacity: 0.4
});
cpadAccessLayer.setVisible(false);

// --------------------
// Map initialization
// --------------------
const targetDiv = document.getElementById('ol-map')!;
let viewOpts: any = {
  center: [-13611974.488458559, 4558011.3361273315],
  projection: 'EPSG:3857',
  zoom: targetDiv.dataset.zoom ? parseInt(targetDiv.dataset.zoom) : 9,
};

if (targetDiv.dataset.lon && targetDiv.dataset.lat) {
  viewOpts.center = olProj.fromLonLat([parseFloat(targetDiv.dataset.lon), parseFloat(targetDiv.dataset.lat)]);
}

const map = new Map({
  layers: [base, cpadAccessLayer, southernCalifornia, ...Object.values(geojson_layers), ...trails, ...Object.values(trailhead_kml_layers)],
  target: targetDiv,
  view: new View(viewOpts),
  interactions: defaults({ dragPan: false, mouseWheelZoom: false, altShiftDragRotate:false, pinchRotate:false }).extend([
    new DragPan({
      condition: function(evt) {
        if (!window.navigator.userAgent.toLowerCase().includes("mobi")) return true;
        return this.getPointerCount() === 2 || platformModifierKeyOnly(evt);
      }
    }),
    new MouseWheelZoom({ condition: platformModifierKeyOnly }),
  ]),
});

map.addOverlay(overlay);

// --------------------
// Feature hover / info
// --------------------
let currentFeature: Feature<Geometry> | undefined;

const displayFeatureInfo = (pixel: [number, number], target: EventTarget | null) => {
  // Ignore map controls
  if (!(target instanceof Element) || target.closest('.ol-control')) {
    info.style.visibility = 'hidden';
    currentFeature = undefined;
    return;
  }

  // Get all features under this pixel
  const features: Feature<Geometry>[] = map.getFeaturesAtPixel(pixel, { hitTolerance: 5 }) || [];

  if (features.length > 0) {
    info.style.left = `${pixel[0]}px`;
    info.style.top = `${pixel[1]}px`;
    info.style.visibility = 'visible';

    // any named trailhead
    const featureWithName = features.find(f => f.get('name'));
    if (featureWithName) {
      info.innerText = featureWithName.get('name');
      currentFeature = featureWithName;
      return;
    }

    // ...or stops
    const stopFeature = features.find(f => f.get('stop_id'));
    if (stopFeature) {
      info.innerText = stopFeature.get('stop_name') || '';
      currentFeature = stopFeature;
      return;
    }

    // ...or transit routes
    const agencyFeatures = features.filter(f => f.get('agency_id'));
    if (agencyFeatures.length > 0) {
      const lines = agencyFeatures.map(f => {
        const agencyId = f.get('agency_id') ?? '';
        const agencyConfig = allAgencies[agencyId];

        // Prefer short_name, then long_name, then fallback to agencyId
        console.log(agencyConfig);
        console.log(agencyId);
        const agency =
          agencyConfig?.shortName ??
          agencyConfig?.longName ??
          agencyId;

        // Use route_short_name, fallback to route_long_name, or empty string
        const route = f.get('route_short_name') ?? f.get('route_long_name') ?? '';

        // avoid double named routes, ex: "Gold Runner Gold Runner"
        if (agency === route) {
          return route;
        } else {
          return `${agency} ${route}`;
        }
      });

      info.innerText = lines.join('\n');
      currentFeature = agencyFeatures[0];
      return;
    }

    // if we get here, we didn't find any features we want to display
  }

  info.style.visibility = 'hidden';
  info.innerText = '';
  currentFeature = undefined;
};

// --------------------
// Pointer move
// --------------------
map.on('pointermove', (evt: MapBrowserEvent<UIEvent>) => {
  if (evt.dragging) {
    info.style.visibility = 'hidden';
    currentFeature = undefined;
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel, evt.originalEvent.target);
});

// --------------------
// Pointer leave
// --------------------
map.getTargetElement().addEventListener('pointerleave', () => {
  currentFeature = undefined;
  info.style.visibility = 'hidden';
});

// --------------------
// Click handling
// --------------------
map.on('click', (evt: MapBrowserEvent<UIEvent>) => {
  const result = map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => [feature, layer]) as [Feature<Geometry>, VectorLayer<Geometry>] | undefined;

  if (!result) return;

  const [feature, layer] = result;

  // Trailhead vs transit
  let coordinates = feature.getGeometry().getCoordinates();
  if (feature.getGeometry().getType() !== 'Point') {
    coordinates = evt.coordinate;
  }

  overlay.setPosition(coordinates);
  kmlFormat.showPointNames = true;

  const properties = layer.getProperties();

  if (layer === southernCalifornia) {
    directionsLink.style.visibility = 'hidden';
    hikeLink.style.visibility = 'hidden';
    content.innerHTML = formatPolygonInfo(feature);
  } else if (properties && properties.type === 'gpx') {
    directionsLink.style.visibility = 'hidden';
    hikeLink.href = properties.url ?? '#';
    hikeLink.style.visibility = 'visible';
    content.innerHTML = formatHikeInfo(properties);
    return;
  } else {
    const parkInfo = separateName(feature.get('name') ?? '');
    parkInfo.description = linkifyDescription(feature.get('description') ?? '');
    parkInfo.weather = feature.get('weather') ?? 'TODO: look up weather for this park';
    const lonlat = olProj.transform(coordinates, 'EPSG:3857', 'EPSG:4326');
    directionsLink.href = `https://www.google.com/maps/place/${lonlat[1]},${lonlat[0]}/@${lonlat[1]},${lonlat[0]},15z`;
    directionsLink.style.visibility = 'visible';
    hikeLink.style.visibility = 'hidden';
    content.innerHTML = formatParkInfo(parkInfo);
    return;
  }
});

// --------------------
// Filter forms
// --------------------
const filterTrailheads = document.getElementById('filter-form') as HTMLFormElement;
filterTrailheads.addEventListener('change', (e: Event) => {
  const target = e.target as HTMLInputElement;
  const layer = trailhead_kml_layers[target.name];
  if (!layer) return;
  layer.setVisible(target.checked);
});

const filterLayers = document.getElementById('filter-layers-form') as HTMLFormElement;
filterLayers.addEventListener('change', (e: Event) => {
  const target = e.target as HTMLInputElement;

  // Special: CPAD
  if (target.name === 'cpad') {
    cpadAccessLayer.setVisible(target.checked);
    if (target.checked) {
      prodOSM.setAttributions([...prodAttributions, cpadAttribution]);
    } else {
      prodOSM.setAttributions(prodAttributions);
    }
    return;
  }

  // Transit groups
  const groupConfig = config.feedGroups[target.name];
  if (groupConfig) {
    for (const feed of groupConfig.members) {
      const layer = geojson_layers[feed];
      if (layer) {
        layer.setVisible(target.checked);
      }
    }
    return;
  }

  // Regular layer toggle
  const layer = trailhead_kml_layers[target.name];
  layer?.setVisible(target.checked);
});
