---
layout: default
title: About the Map
hasmap: true
---

<h1 class="page-title">About the Map</h1>

This trailhead map contains all of the trailheads I've found that are transit accessible in the Bay Area (and a little bit beyond). I've considered "transit accessible" to be around a 30-minute walk, which is a reasonable approach for a longer hike, but for shorter hikes, I would recommend unchecking the "15+ min bus"/"20+ min train" categories. You can also toggle weekday-only services.

Bus routes are only counted where they run throughout the day. Services that run a few times a day for school or office commutes aren't included, but routes that run a few-a-day lifeline-level have been in certain cases (like Lake County).

If you're on your phone, I recommend opening the link below, which will temporarily add the trailheads as a layer in your Google Maps app. The Google Maps layer won't have the hike tracks that are included here.

<h3 class="centered"><a href="https://www.google.com/maps/d/viewer?mid=1QqhlN34LiBV7FQZZh5ZzEl4kzpwLKcE" target="_blank">Open in Google Maps</a></h3>

<div id="ol-map">
  <div id="info"></div>
</div>

<div id="popup" class="ol-popup">
  <a href="#" id="popup-directions-link" class="ol-popup-link" target="_blank">Open in Maps</a>
  <a href="#" id="popup-hike-link" class="ol-popup-link">Read more »</a>
  <a href="#" id="popup-closer" class="ol-popup-closer"></a>
  <div id="popup-content"></div>
</div>

<div id="filter">
  Filter Trailheads:
  <form id="filter-form" autocomplete="off">
  <ul>
    <li>
      <input type="checkbox" id="bus-light-rail" name="bus-light-rail" checked />
      <label for="bus-light-rail">Bus & Light Rail</label>
    </li>

    <li>
      <input type="checkbox" id="bus-light-rail-far" name="bus-light-rail-far" checked />
      <label for="bus-light-rail-far">Bus & Light Rail (15+min walk)</label>
    </li>

    <li>
      <input type="checkbox" id="bus-weekday-only" name="bus-weekday-only" checked />
      <label for="bus-weekday-only">Bus (Weekday only)</label>
    </li>

    <li>
      <input type="checkbox" id="rail-ferry" name="rail-ferry" checked />
      <label for="rail-ferry">Rail & Ferry</label>
    </li>

    <li>
      <input type="checkbox" id="rail-ferry-far" name="rail-ferry-far" checked />
      <label for="rail-ferry-far">Rail & Ferry (20+min walk)</label>
    </li>

    <li>
      <input type="checkbox" id="bart" name="bart" checked />
      <label for="bart">BART</label>
    </li>

    <li>
      <input type="checkbox" id="bart-far" name="bart-far" checked />
      <label for="bart-far">BART (20+min walk)</label>
    </li>

    <li>
      <input type="checkbox" id="shuttles" name="shuttles" checked />
      <label for="shuttles">Park Shuttles</label>
    </li>
  </ul>
  </form>
</div>

I've surveyed most of the Bay Area's transit agencies so far; the most notable exception is Muni, which serves plenty of great hiking options inside San Francisco, plus San Bruno Mountain. I've left Muni off of the map as San Francisco's parks are not quite natural spaces in the sense of large uninterrupted spaces with few roads and little development; the city also has tons of great parks covering the place. For the best of San Francisco hiking, I've left that in the more capable hands of the Crosstown Trail, a project by the fantastic SF Parks Alliance.

I try to keep up with agency route changes, but inevitably will miss some. If you see a trailhead that's accessible by transit that I've missed, or a bus I claim goes somewhere no longer does or no longer does on weekends when I say it does, **please** contact me at the email address below.

Current agencies I've surveyed include:
* Tri Delta
* AC Transit
* BART
* County Connection
* Wheels
* WestCAT
* Caltrain
* VTA
* Marguerite Shuttle
* SamTrans
* Sonoma County Transit
* FAST
* The Vine
* Marin Transit
* Petaluma Transit
* Golden Gate Transit
* Bear Transit
* Union City Transit
* SolTrans

The next agencies I plan to look at are:
* Mendocino Transit
* Santa Cruz Metro
* Monterey-Salinas Transit
* Amtrak buses
