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
