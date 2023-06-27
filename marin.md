---
layout: page
title: Marin Hikes
---

<p class="message">
  Marin County is perhaps the most popular outdoors destination in the Bay Area, and for good reason. A quick trip across the Bay from San Francisco drops you almost immediately in world-famous redwoods, atop mountains with 360° views of San Francisco, Oakland, and far beyond.
</p>

Thanks to its restrained development patterns, Marin County has small suburban developments tucked directly against impressive preserves and open spaces nearly everywhere. Though getting to the county from elsewhere can be difficult by transit, once there, the local Marin Transit bus system provides fantastic access to nearly everywhere worth hiking.

<p class="message">
  From the East Bay, the <a href="https://www.goldengate.org/bus/route-schedule/del-norte-bart-station-san-rafael-580/">Golden Gate Transit 580</a> will take you from Del Norte BART to the transit center in downtown San Rafael. From San Francisco, either the <a href="https://www.goldengate.org/bus/route-schedule/santa-rosa-san-francisco-101/">Golden Gate Transit 101</a> or the <a href="https://www.goldengate.org/ferry/route-schedule/sausalito-san-francisco/">Sausalito Ferry</a> will tend to be the best ways to get to Marin.
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

<img src="/assets/mt-tam.jpg">