---
layout: default
title: Trailhead Map
hasmap: true
---

<h1 class="page-title">Trailhead Map</h1>

The trailhead map is intended to contain all the trailheads around Northern California that are transit-accessible. In urban and suburban areas, this generally considered to be no more than around a 30-minute walk from stop to trailhead. In more rural areas with more sparse transit access, stops further from transit are included; in some very rare cases, mainly for the Pacific Crest Trail and Eastern Sierra passes, trailheads as far as 2-3+ hours from transit are included.

Not every county in Northern California has been added to this map yet. See below for more information on exactly which transit agencies have and have not been included. **Notably, Santa Cruz County is not yet included**.

<div id="ol-map">
  <div id="info"></div>
</div>

<p id="mobile-message">Use two fingers to pan and scroll the map.</p><p id="desktop-message">Hold <em>ctrl</em> and scroll to zoom.</p>

<div id="popup" class="ol-popup">
  <a href="#" id="popup-directions-link" class="ol-popup-link" target="_blank">Open in Maps</a>
  <a href="#" id="popup-hike-link" class="ol-popup-link">Read&nbsp;more&nbsp;»</a>
  <a href="#" id="popup-closer" class="ol-popup-closer"></a>
  <div id="popup-content"></div>
</div>

<div id="filter" class="infobox infobox-filter map-page">
  <div id="filter-trailheads">
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
  <div id="filter-layers">
  <form id="filter-layers-form" autocomplete="off">
    <b>Layers</b><br>
      <input type="checkbox" id="cpad" name="cpad" />
      <label for="cpad">CPAD - Protected Areas</label>
    <hr><b>Show Transit</b><br>
      <input type="checkbox" id="bayarea" name="bayarea" />
      <label for="bayarea">Bay Area</label>
      <br>
      <input type="checkbox" id="tahoe" name="tahoe" />
      <label for="tahoe">Tahoe</label>
      <br>
      <input type="checkbox" id="amtrak" name="amtrak" />
      <label for="amtrak">Amtrak</label>
      <br>
      <input type="checkbox" id="sacrt" name="sacrt"/>
      <label for="sacrt">Sacramento Regional Transit (SacRT)</label>
      <br>
      <input type="checkbox" id="central-valley" name="central-valley" />
      <label for="central-valley">Central Valley</label>
      <br>
      <input type="checkbox" id="other" name="other" />
      <label for="other">Other agencies</label>
      <br>
  </form>
  </div>
</div>


<hr>

The park and protected lands layer is from the Greeninfo Network: *California Protected Areas Database (CPAD) – [www.calands.org](www.calands.org) (December 2025)*

<hr>

This map includes transit from transit agencies across Northern California.

## Is this map comprehenisve?

This map is *intended* to be comprehensive. However, schedules change, and especially in far-flung rural areas it can be difficult to track changes over time. The map was last comprehensively updated in January 2026.

If you've noticed a missing trailhead, transit service that should be included but isn't, or *especially* transit that no longer exists, **please** email <a href="mailto:contact@hikingbytransit.com">contact@hikingbytransit.com</a> with the details.

## Pedestrian access to National Forests via roadways

The lack of "trailhead access" in some rural areas does not mean there is no access
for the motivated individual. Transit stops have been included here where a bus serves a specific
named long-distance hiking route, even on a section that is pavement (like the Bigfoot Trail in Hayfork on Trinity Transit), but other places where a bus might stop within 4-10 miles of a National Forest have not been included (like is the case in Janesville on the Sage Stage).

If you're interested in finding those sorts of mariginal access, enable both the Public Lands layer and the Transit Stops layer on the map, and get scrolling!

In addition to the CPAD database, useful resources for constructing transit-accessible adventures are CalTopo's FSTopo 2016 layer for finding official trails, and the Strava Heatmap for finding routes that actually get use and have not been abandoned.

## Which transit agencies / areas are included on the map?

Muni has not been included on this map, as its services stay exclusively within San Francisco. San Francisco has fantastic urban parks, including ones with world-class urban hikes, but that information can be found across the internet as a whole.

### The following agencies currently appear on the map:

**Bay Area**
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

**North Coast**
* Lake Transit
* Mendocino Transit Authority
* Humboldt Transit Authority
* Redwood Coast Transit

**Sierra Nevada**
* Tahoe Area Regional Transit
* Tahoe Transportation District
* YARTS
* Sequoia Shuttle
* Eastern Sierra Transit, not including Reds Meadow shuttle

**Shasta Cascade**
* Trinity Transit
* Siskyou County STAGE
* Sage Stage (Modoc County)
* Plumas Transit Systems
* Lassen Rural Bus
* Redding Area Bus Authority

**Central Valley and Foothills**
* Tehama TRAX
* Placer County Transit
* El Dorado Transit
* Nevada County Transit
* Calaveras Transit
* Amador Transit
* Tuolumne County Transit
* Madera County Connection
* San Joaquin RTD
* StanRTA
* KART (Kings Area)
* Merced County Transit
* CatTracks (UC Merced)
* Tulare County Regional Area Transit Agency
* Fresno County Transit Agency
* SacRT
* Butte County B-Line
* Kern Transit

### The following agencies do not appear on the map, but are planned to:

**Central Coast**
* Santa Cruz Metro
* Monterey-Salinas Transit
* SLORTA
    * Grover/Pismo
    * SLO
    * Morro Bay up to Cayucos
* SLO Transit

**Sierra Nevada**
* Reds Meadow shuttle

**Statewide**
* Amtrak thruway buses

### Microtransit and Dial-a-Ride
The following dial-a-ride and microtransit services are intended to be included on the map:

* ShastaConnect
* Alpine County Dial-a-Ride
* MARI-GO Transit
* transPORT (Porterville)
* The Micro Bus (Merced)
* Van Go! (Stanislaus)
* Quincy Evening
* Kern Transit
