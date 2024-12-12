import './style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import KML from 'ol/format/KML.js';
import Overlay from 'ol/Overlay.js';
import GPX from 'ol/format/GPX.js';
import * as olProj from 'ol/proj';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style.js';

import VectorSource from 'ol/source/Vector.js';
import {Vector as VectorLayer} from 'ol/layer.js';

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

const overlay = new Overlay({
  element: container,
  offset: [0, -15],
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});

const kmlFormat = new KML({showPointNames: false});
const trailhead_kml_layers = {}; 

[
  "bart-far",
  "bart",
  "bus-light-rail",
  "bus-light-rail-far",
  "bus-weekday-only",
  "rail-ferry-far",
  "rail-ferry",
  "shuttles"
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

const prodOSM = new OSM({
  attributions: [
    'Maps ©<a href="https://www.thunderforest.com">Thunderforest</a>',
    'Map data ©<a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  ],
  url:'https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=d2ba8afb4a84444f878b429697465850'
});

const devOSM = new OSM({
  attributions: ['Map data ©<a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'],
});

const osm = location.hostname === "localhost" ? devOSM : prodOSM;

const base = new TileLayer({
  source: osm,
});

const map = new Map({
  layers: [base, ...trails, ...Object.values(trailhead_kml_layers)],
  target: document.getElementById('ol-map'),
  view: new View({
    center: [-13611974.488458559, 4558011.3361273315],
    projection: 'EPSG:3857',
    zoom: 10,
  }),
});

map.addOverlay(overlay);

let currentFeature;
const displayFeatureInfo = function (pixel, target) {
  const feature = target.closest('.ol-control')
    ? undefined
    : map.forEachFeatureAtPixel(pixel, function (feature) {
        return feature;
      });
  if (feature) {
    info.style.left = pixel[0] + 'px';
    info.style.top = pixel[1] + 'px';
    if (feature !== currentFeature) {
      info.style.visibility = 'visible';
      info.innerText = feature.get('name');
    }
  } else {
    info.style.visibility = 'hidden';
  }
  currentFeature = feature;
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
  if (feature) {
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
      parkInfo.description = feature.get('description');
      parkInfo.weather = feature.get('weather');
      if (feature.get('weather') == undefined) {
        parkInfo.weather = "TODO: look up weather for this park" // getWeather(feature);
      }
      const lonlat = olProj.transform(coordinates, 'EPSG:3857', 'EPSG:4326');
      directionsLink.href = `https://www.google.com/maps/dir/?api=1&destination=${lonlat[1]},${lonlat[0]}&travelmode=transit`;
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
    return `<h3>${parkInfo.parkname}</h3><h4>${parkInfo.trailhead}</h4>${parkInfo.description}` // <br><br>${parkInfo.weather}`
  }
  return `<h3>${parkInfo.parkname}</h3>${parkInfo.description}` // <br><br>${parkInfo.weather}`
}

function formatHikeInfo(properties) {
  return `<h3>${properties.title}</h3><ul><li>Length: ${properties.length}</li><li>Difficulty: ${properties.difficultyhuman}</li></ul>${properties.blurb}`
}

const filter = document.getElementById('filter-form');
filter.addEventListener('change', function(e) {
  const layer_name = e.target.name;
  if (e.target.checked) {
    map.addLayer(trailhead_kml_layers[layer_name]);
  } else {
    var layersToRemove = [];
    map.getLayers().forEach(function (layer) {
        if (layer.get('name') != undefined && layer.get('name') === layer_name) {
            layersToRemove.push(layer);
        }
    });

    var len = layersToRemove.length;
    for(var i = 0; i < len; i++) {
        map.removeLayer(layersToRemove[i]);
    }
  }
});
