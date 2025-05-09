
let opts = {
  map: {
    fullscreenControl: false,
    resizerControl: true,
    preferCanvas: true,
    rotate: true,
    rotateControl: {
      closeOnZeroBearing: true
    },
  },
  elevationControl: {
    options: {
      theme: "lightblue-theme",
      collapsed: true,
      autohide: false,
      autofitBounds: true,
      position: "bottomleft",
      detached: true,
      summary: "inline",
      imperial: true,
      // altitude: "disabled",
      slope: "disabled",
      speed: false,
      acceleration: false,
      time: "summary",
      legend: true,
      followMarker: true,
      almostOver: true,
      distanceMarkers: false,
      hotline: false,
    },
  },
  layersControl: {
    options: {
      collapsed: false,
    },
  },
};

let maps = document.querySelectorAll(".map");
maps.forEach((mapDiv) => {
  opts.elevationControl.options.url = "/assets/gpx/" + mapDiv.dataset.gpx;
  console.log(mapDiv);
  let map = L.map(mapDiv, opts.map);

  let controlElevation = L.control.elevation(opts.elevationControl.options).addTo(map);
  let controlLayer = L.control.layers(null, null, opts.layersControl.options);

  controlElevation.on('eledata_loaded', ({layer, name}) => controlLayer.addTo(map) && layer.eachLayer((trkseg) => trkseg.feature.geometry.type != "Point" && controlLayer.addOverlay(trkseg, trkseg.feature && trkseg.feature.properties && trkseg.feature.properties.name || name)));
  controlElevation.load(opts.elevationControl.options.url);
});

