---
layout: page
title: Marin Hikes
---

<p class="message">
  Marin County is perhaps the most popular outdoors destination in the Bay Area, and for good reason. A quick trip across the Bay from San Francisco drops you almost immediately in world-famous redwoods, atop mountains with 360° views of San Francisco, Oakland, and far beyond.
</p>

Thanks to its restrained development patterns and aggressive preservation campaigns, Marin County has small suburban developments tucked directly against impressive preserves and open spaces nearly everywhere. Though getting to the county from elsewhere can be difficult by transit, once there, the local Marin Transit bus system provides fantastic access to nearly everywhere worth hiking.

Marin Transit maintains its own up-to-date list of transit routes to parks, including their own set of featured parks: [check their website for more inspiration](https://marintransit.org/transit-to-parks)!

<p class="message">
  From the East Bay, the <a href="https://www.goldengate.org/bus/route-schedule/del-norte-bart-station-san-rafael-580/">Golden Gate Transit 580</a> will take you from Del Norte BART to the transit center in downtown San Rafael. From San Francisco, either the all-day Hwy 101 corridor buses from <a href="https://www.goldengate.org/bus/schedules-maps/">Golden Gate Transit</a> (101, 130, and 150) or the <a href="https://www.goldengate.org/ferry/route-schedule/sausalito-san-francisco/">Sausalito Ferry</a> will tend to be the best ways to get to Marin. For more information, see <a href="#getting-to-marin">Getting to Marin</a> below.
</p>

### Selected Hikes

<div class="difficulty-selector">
  <label for="cars">I want to see:</label>

  <select name="difficulty" id="hike-difficulty" onchange="difficultySelect()">
    <option value="easy">Easy (3-5mi)</option>
    <option value="moderate">Easy and Moderate (3-7mi)</option>
    <option value="hard" selected>All Hikes</option>
  </select>
</div>

<ul>
{% assign pages_list = site.pages | sort:"url" %}
{% for node in pages_list %}
    {% if node.title != null %}
    {% if node.region == "marin" %}
<li class="hike-difficulty-{{ node.difficulty }}"><a href="{{ node.url | absolute_url }}">{{ node.title }}</a></li>
    {% endif %}
    {% endif %}
{% endfor %}
</ul>

# Getting to Marin

To get outdoors in Marin, it can feel like you have to become a transit planner. Transit in the Bay Area generally does a very good job at having timetables and real-time data on Google Maps, Apple Maps, and the Transit app, so simply using those apps to determine how to get to a specific trailhead is perfectly doable. However, if you know which buses serve the trailheads you are considering, you can understand how many transfers and how long it might take to get to a given park more easily.

### Marin Transit 61

Route 61 serves Mount Tamalpais, Muir Woods, and beaches from Stinson Beach up to the Bolinas Lagoon. The major transfer points for Route 61 are the Sausalito Ferry Terminal (GGT 130 and Sausalito Ferry) and the Marin City Hub (GGT 130 & GGT 150).

### Marin Transit 68

Route 68 serves Samuel P. Taylor State Park, Tomales Bay State Park, and Point Reyes National Seashore. The major transfer point for Route 68 is San Rafael Transit Center.

## From San Francisco

If the ferry schedule lines up with your plans, it is by far the most alluring way to go hiking. For hiking directly off the ferry, Angel Island cannot be bested; Old St. Hilary's Preserve and the Morning Sun Trailhead in the Headlands are just over a half-hour walk from the Tiburon and Sausalito ferry terminals respectively, but otherwise you will need to transfer to a bus, in which case it's almost certainly better to take a Golden Gate Transit bus from San Francisco across the Golden Gate Bridge. Golden Gate Transit runs buses half-hourly or better for most most of the day seven days a week, but not all routes serve all transit centers.

### Marin Transit 61

Ferry transfers are unfortunately consistently poorly timed. In basically every case, it is significantly better to transfer to the 61 at Marin City.

**Weekday transfers at Marin City**

| Golden Gate Transit arrival | Marin Transit 61 departure |
|-----------------|----------------------------|
| 7:49am | 8:25am |
| 11:46am | 12:10pm |
| 12:47pm | 1:10pm |
| 2:43pm | 3:10pm |
| 4:38pm | 4:45pm |
| 6:12pm* | 6:35pm |

\**the 6:12pm connection is from GGT 150. All other weekday connections are from GGT 130.*

**Weekend transfers at Marin City**

| Golden Gate Transit arrival | Marin Transit 61 departure |
|-----------------|----------------------------|
| 7:23am* | 8:15am |
| 9:45am | 10:00am |
| 11:46am | 12:05pm |
| 12:46pm | 1:05pm |
| 1:46pm | 2:00pm |
| 3:19pm* | 3:25pm |
| 4:44pm | 5:10pm |

\**the 7:23am and 3:19pm connections are from GGT 130. All other weekend connections are from GGT 150.*

### Marin Transit 68

From San Francisco, the Golden Gate Transit 101 express bus takes around 1 hour from the Salesforce Transit Center to reach San Rafael and is consistently the best option for transfering to the Marin Transit 68.

**Weekday transfers at San Rafael**

| Golden Gate Transit arrival | Marin Transit 68 departure |
|-----------------------------|----------------------------|
| 7:25am | 7:45am |
| 9:25am | 9:45am |
| 10:25am | 10:45am |
| 11:25am | 11:45am |
| 12:27am | 12:45pm |
| 2:25pm | 2:45pm |
| 4:25pm | 4:45pm |
| 6:25pm | 6:45pm |

**Weekend transfers at San Rafael**

| Golden Gate Transit arrival | Marin Transit 68 departure |
|-----------------------------|----------------------------|
| 7:25am | 7:30am |
| 8:25am | 8:30am |
| 11:25am | 11:30am |
| 12:25pm | 12:30pm |
| 2:25pm | 2:30pm |
| 4:25pm | 4:30pm |
| 6:25pm | 6:30pm |

## From the East Bay

East Bay to Marin transit is possible either via the Golden Gate Transit 580 bus across the Richmond-San Rafael Bridge, or by heading into San Francisco and taking buses from the Salesforce Transit Center. The following charts describe connections from buses heading westbound across the Richmond-San Rafael Bridge.

### Marin Transit 68

**Weekday transfers at San Rafael**

| Del Norte departure | Golden Gate Transit arrival | Marin Transit 68 departure |
|-----------------------------|----------------------------|
| 6:16am | 7:06am | 7:45am |
| 8:16am | 9:10am | 9:45am |
| 9:36am | 10:16am | 10:45am |
| 10:36am | 11:16am | 11:45am |
| 11:36am | 12:16pm | 12:45pm |
| 1:36pm | 2:16pm | 2:45pm |
| 3:36pm | 4:16pm | 4:45pm |
| 5:46pm | 6:16pm | 6:45pm |

**Weekend transfers at San Rafael**

| Del Norte departure | Golden Gate Transit arrival | Marin Transit 68 departure |
|-----------------------------|----------------------------|
| 6:36am | 7:10am | 7:30am |
| 7:36am | 8:17am | 8:30am |
| 10:36am | 11:19am | 11:30am |
| 11:36am | 12:20pm | 12:30pm |
| 1:36pm | 2:20pm | 2:30pm |
| 3:36pm | 4:20pm | 4:30pm |
| 5:36pm | 6:20pm | 6:30pm |


### Marin Transit 61

Transfers to the 61 are complicated, as the GGT 580 and Marin Transit 61 do not directly connect. Depending on the particular departure, there are several options for which bus is best to take to transfer between them; on weekends, there's generally a decent transfer via the Golden Gate Transit 150 bus.

**Weekday transfers**

| Del Norte departure | 580 arrival at San Rafael | via | Marin Transit 61 departure |
|---------------------------|----------|----------------------------|
| 6:56am | 7:46am | Marin Transit 71 at 7:59am | 8:25am |
| 10:36am | 11:16am | GGT 150 at 11:45am | 12:10pm |
| 11:36am | 12:16pm | GGT 150 at 12:45pm | 1:10pm |
| 1:36pm | 2:16pm | GGT 150 at 2:45pm | 3:10pm |
| 3:36pm | 4:16pm | Marin Transit 17 at 4:29pm* | 5:01pm |
| 5:36pm | 6:16pm | Marin Transit 17 at 6:29pm* | 7:01pm |

\**When taking the Marin Transit 17 to transfer, transfer at Almonte Blvd & Rosemont Ave.*

**Weekend transfers**

| Del Norte departure | 580 arrival at San Rafael | via 150 at | Marin Transit 61 departure |
|---------------------------|------------|----------------------------|
| 6:36am | 7:10am | 7:45am | 8:15am |
| 8:36am | 9:17am | 9:45am* | 10:00am |
| 10:36am | 11:20am | 11:45am |12:05pm |
| 11:36am | 12:20pm | 12:45pm | 1:05pm |
| 12:36pm | 1:20pm | 1:45pm* | 2:00pm |
| 1:36pm | 2:20pm | 2:45pm | 3:25pm |
| 3:36pm | 4:20pm | 4:45pm | 5:10pm |

\**Due to a short transfer for the 10:00am/2:00pm Marin Transit 61, transfer at the Manzanita Park and Ride/Shoreline Hwy & Pohono St.*

<img src="/assets/mt-tam.jpg">