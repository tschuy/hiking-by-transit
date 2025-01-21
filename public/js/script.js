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

  setupFilters();
})(document);

function setupFilters() {
  let tags = [];
  document.querySelectorAll('.hike').forEach(h => {
    tags = [...tags, ...h.dataset.tags.split(" ")];
  });
  tags = tags.filter((item, pos) => tags.indexOf(item) === pos);

  const selector = document.getElementById("tag-selector");
  for (const t of tags) {
    const tlink = document.createElement('a');
    tlink.classList = ["tag-link"];
    const spacer = document.createTextNode(' ');
    tlink.innerHTML = t;
    tlink.onclick = function() { toggle(selectedTags, t, tlink) };
    selector.appendChild(tlink);
    selector.appendChild(spacer);
  }

  const difficultyDisplay = {"easy": "Easy (3-5mi)", "moderate": "Moderate (5-7mi)", "hard": "Hard (6+mi)"}
  const difficultySelector = document.getElementById("difficulty-selector");
  for (let d of Object.keys(difficultyDisplay)) {
    if (!difficultySelector) continue;
    const dlink = document.createElement('a');
    dlink.classList = ["tag-link tag-highlighted"];
    const spacer = document.createTextNode(' ');
    dlink.innerHTML = difficultyDisplay[d];
    dlink.onclick = function() { toggle(selectedDifficulties, d, dlink) };
    difficultySelector.appendChild(dlink);
    difficultySelector.appendChild(spacer);
  }
}

var selectedTags = [];
var selectedDifficulties = ["easy", "moderate", "hard"];
function toggle(selected, tag, tlink) {
  console.log('test');
  console.log(selected);
  index = selected.indexOf(tag);
  if (index !== -1) {
    selected.splice(index, 1);
    tlink.classList.remove("tag-highlighted");
  } else {
    selected.push(tag);
    tlink.classList.add("tag-highlighted");
  }

  document.querySelectorAll('.hike').forEach(h => {
    console.log(h);
    const hikeTags = h.dataset.tags.split(" ");
    const hikeDifficulty = h.dataset.difficulty;
    if(!selectedTags.every(val => hikeTags.includes(val)) || !selectedDifficulties.includes(hikeDifficulty)) {
      h.style.display = "none";
    } else {
      h.style.display = null;
    }
  });
}

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
