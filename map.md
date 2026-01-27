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
  <a href="#" id="popup-hike-link" class="ol-popup-link">Read&nbsp;more&nbsp;»</a>
  <a href="#" id="popup-closer" class="ol-popup-closer"></a>
  <div id="popup-content"></div>
</div>

<div id="filter" class="infobox infobox-filter map-page">
  <b>Filter Trailheads</b>
  <form id="filter-form" autocomplete="off">
      <input type="checkbox" id="bus" name="bus" checked />
      <label for="bus">Bus & Light Rail</label>
      <br>
      <input type="checkbox" id="bus-far" name="bus-far" checked />
      <label for="bus-far">Bus & Light Rail (15+min walk)</label>
      <br>
      <input type="checkbox" id="bus-weekday-only" name="bus-weekday-only" checked />
      <label for="bus-weekday-only">Bus (Weekday only)</label>
      <br>
      <input type="checkbox" id="rail" name="rail" checked />
      <label for="rail">Rail & Ferry</label>
      <br>
      <input type="checkbox" id="rail-far" name="rail-far" checked />
      <label for="rail-far">Rail & Ferry (20+min walk)</label>
      <br>
      <input type="checkbox" id="shuttles" name="shuttles" checked />
      <label for="shuttles">Park Shuttles</label>
      <br>
      <input type="checkbox" id="microtransit" name="microtransit" checked />
      <label for="microtransit">Microtransit</label>
      <br>
      <input type="checkbox" id="call-ahead" name="call-ahead" checked />
      <label for="call-ahead">Call-ahead Service</label>
  </form>
</div>

<hr>

<!--The park and protected lands layer is from the Greeninfo Network: *California Protected Areas Database (CPAD) – [www.calands.org](www.calands.org) (December 2025)*-->

<hr>

I've surveyed most of the Bay Area's transit agencies so far; the most notable exception is Muni, which serves plenty of great hiking options inside San Francisco, plus San Bruno Mountain. I've left Muni off of the map as San Francisco's parks are not quite natural spaces in the sense of large uninterrupted spaces with few roads and little development; the city also has tons of great parks covering the place. For the best of San Francisco hiking, I've left that in the more capable hands of the Crosstown Trail, a project by the fantastic SF Parks Alliance.

I try to keep up with agency route changes, but inevitably will miss some. If you see a trailhead that's accessible by transit that I've missed, or a bus I claim goes somewhere it no longer does or no longer does on weekends when I say it does, **please** contact me at the email address below.

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
* Mendocino Transit
* Humboldt Transit Authority
* Redwood Coast Transit
* Tahoe Area Regional Transit (south of Truckee)
* Tahoe Transportation District

The next agencies I plan to look at are:
* Tahoe Area Regional Transit (Truckee area)
* Santa Cruz Metro
* Monterey-Salinas Transit
* Trinity Transit
* Amtrak buses
