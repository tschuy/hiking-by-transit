import '../../styles/openlayers.css';
import '../../styles/default.css';
import { fetchConfig } from '../config/legacyLoader';
import { createTrailheadMap, lonLatView } from '../core/createTrailheadMap';
import type {
  MapDataSource,
  MapFeatureDetails,
  MapHike,
  TrailheadMapController,
  TrailheadMapEvent,
} from '../core/types';
import { OLMAP_DATA_SCHEMA_VERSION, OLMAP_VERSION } from '../version';
import { renderLegacyPopupContent } from '../presentation/legacyPopup';

export { OLMAP_DATA_SCHEMA_VERSION, OLMAP_VERSION };

interface LegacyHike {
  title: string;
  url: string;
  gpx: string;
  blurb: string;
  length: string;
  difficultyhuman: string;
  difficulty: string;
}

declare const hikes_with_gpx: LegacyHike[];

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLElement)) throw new Error(`Legacy olmap requires #${id}`);
  return element as T;
}

function legacyHike(hike: LegacyHike, index: number): MapHike {
  const slug = hike.url.split('/').filter(Boolean).at(-1) ?? `legacy-hike-${index}`;
  return {
    id: slug,
    slug,
    title: hike.title,
    url: hike.url,
    gpx: hike.gpx,
    blurb: hike.blurb,
    length: hike.length,
    difficulty: hike.difficulty,
    difficultyLabel: hike.difficultyhuman,
  };
}

function configuredSources(config: Awaited<ReturnType<typeof fetchConfig>>, hikes: MapHike[]): MapDataSource[] {
  const memberships = new Map<string, string[]>();
  for (const [groupId, group] of Object.entries(config.feedGroups)) {
    group.members.forEach((feedId) => memberships.set(feedId, [...(memberships.get(feedId) ?? []), groupId]));
  }
  const transit: MapDataSource[] = Object.keys(config.feeds).map((feedId) => ({
    id: feedId,
    kind: 'geojson',
    role: 'transit',
    url: `/assets/geojson/${feedId}.geojson`,
    sourceUrl: config.feeds[feedId].gtfs.url,
    version: config.dataVersion,
    cachePolicy: 'memory',
    groupIds: memberships.get(feedId) ?? ['other'],
    visible: false,
  }));
  const trailheads: MapDataSource[] = (['hardcoded', 'generated'] as const).flatMap((kind) =>
    Object.keys(config.kmlGroups[kind]).map((layerId) => ({
      id: layerId,
      kind: 'kml' as const,
      role: 'trailhead' as const,
      url: `/assets/kml/${layerId}.kml`,
      version: config.dataVersion,
      cachePolicy: 'memory' as const,
      visible: true,
    })),
  );
  const hikeSources: MapDataSource[] = hikes.map((hike) => ({
    id: `hike:${hike.id}`,
    kind: 'gpx',
    role: 'hike',
    url: `/assets/gpx/${hike.gpx}`,
    hikeId: hike.id,
    version: config.dataVersion,
    cachePolicy: 'memory',
    visible: true,
  }));

  return [
    ...transit,
    {
      id: 'southern-california',
      kind: 'geojson',
      role: 'protected-area',
      url: '/assets/geojson/southern_california.geojson',
      version: config.dataVersion,
      cachePolicy: 'memory',
      visible: true,
    },
    ...hikeSources,
    ...trailheads,
  ];
}

function renderPopup(
  feature: MapFeatureDetails,
  content: HTMLElement,
  directionsLink: HTMLAnchorElement,
  alltrailsLink: HTMLAnchorElement,
  hikeLink: HTMLAnchorElement,
): void {
  directionsLink.style.display = 'none';
  alltrailsLink.style.display = 'none';
  hikeLink.style.display = 'none';
  renderLegacyPopupContent(feature, content);

  const directionsAction = feature.actions.find((action) => action.kind === 'directions');
  if (directionsAction) {
    directionsLink.href = directionsAction.url;
    directionsLink.style.display = '';
  }
  const nearbyTrailsAction = feature.actions.find((action) => action.kind === 'nearby-trails');
  if (nearbyTrailsAction) {
    alltrailsLink.href = nearbyTrailsAction.url;
    alltrailsLink.style.display = '';
  }
  const hikeAction = feature.actions.find((action) => action.kind === 'hike-guide');
  if (hikeAction) {
    hikeLink.href = hikeAction.url;
    hikeLink.style.display = '';
  }
}

