import './style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import TileArcGISRest from 'ol/source/TileArcGISRest.js';
import OSM from 'ol/source/OSM';
import KML from 'ol/format/KML.js';
import Overlay from 'ol/Overlay.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import GPX from 'ol/format/GPX.js';
import * as olProj from 'ol/proj';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style.js';

import {platformModifierKeyOnly} from 'ol/events/condition.js';
import DragPan from 'ol/interaction/DragPan.js';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom.js';
import {defaults} from 'ol/interaction/defaults.js';

import VectorSource from 'ol/source/Vector.js';
import {Vector as VectorLayer} from 'ol/layer.js';
import { intersects } from 'ol/extent';

// styles for imported GPX traces
const style = {
  'Point': new Style({
    image: new CircleStyle({
      fill: new Fill({
        color: 'rgba(255,255,0,0.4)',
      }),
      radius: 5,
      stroke: new Stroke({
        color: '#ff0',
        width: 1,
      }),
    }),
  }),
  'LineString': new Style({
    stroke: new Stroke({
      color: '#f00',
      width: 3,
    }),
  }),
  'MultiLineString': new Style({
    stroke: new Stroke({
      color: '#38240b',
      width: 2.5,
    }),
  }),
};

const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const directionsLink = document.getElementById('popup-directions-link');
const hikeLink = document.getElementById('popup-hike-link');
const closer = document.getElementById('popup-closer');

closer.onclick = function() {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};

function linkifyDescription(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/;
  return text.replace(urlRegex, '<a href="$1" target="_blank">Learn more &raquo;</a>');
}

const overlay = new Overlay({
  element: container,
  offset: [0, -15],
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});

const LARGE_AGENCIES = ["bayarea", "sacrt"];
const geojson_layers = {};

const agencyShortNames = {
  'Tahoe Transportation District': 'TTD',
  'Tahoe Truckee Area Regional Transit': 'TART',
  'Sacramento Regional Transit': 'SacRT'
}

const agencies = [
  'amtrak',
  'goldrunner',
  'bear',
  'lake',
  'hta',
  'redwood',
  'mendo',
  'ttd',
  'tart',
  'yolo',
  'sanbenito',
  'eldorado',
  'bayarea',
  'trinity',
  'siskiyou',
  'sage',
  'nevada',
  'placer',
  'tehama',
  'calaveras',
  'tuolumne',
  'amador',
  'plumas',
  'yarts',
  'lassen',
  'raba',
  'madera',
  'sanjoaquin',
  'stanrta',
  'tulare',
  'sacrt',
  'butte',
  'slorta',
  'kern',
  'easternsierra'
]

const agencyHiddenRoutes = {
  'ttd': ['5853']
};

const featureCache = {};

agencies.forEach((agency) => {
  const hiddenRoutes = agencyHiddenRoutes[agency] || [];
  const isLarge = LARGE_AGENCIES.includes(agency);

  const source = new VectorSource({
    loader: async function(extent, resolution, projection) {
      try {
        // load and cache large agency features at once
        if (isLarge && !featureCache[agency]) {
          const res = await fetch(`/assets/geojson/${agency}.geojson`);
          const geojson = await res.json();

          const filtered = geojson.features.filter(
            f => !hiddenRoutes.includes(f.properties.route_id)
          );

          featureCache[agency] = new GeoJSON().readFeatures(
            {
              type: "FeatureCollection",
              features: filtered
            },
            { featureProjection: projection }
          );
        }

        // Clear previously rendered features
        source.clear(true);

        if (isLarge) {
          // extent-based filtering for large agencies
          const visible = featureCache[agency].filter(feature => {
            const geom = feature.getGeometry();
            return geom && intersects(extent, geom.getExtent());
          });

          source.addFeatures(visible);
        } else {
          // simple all-at-once loading for small agencies
          if (source.getFeatures().length === 0) {
            const res = await fetch(`/assets/geojson/${agency}.geojson`);
            const geojson = await res.json();

            const filtered = geojson.features.filter(
              f => !hiddenRoutes.includes(f.properties.route_id)
            );

            const features = new GeoJSON().readFeatures(
              {
                type: "FeatureCollection",
                features: filtered
              },
              { featureProjection: projection }
            );

            source.addFeatures(features);
          }
        }
      } catch (err) {
        console.error(`Failed loading ${agency}`, err);
      }
    }
  });

  geojson_layers[agency] = new VectorLayer({
    name: agency,
    source: source,
    renderMode: isLarge ? "image" : "vector",
  });
});

