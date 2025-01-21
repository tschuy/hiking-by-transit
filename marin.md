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
  Traveling from San Francisco or the East Bay? Check the <a href="/marin/getting-to-marin">Getting to Marin</a> guide for information on the easiest ways to get into and around the county »
</p>

### Selected Hikes

Filter by difficulty
<div class="message" id="difficulty-selector"></div>
<p></p>

Filter by tag
<div class="message" id="tag-selector"></div>

<hr>

<ul>
{% assign pages_list = site.pages | sort:"url" %}
{% for node in pages_list %}
    {% if node.title != null %}
    {% if node.region == "marin" %}
    <li class="hike hike-difficulty-{{ node.difficulty }}" data-difficulty="{{ node.difficulty }}" data-tags="{{ node.tags }}"><a href="{{ node.url | absolute_url }}">{{ node.title }}</a></li>
    {% endif %}
    {% endif %}
{% endfor %}
</ul>

<img class="infobox region-image" src="/assets/mt-tam.jpg">