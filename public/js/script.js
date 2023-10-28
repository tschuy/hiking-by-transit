(function(document) {

  // hide sidebar if we're on mobile
  var checkbox = document.querySelector('#sidebar-checkbox');
  const width = window.innerWidth;
  if (width / parseFloat(getComputedStyle(document.documentElement).fontSize) < 70) {
    checkbox.checked = false;
  }

  // if we're on mobile, show the app text
  var banner = document.querySelector("#mobile-banner");
  if (banner && !/Mobi/.test(navigator.userAgent)) {
    banner.style.display = 'none';
  }
  console.log(navigator.userAgent);

})(document);


// filter hikes by difficulty
function difficultySelect() {
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