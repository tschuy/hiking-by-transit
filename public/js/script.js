(function(document) {

  // hide sidebar if we're on mobile
  var checkbox = document.querySelector('#sidebar-checkbox');
  if (window.innerWidth < 1200) {
    checkbox.checked = false;
  }

  // if we're on mobile, show the app text
  var banner = document.querySelector("#mobile-banner");
  if (banner && !/Mobi/.test(navigator.userAgent)) {
    banner.style.display = 'none';
  }

  addEventListener("resize", (event) => {
    if (window.innerWidth > 1200) {
      checkbox.checked = true;
    }
  });
})(document);

// filter hikes by difficulty
function difficultySelect() {
  // filter hikes displayed in the lists
  let e = document.getElementById("hike-difficulty");
  let moderate = "none";
  let hard = "none";
  if (e.value == "moderate") {
    moderate = null;
  } else if (e.value == "hard") {
    moderate = null;
    hard = null;
  }

  document.querySelectorAll('.hike-difficulty-moderate').forEach(function(el) {
    el.style.display = moderate;
  });
  document.querySelectorAll('.hike-difficulty-hard').forEach(function(el) {
    el.style.display = hard;
  });

  // if there's an embedded map, filter hikes on the map
  if (document.getElementById("ol-map") !== undefined) {
    let shownLayers = ["easy"];
    if (e.value == "moderate") shownLayers = ["easy", "moderate"];
    if (e.value == "hard") shownLayers = ["easy", "moderate", "hard"];
    showLayersByDifficulty(shownLayers);
  }
}

// check promo cookie; display banner if promo dismiss cookie isn't set and promo exists
promoValue = document.cookie.split("; ").find((row) => row.startsWith("promo="))?.split("=")[1];
if (promoValue != "false") {
  promoDiv = document.getElementById("promo");
  if (promoDiv) {
    promoDiv.style.display = "block";
  }
}

// set promo dismiss cookie with the given expiration and hide promo
function dismissPromo(endtime) {
  cookieText = 'promo=false; expires=' + endtime + '; path=/';
  document.cookie = cookieText;
  document.getElementById("promo").style.display = "none";
}

// const localStation = "Ashby";
// document.querySelectorAll(".hike-tr").forEach(function(r) {
//   if (r.dataset.travel) {
//     const travel = JSON.parse(r.dataset.travel);
//     const travelTime = stationTimeLookup(localStation, travel.station) + travel.bustime + travel.walktime;
//     const cell = r.insertCell(-1);
//     cell.innerHTML = `${travelTime}min`;
//   }
// });

// const redLine = ["Richmond", "El Cerrito del Norte", "El Cerrito Plaza", "North Berkeley", "Downtown Berkeley", "Ashby"];
// const blueLine = ["Dublin/Pleasanton", "West Dublin/Pleasanton", "Castro Valley"];
// const greenLine = ["Berryessa/North San Jose", "Milpitas", "Warm Springs/South Fremont", "Fremont", "Union City", "South Hayward", "Hayward"];
// const yellowLine = ["Rockridge", "Orinda", "Lafayette", "Walnut Creek", "Pleasant Hill", "Concord", "North Concord", "Pittsburg/Bay Point", "Pittsburg Center", "Antioch"];


// function stationTimeLookup(localStation, destinationStation) {
  
//   return stationTravelTimeMatrix[localStation][destinationStation];
// }