(function(document) {
  // hide sidebar if we're on mobile
  let checkbox = document.querySelector('#sidebar-checkbox');
  if (window.innerWidth < 1200) {
    checkbox.checked = false;
  }

  // if we're on not mobile, hide mobile-specific messages
  if (!window.navigator.userAgent.toLowerCase().includes("mobi")) {
    let banner = document.querySelector("#mobile-banner");
    if (banner) banner.style.display = 'none';
    let mobileMessage = document.querySelector("#mobile-message");
    if (mobileMessage) mobileMessage.style.display = 'none';
  } else {
    let banner = document.querySelector("#desktop-banner");
    if (banner) banner.style.display = 'none';
    let desktopMessage = document.querySelector("#desktop-message");
    if (desktopMessage) desktopMessage.style.display = 'none';
  }

  addEventListener("resize", (event) => {
    if (window.innerWidth > 1200) {
      checkbox.checked = true;
    }
  });

  // restore default styles to elements hidden during load to prevent flashing
  document.querySelectorAll('.wrap, .sidebar').forEach(e => {
    e.style.display = "block";
  });

  document.querySelectorAll('.sidebar-toggle').forEach(e => {
    e.style.display = "flex";
  });

  if (document.getElementById('osmMapUrl')) {
    document.getElementById('osmMapUrl').value = decodeURIComponent(localStorage.getItem("osmmapurl"));
  }

  setupFilters();
})(document);

// add an <a> element with the proper classes and onclicks for filtering
function appendFilterable(selectorContainer, displayText, key, type, highlighted) {
  const link = document.createElement('a');
  link.classList = ["tag-link"];
  if (highlighted) link.classList.add("tag-highlighted");
  const spacer = document.createTextNode(' ');
  link.innerHTML = displayText;
  link.onclick = function() { toggle(type, key, link) };
  selectorContainer.appendChild(link);
  selectorContainer.appendChild(spacer);
}

// prime the tag and difficulty filters
function setupFilters() {
  let tags = [];
  document.querySelectorAll('.hike').forEach(h => {
    tags = [...tags, ...h.dataset.tags.split(" ")];
  });
  tags = tags.filter((item, pos) => tags.indexOf(item) === pos);

  const tagContainer = document.getElementById("tag-selector");
  for (const t of tags) {
    appendFilterable(tagContainer, t, t, "tag", false);
  }

  const difficultyDisplay = {"easy": "Easy\xa0(3-5mi)", "moderate": "Moderate\xa0(5-7mi)", "hard": "Hard\xa0(6+mi)"}
  const difficultyContainer = document.getElementById("difficulty-selector");
  for (let d of Object.keys(difficultyDisplay)) {
    if (!difficultyContainer) continue;
    appendFilterable(difficultyContainer, difficultyDisplay[d], d, "difficulty", true);
  }
}

// start with no tags selected
var selectedTags = [];
// start with all difficulty levels selected
var selectedDifficulties = ["easy", "moderate", "hard"];
function toggle(type, tag, tlink) {
  let selected;
  if (type === "tag") {
    selected = selectedTags;
  } else {
    selected = selectedDifficulties;
  }

  // check if we're toggling on or off
  index = selected.indexOf(tag);
  if (index !== -1) {
    selected.splice(index, 1);
    tlink.classList.remove("tag-highlighted");
  } else {
    selected.push(tag);
    tlink.classList.add("tag-highlighted");
  }

  // refilter all hikes
  document.querySelectorAll('.hike').forEach(h => {
    const hikeTags = h.dataset.tags.split(" ");
    const hikeDifficulty = h.dataset.difficulty;
    // note that .every() means that if selectedTags is empty, all pass the test, which is desired behavior
    if(!selectedTags.every(val => hikeTags.includes(val)) || !selectedDifficulties.includes(hikeDifficulty)) {
      h.style.display = "none";
    } else {
      h.style.display = null;
    }
  });
}

function updateOsmMapUrl() {
  const url = document.getElementById('osmMapUrl').value;
  if (!url) {
    // delete if we've unset the url
    localStorage.removeItem('osmmapurl');
  } else {
    localStorage.setItem('osmmapurl', encodeURIComponent(url));
  }
}

if (document.getElementById("promo")) {
  promoName = document.getElementById("promo").dataset.name;
  // check promo cookie; display banner if promo dismiss cookie isn't set and promo exists
  promoValue = document.cookie.split("; ").find((row) => row.startsWith(promoName+"="))?.split("=")[1];
  if (promoValue != "false") {
    promoDiv = document.getElementById("promo");
    if (promoDiv) {
      promoDiv.style.display = "block";
    }
  }
}

// set promo dismiss cookie with the given expiration and hide promo
function dismissPromo(endtime) {
  cookieText = promoName + '=false; expires=' + endtime + '; path=/';
  document.cookie = cookieText;
  document.getElementById("promo").style.display = "none";
}
