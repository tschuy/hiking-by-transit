---
layout: page
title: East Bay Hikes
---

<p class="message">
  The East Bay contains everything from swampy wetlands, to redwood forests, to rolling grass hills. Every season and every preserve has its own individual style, its own best places to see, and its own small details to enjoy.
</p>

The heart of the Bay Area's transit system is indisputably BART, whose five lines all cross through Oakland on their way to every end of the East Bay. Take the Red up to Berkeley for Tilden and Wildcat, the Yellow out to Diablo and Black Diamond Mines, the Blue out to Dublin Canyon, or the Green down to Mission Peak. No matter where you go for a hike, the East Bay is sure to delight. Just don't forget the sunscreen!

### Selected Hikes

<ul>
{% assign pages_list = site.pages | sort:"url" %}
{% for node in pages_list %}
    {% if node.title != null %}
    {% if node.region == "east-bay" %}
<li><a class="hike-difficulty-{{ node.difficulty }}" href="{{ node.url | absolute_url }}">{{ node.title }}</a></li>
    {% endif %}
    {% endif %}
{% endfor %}
</ul>

<!-- 
### Select park agencies and organizations in the East Bay 
* [East Bay Regional Parks](https://www.ebparks.org/)
* [East Bay Municipal Utility District](https://www.ebmud.com/recreation/east-bay/east-bay-trails)
* [John Muir Land Trust](https://jmlt.org/)
* [Walnut Creek Open Space](https://www.walnut-creek.org/departments/open-space)
-->