let transitGroups = {
  'amtrak': ['amtrak', 'goldrunner'],
  'sacrt': ['sacrt'],
  'tahoe': ['tart', 'ttd', 'eldorado', 'placer'],
  'bayarea': ['bayarea', 'bear'],
  'central-valley': ['stanrta', 'sanjoaquin']
};

const groupedAgencies = new Set(
  Object.values(transitGroups).flat()
);

transitGroups['other'] = agencies.filter(a => !groupedAgencies.has(a));

const preHiddenGroups = ['sacrt', 'bayarea', 'central-valley', 'amtrak', 'tahoe', 'other']

for (const g of preHiddenGroups) {
  for (const a of transitGroups[g]) {
    geojson_layers[a].setVisible(false);
  }
}

const kmlFormat = new KML({showPointNames: false});
const trailhead_kml_layers = {};
[
  "bus",
  "bus-far",
  "bus-weekday-only",
  "rail-far",
  "rail",
  "shuttles",
  "microtransit",
  "call-ahead"
].forEach((e) => trailhead_kml_layers[e] = new VectorLayer({
  name: e,
  source: new VectorSource({
    url: `/assets/kml/${e}.kml`,
    format: kmlFormat,
  }),
}));

// hikes_with_gpx must be globally defined in the template of the page containing the map
const trails = hikes_with_gpx.map((e) => new VectorLayer({
  source: new VectorSource({
    url: '/assets/gpx/' + e.gpx,
    format: new GPX(),
    extractStyles: false,
  }),
  style: function (feature) {
    return style[feature.getGeometry().getType()];
  },
  properties: {...e, ...{"type": "gpx"}},
}));

const cpadAttribution = 'CPAD data ©<a href="https://calands.org/cpad/">GreenInfo Network</a>';
const prodAttributions = [
  'Tiles ©<a href="https://www.thunderforest.com">Thunderforest</a>',
  'Map data ©<a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
];

const customUrl = localStorage.getItem("osmmapurl");
const prodOSM = new OSM({
  attributions: prodAttributions,
  url: customUrl ? decodeURIComponent(customUrl) : 'https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=d2ba8afb4a84444f878b429697465850'
});

const devOSM = new OSM({
  attributions: ['Map data ©<a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'],
  url: customUrl ? decodeURIComponent(customUrl) : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
});

const osm = location.hostname === "localhost" ? devOSM : prodOSM;

const base = new TileLayer({
  source: osm,
});

const cpadAccessLayer = new TileLayer({
  source: new TileArcGISRest({
    url: 'https://gis.cnra.ca.gov/arcgis/rest/services/Boundaries/CPAD_AccessType/MapServer',
    params: {
      LAYERS: 'show:1'
    }
  }),
  opacity: 0.4
});

cpadAccessLayer.setVisible(false);

const targetDiv = document.getElementById('ol-map');
let view = {
  center: [-13611974.488458559, 4558011.3361273315],
  projection: 'EPSG:3857',
  zoom: targetDiv.dataset.zoom ? targetDiv.dataset.zoom : 10,
}

if (targetDiv.dataset.lon && targetDiv.dataset.lat) {
  view.center = olProj.fromLonLat([targetDiv.dataset.lon, targetDiv.dataset.lat]);
}

const map = new Map({
  layers: [base, cpadAccessLayer, ...Object.values(geojson_layers), ...trails, ...Object.values(trailhead_kml_layers)],
  target: targetDiv,
  view: new View(view),
  interactions: defaults({dragPan: false, mouseWheelZoom: false, altShiftDragRotate:false, pinchRotate:false}).extend([
    new DragPan({
      condition: function (event) {
        if (!window.navigator.userAgent.toLowerCase().includes("mobi")) {
          return true;
        }
        return this.getPointerCount() === 2 || platformModifierKeyOnly(event);
      },
    }),
    new MouseWheelZoom({
      condition: platformModifierKeyOnly,
    }),
  ]),
});

map.addOverlay(overlay);

