---
layout: page
title: East Bay Hikes
---

<p class="message">
  The East Bay contains everything from swampy wetlands, to redwood forests, to rolling grass hills. Every season and every preserve has its own individual style, its own best places to see, and its own small details to enjoy.
</p>

The heart of the Bay Area's transit system is indisputably BART, whose five lines all cross through Oakland on their way to every end of the East Bay. Take the Red up to Berkeley for Tilden and Wildcat, the Yellow out to Diablo and Black Diamond Mines, the Blue out to Dublin Canyon, or the Green down to Mission Peak. No matter where you go for a hike, the East Bay is sure to delight. Just don't forget the sunscreen!

## Selected Hikes

Filter by difficulty
<div class="message" id="difficulty-selector"></div>
<p></p>

Filter by tag
<div class="message" id="tag-selector"></div>

<hr>

### Inner East Bay

Hikes in the Berkeley and Oakland Hills, and the Lamorinda area.

<ul>
{% assign pages_list = site.pages | sort:"url" %}
{% for node in pages_list %}
    {% if node.title != null %}
    {% if node.region == "inner-east-bay" %}
<li class="hike hike-difficulty-{{ node.difficulty }}" data-difficulty="{{ node.difficulty }}" data-tags="{{ node.tags }}"><a href="{{ node.url | absolute_url }}">{{ node.title }}</a></li>
    {% endif %}
    {% endif %}
{% endfor %}
</ul>

### Outer East Bay

Hikes past Lamorinda, from Danville to Antioch.

<ul>
{% assign pages_list = site.pages | sort:"url" %}
{% for node in pages_list %}
    {% if node.title != null %}
    {% if node.region == "outer-east-bay" %}
<li class="hike hike-difficulty-{{ node.difficulty }}" data-difficulty="{{ node.difficulty }}" data-tags="{{ node.tags }}"><a href="{{ node.url | absolute_url }}">{{ node.title }}</a></li>
    {% endif %}
    {% endif %}
{% endfor %}
</ul>

### Southern East Bay

Hikes in the hills around Hayward through Fremont.

<ul>
{% assign pages_list = site.pages | sort:"url" %}
{% for node in pages_list %}
    {% if node.title != null %}
    {% if node.region == "southeast-bay" %}
<li class="hike hike-difficulty-{{ node.difficulty }}" data-difficulty="{{ node.difficulty }}" data-tags="{{ node.tags }}"><a href="{{ node.url | absolute_url }}">{{ node.title }}</a></li>
    {% endif %}
    {% endif %}
{% endfor %}
</ul>

<img class="infobox region-image" src="/assets/mt-diablo.jpg">