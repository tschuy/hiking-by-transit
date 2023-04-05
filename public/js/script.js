(function(document) {
  var toggle = document.querySelector('.sidebar-toggle');
  var sidebar = document.querySelector('#sidebar');
  var checkbox = document.querySelector('#sidebar-checkbox');

  /* makes entire background a sidebar hide checkbox */
  // document.addEventListener('click', function(e) {
  //   var target = e.target;

  //   if(!checkbox.checked ||
  //      sidebar.contains(target) ||
  //      (target === checkbox || target === toggle)) return;

  //   checkbox.checked = false;
  // }, false);

  // hide sidebar if we're on mobile
  const width = window. innerWidth;
  if (width < 36 * parseFloat(getComputedStyle(document.documentElement).fontSize)) {
    checkbox.checked = false;
  }

})(document);