let currentFeature;
const displayFeatureInfo = function (pixel, target) {
  // Ignore map controls
  if (target.closest('.ol-control')) {
    info.style.visibility = 'hidden';
    currentFeature = undefined;
    return;
  }

  // Get all features under this pixel
  var features = map.getFeaturesAtPixel(pixel, { hitTolerance: 5 }) || [];

  if (features.length > 0) {
    info.style.left = pixel[0] + 'px';
    info.style.top = pixel[1] + 'px';
    info.style.visibility = 'visible';

    // set hover to any named trailhead
    var featureWithName = features.find(function(f) {
      return f.get('name');
    });
    if (featureWithName) {
      info.innerText = featureWithName.get('name');
      currentFeature = featureWithName;
      return;
    }

    // ...or stops
    var stopFeature = features.find(function(f) {
      return f.get('stop_id');
    });
    if (stopFeature) {
      info.innerText = stopFeature.get('stop_name') || '';
      currentFeature = stopFeature;
      return;
    }

    // ...or to transit routes
    var agencyFeatures = features.filter(function(f) {
      return f.get('agency_id');
    });

    if (agencyFeatures.length > 0) {
      var lines = agencyFeatures.map(function(f) {
        var agencyLongName = f.get('agency_name') || '';
        var agency = agencyShortNames[agencyLongName] || agencyLongName;
        var route = f.get('route_short_name') || f.get('route_long_name') || '';
        return agency + ' ' + route;
      });
      info.innerText = lines.join('\n');
      currentFeature = agencyFeatures[0]; // optional: track first route
      return;
    }
  } else {
    info.style.visibility = 'hidden';
    currentFeature = undefined;
  }
};

map.on('pointermove', function (evt) {
  if (evt.dragging) {
    info.style.visibility = 'hidden';
    currentFeature = undefined;
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel, evt.originalEvent.target);
});


map.getTargetElement().addEventListener('pointerleave', function () {
  currentFeature = undefined;
  info.style.visibility = 'hidden';
});

map.on('click', function (evt) {
  const [feature, layer] = map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
    return [feature, layer];
  });
  // if feature is trailhead, not transit route / stop
  if (feature && feature.get('name')) {
    let coordinates = feature.getGeometry().getCoordinates();
    if (feature.getGeometry().getType() != "Point") {
      coordinates = evt.coordinate;
    }

    let parkInfo = separateName(feature.get('name'));
    const properties = layer.getProperties();
    if (properties && properties.type === "gpx") {
      directionsLink.style.visibility = "hidden";
      hikeLink.href = properties.url;
      hikeLink.style.visibility = "visible";
      content.innerHTML = formatHikeInfo(properties);
    } else {
      parkInfo.description = linkifyDescription(feature.get('description'));
      parkInfo.weather = feature.get('weather');
      if (feature.get('weather') == undefined) {
        parkInfo.weather = "TODO: look up weather for this park" // getWeather(feature);
      }
      const lonlat = olProj.transform(coordinates, 'EPSG:3857', 'EPSG:4326');
      directionsLink.href = `https://www.google.com/maps/place/${lonlat[1]},${lonlat[0]}/@${lonlat[1]},${lonlat[0]},15z`
      directionsLink.style.visibility = "visible";
      hikeLink.style.visibility = "hidden";
      content.innerHTML = formatParkInfo(parkInfo);
    }
    overlay.setPosition(coordinates);
  }
  kmlFormat.showPointNames = true;
});

function separateName(name) {
  // names from the original KML export often have a [place]:[trailhead] format
  const nameSegments = name.split(":");
  if (nameSegments.length > 1) {
    return {'parkname': nameSegments[0], 'trailhead': nameSegments[1]}
  }
  return {'parkname': nameSegments[0]}
}

function formatParkInfo(parkInfo) {
  if (parkInfo.description === undefined) {
    parkInfo.description = "";
  }
  if (parkInfo.trailhead) {
    return `<h3>${parkInfo.parkname}</h3><h4>${parkInfo.trailhead}</h4>${parkInfo.description}`
  }
  return `<h3>${parkInfo.parkname}</h3>${parkInfo.description}`
}

function formatHikeInfo(properties) {
  return `<h3>${properties.title}</h3><ul><li>Length: ${properties.length}</li><li>Difficulty: ${properties.difficultyhuman}</li></ul>${properties.blurb}`
}

const filterTrailheads = document.getElementById('filter-form');
filterTrailheads.addEventListener('change', function(e) {
  const layer_name = e.target.name;
  const layer = trailhead_kml_layers[layer_name];
  if (!layer) return;

  layer.setVisible(e.target.checked);
});

const filterLayers = document.getElementById('filter-layers-form');
filterLayers.addEventListener('change', function(e) {
  // special layers: CPAD
  if (e.target.name === 'cpad') {
    cpadAccessLayer.setVisible(e.target.checked);
    if (e.target.checked) {
      prodOSM.setAttributions([...prodAttributions, cpadAttribution]);
    } else {
      prodOSM.setAttributions(prodAttributions);
    }
    return;
  }

  // group geojson layers
  if (e.target.name in transitGroups) {
    for (const a of transitGroups[e.target.name]) {
      geojson_layers[a].setVisible(e.target.checked);
    }
    console.log(e.target.name);
    return;
  }

  layer.setVisible(e.target.checked);
});
