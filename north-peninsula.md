---
layout: page
title: North Peninsula Hikes
---

<p class="message">
  The north peninsula is perhaps most known to residents outside of the immediate area for the airport, the Serramonte Mall, and its graveyards. However, its hills hold some great high-altitude coastal preserves, with windswept views of the Bay, the Pacific, and even the Farallones.
</p>

Northern San Mateo County is split in two by the northern tip of the Santa Cruz Mountains, with towns on either side. To the east, famous tech companies like YouTube and biotech firms like Genentech make their homes in the unending sprawl near the airport; to the west, Pacifica sits quietly, a world away just over the ridge. Between, the Golden Gate National Recreation Area's Sweeney Ridge and a handful of other lands provide incredible panoramic views.

### Selected Hikes

<div class="difficulty-selector">
  <label for="cars">I want to see:</label>

  <select name="difficulty" id="hike-difficulty" onchange="difficultySelect()">
    <option value="easy">Easy (3-5mi)</option>
    <option value="moderate">Easy and Moderate (3-7mi)</option>
    <option value="hard" selected>All Hikes</option>
  </select>
</div>

<p></p>
<ul>
{% assign pages_list = site.pages | sort:"url" %}
{% for node in pages_list %}
    {% if node.title != null %}
    {% if node.region == "north-peninsula" %}
<li class="hike-difficulty-{{ node.difficulty }}"><a href="{{ node.url | absolute_url }}">{{ node.title }}</a></li>
    {% endif %}
    {% endif %}
{% endfor %}
</ul>

<img class="infobox region-image" src="/assets/sweeney-ridge.jpg">