export async function bootstrapLegacyTrailheadMap(): Promise<TrailheadMapController> {
  const config = await fetchConfig('/assets/data/config.json');
  const target = requiredElement<HTMLDivElement>('ol-map');
  const info = requiredElement<HTMLDivElement>('info');
  const popup = requiredElement<HTMLDivElement>('popup');
  const content = requiredElement<HTMLDivElement>('popup-content');
  const directionsLink = requiredElement<HTMLAnchorElement>('popup-directions-link');
  const alltrailsLink = requiredElement<HTMLAnchorElement>('popup-alltrails-link');
  const hikeLink = requiredElement<HTMLAnchorElement>('popup-hike-link');
  const closer = requiredElement<HTMLAnchorElement>('popup-closer');
  const filterTrailheads = requiredElement<HTMLFormElement>('filter-form');
  const filterLayers = requiredElement<HTMLFormElement>('filter-layers-form');
  const root = target.closest<HTMLElement>('.map-layout') ?? target.parentElement ?? target;
  const hikes = hikes_with_gpx.map(legacyHike);
  const customUrl = localStorage.getItem('osmmapurl');
  const osmAttribution = 'Map data ©<a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';

  const addedClasses: Array<[Element, string]> = [];
  const originalAttributes = new Map<Element, Map<string, string | null>>();
  const addAdapterClass = (element: Element, className: string) => {
    if (!element.classList.contains(className)) {
      element.classList.add(className);
      addedClasses.push([element, className]);
    }
  };
  const setAdapterAttribute = (element: Element, name: string, value: string) => {
    const attributes = originalAttributes.get(element) ?? new Map<string, string | null>();
    if (!attributes.has(name)) attributes.set(name, element.getAttribute(name));
    originalAttributes.set(element, attributes);
    element.setAttribute(name, value);
  };
  const removeAdapterAttribute = (element: Element, name: string) => {
    const attributes = originalAttributes.get(element) ?? new Map<string, string | null>();
    if (!attributes.has(name)) attributes.set(name, element.getAttribute(name));
    originalAttributes.set(element, attributes);
    element.removeAttribute(name);
  };

  setAdapterAttribute(target, 'data-olmap-version', OLMAP_VERSION);
  setAdapterAttribute(target, 'data-olmap-schema-version', config.schemaVersion ?? OLMAP_DATA_SCHEMA_VERSION);
  setAdapterAttribute(target, 'data-olmap-data-version', config.dataVersion);
  addAdapterClass(root, 'olmap-root');
  addAdapterClass(target, 'olmap-map');
  addAdapterClass(info, 'olmap-info');
  addAdapterClass(popup, 'olmap-popup');
  addAdapterClass(content, 'olmap-popup-content');
  addAdapterClass(closer, 'olmap-popup-closer');
  addAdapterClass(filterTrailheads, 'olmap-filter-form');
  addAdapterClass(filterLayers, 'olmap-filter-form');
  if (!target.hasAttribute('aria-label')) setAdapterAttribute(target, 'aria-label', 'Interactive map of transit-accessible trailheads');
  setAdapterAttribute(target, 'role', 'region');
  setAdapterAttribute(info, 'role', 'status');
  setAdapterAttribute(info, 'aria-live', 'polite');
  setAdapterAttribute(popup, 'role', 'dialog');
  setAdapterAttribute(popup, 'aria-modal', 'false');
  setAdapterAttribute(closer, 'aria-label', 'Close map details');
  directionsLink.rel = 'noreferrer';
  alltrailsLink.rel = 'noreferrer';

  let returnFocus: HTMLElement | null = null;

  const handleEvent = (event: TrailheadMapEvent) => {
    if (event.type === 'feature-hover') {
      if (!event.feature || !event.pixel) {
        info.style.visibility = 'hidden';
        return;
      }
      info.textContent = event.feature.name;
      info.style.left = `${event.pixel[0]}px`;
      info.style.top = `${event.pixel[1]}px`;
      info.style.visibility = 'visible';
    }
    if (event.type === 'feature-select') {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement && !popup.contains(activeElement)) returnFocus = activeElement;
      renderPopup(event.feature, content, directionsLink, alltrailsLink, hikeLink);
      setAdapterAttribute(popup, 'aria-label', `Details for ${event.feature.name}`);
      closer.focus({ preventScroll: true });
    }
    if (event.type === 'selection-clear') {
      info.style.visibility = 'hidden';
      removeAdapterAttribute(popup, 'aria-label');
      returnFocus?.focus({ preventScroll: true });
      returnFocus = null;
    }
    if (event.type === 'loading-change') setAdapterAttribute(target, 'aria-busy', String(event.loading));
    if (event.type === 'error') {
      info.textContent = event.error.message;
      info.style.visibility = 'visible';
    }
  };

  const initialView = target.dataset.lon && target.dataset.lat
    ? lonLatView(Number(target.dataset.lon), Number(target.dataset.lat), Number(target.dataset.zoom ?? 9))
    : { center: [-13611974.488458559, 4558011.3361273315] as [number, number], zoom: Number(target.dataset.zoom ?? 9) };
  const controller: TrailheadMapController = createTrailheadMap({
    target,
    config,
    dataSources: configuredSources(config, hikes),
    hikes,
    initialView,
    tileSource: {
      url: customUrl
        ? decodeURIComponent(customUrl)
        : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: osmAttribution,
    },
    protectedAreaTileSource: {
      url: 'https://gis.cnra.ca.gov/arcgis/rest/services/Boundaries/CPAD_AccessType/MapServer',
      attribution: 'CPAD data ©<a href="https://calands.org/cpad/">GreenInfo Network</a>',
      params: { LAYERS: 'show:1' },
      opacity: 0.4,
    },
    popupElement: popup,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    onEvent: handleEvent,
  });

  const closePopup = (event: Event) => {
    event.preventDefault();
    controller.clearSelection();
    closer.blur();
  };
  const leaveMap = () => { info.style.visibility = 'hidden'; };
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') controller.clearSelection();
  };
  const changeTrailheads = (event: Event) => {
    const input = event.target;
    if (input instanceof HTMLInputElement) controller.setLayerVisibility(input.name, input.checked);
  };
  const changeLayers = (event: Event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    controller.setLayerVisibility(input.name === 'cpad' ? 'protected-areas' : input.name, input.checked);
  };

  closer.addEventListener('click', closePopup);
  target.addEventListener('pointerleave', leaveMap);
  popup.addEventListener('keydown', closeOnEscape);
  filterTrailheads.addEventListener('change', changeTrailheads);
  filterLayers.addEventListener('change', changeLayers);

  const destroyController = controller.destroy.bind(controller);
  controller.destroy = () => {
    closer.removeEventListener('click', closePopup);
    target.removeEventListener('pointerleave', leaveMap);
    popup.removeEventListener('keydown', closeOnEscape);
    filterTrailheads.removeEventListener('change', changeTrailheads);
    filterLayers.removeEventListener('change', changeLayers);
    addedClasses.forEach(([element, className]) => element.classList.remove(className));
    originalAttributes.forEach((attributes, element) => {
      attributes.forEach((value, name) => {
        if (value === null) element.removeAttribute(name);
        else element.setAttribute(name, value);
      });
    });
    destroyController();
  };
  return controller;
}

export const legacyController = bootstrapLegacyTrailheadMap();
