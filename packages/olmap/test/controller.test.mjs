import assert from 'node:assert/strict';
import test from 'node:test';
import { createTrailheadMap } from '../dist/index.js';

class FakeClassList {
  add() {}
  remove() {}
  contains() { return false; }
}

class FakeElement extends EventTarget {
  constructor(ownerDocument) {
    super();
    this.ownerDocument = ownerDocument;
    this.style = {};
    this.dataset = {};
    this.classList = new FakeClassList();
    this.children = [];
    this.childNodes = this.children;
    this.parentNode = null;
    this.clientWidth = 800;
    this.clientHeight = 600;
    this.offsetWidth = 800;
    this.offsetHeight = 600;
    this.isConnected = true;
  }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
  insertBefore(child) { return this.appendChild(child); }
  removeChild(child) { this.children = this.children.filter((candidate) => candidate !== child); this.childNodes = this.children; child.parentNode = null; return child; }
  remove() { this.parentNode?.removeChild(this); }
  replaceChildren(...children) { this.children = children; this.childNodes = this.children; }
  contains(child) { return child === this || this.children.includes(child); }
  getRootNode() { return this.ownerDocument; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600 }; }
  getClientRects() { return [this.getBoundingClientRect()]; }
  setAttribute() {}
  removeAttribute() {}
  hasAttribute() { return false; }
  querySelectorAll() { return []; }
  get firstChild() { return this.children[0] ?? null; }
  get lastChild() { return this.children.at(-1) ?? null; }
}

function installDomHarness() {
  const fakeDocument = {
    createElement: () => new FakeElement(fakeDocument),
    createTextNode: () => new FakeElement(fakeDocument),
    getElementById: () => null,
    documentElement: null,
  };
  fakeDocument.documentElement = new FakeElement(fakeDocument);
  globalThis.document = fakeDocument;
  globalThis.window = globalThis;
  globalThis.HTMLElement = FakeElement;
  globalThis.ShadowRoot = class {};
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  globalThis.getComputedStyle = () => ({
    width: '800px', height: '600px',
    borderLeftWidth: '0px', borderRightWidth: '0px', borderTopWidth: '0px', borderBottomWidth: '0px',
    paddingLeft: '0px', paddingRight: '0px', paddingTop: '0px', paddingBottom: '0px',
  });
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => undefined;
  return fakeDocument;
}

const config = {
  schemaVersion: 'legacy-1',
  dataVersion: 'test',
  feeds: {},
  feedGroups: {},
  kmlGroups: { hardcoded: {}, generated: {} },
};

function options(target, events) {
  return {
    target,
    config,
    dataSources: [],
    tileSource: {
      url: 'https://example.test/{z}/{x}/{y}.png',
      attribution: 'Fixture tiles',
    },
    initialView: { center: [0, 0], zoom: 4 },
    onEvent: (event) => events.push(event),
  };
}

async function waitFor(predicate, message = 'condition') {
  const timeoutAt = Date.now() + 1000;
  while (!predicate()) {
    if (Date.now() >= timeoutAt) throw new Error(`Timed out waiting for ${message}`);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

const emptyGeoJson = { type: 'FeatureCollection', features: [] };

test('supports independent instances, commands, and idempotent destruction', async () => {
  const fakeDocument = installDomHarness();
  const firstTarget = new FakeElement(fakeDocument);
  const secondTarget = new FakeElement(fakeDocument);
  const firstEvents = [];
  const secondEvents = [];
  const first = createTrailheadMap(options(firstTarget, firstEvents));
  const second = createTrailheadMap(options(secondTarget, secondEvents));

  await Promise.all([first.ready, second.ready]);
  first.setView({ center: [100, 200], zoom: 7 });
  first.setFilters({ accessModes: ['bus'], showProtectedAreas: true });
  first.setLayerVisibility('fixture-layer', true);
  first.setDataSources([]);
  first.refresh();
  first.updateSize();

  assert.deepEqual(first.getState().view.center, [100, 200]);
  assert.equal(first.getState().view.zoom, 7);
  assert.deepEqual(first.getState().filters.accessModes, ['bus']);
  assert.deepEqual(second.getState().view.center, [0, 0]);
  assert.equal(second.getState().view.zoom, 4);
  assert(firstEvents.some((event) => event.type === 'ready'));
  const filterEventIndex = firstEvents.findIndex((event) => event.type === 'filters-change');
  assert.equal(firstEvents[filterEventIndex + 1]?.type, 'visible-features-change');
  assert(firstEvents.some((event) => event.type === 'layer-visibility-change' && event.layerId === 'fixture-layer'));
  assert(!secondEvents.some((event) => event.type === 'filters-change'));

  first.destroy();
  first.destroy();
  second.destroy();
  assert.equal(first.getState().status, 'idle');
  assert.equal(second.getState().status, 'idle');
});

test('isolates source failures and lazily loads hidden transit', async () => {
  const fakeDocument = installDomHarness();
  const events = [];
  let transitLoads = 0;
  const controller = createTrailheadMap({
    ...options(new FakeElement(fakeDocument), events),
    dataSources: [
      { id: 'healthy', kind: 'geojson', role: 'trailhead', load: async () => emptyGeoJson },
      { id: 'failed', kind: 'geojson', role: 'trailhead', load: async () => { throw new Error('fixture failure'); } },
      {
        id: 'optional-transit',
        kind: 'geojson',
        role: 'transit',
        visible: false,
        load: async () => { transitLoads += 1; return emptyGeoJson; },
      },
      {
        id: 'unavailable-transit',
        kind: 'geojson',
        role: 'transit',
        unavailableReason: 'feed not published',
      },
    ],
  });

  await controller.ready;
  await waitFor(() => controller.getState().layers.healthy?.status === 'ready', 'healthy source');
  await waitFor(() => controller.getState().layers.failed?.status === 'error', 'failed source');
  assert.equal(controller.getState().layers['optional-transit'].status, 'idle');
  assert.equal(controller.getState().layers['unavailable-transit'].status, 'unavailable');
  assert.equal(transitLoads, 0);
  assert(events.some((event) => event.type === 'error' && event.error.sourceId === 'failed'));

  controller.setLayerVisibility('optional-transit', true);
  await waitFor(() => controller.getState().layers['optional-transit']?.status === 'ready', 'transit source');
  assert.equal(transitLoads, 1);
  controller.destroy();
});

test('aborts pending source work on destroy and supports targeted cache-bypassing refresh', async () => {
  const fakeDocument = installDomHarness();
  let aborted = false;
  const pending = createTrailheadMap({
    ...options(new FakeElement(fakeDocument), []),
    dataSources: [{
      id: 'pending',
      kind: 'geojson',
      role: 'trailhead',
      load: (signal) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => {
        aborted = true;
        reject(signal.reason);
      }, { once: true })),
    }],
  });
  await pending.ready;
  pending.destroy();
  assert.equal(aborted, true);

  let loads = 0;
  const cached = createTrailheadMap({
    ...options(new FakeElement(fakeDocument), []),
    dataSources: [{
      id: 'cached',
      kind: 'geojson',
      role: 'trailhead',
      version: 'v1',
      cachePolicy: 'memory',
      load: async () => { loads += 1; return emptyGeoJson; },
    }],
  });
  await waitFor(() => cached.getState().layers.cached?.status === 'ready', 'initial cached source');
  assert.equal(loads, 1);
  cached.refresh({ sourceIds: ['cached'], bypassCache: true });
  await waitFor(() => loads === 2 && cached.getState().layers.cached?.status === 'ready', 'refreshed source');
  cached.destroy();
});
