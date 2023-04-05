---
layout: page
title: East Bay Hikes
---

<p class="message">
  The East Bay contains everything from swampy wetlands, to redwood forests, to rolling grass hills. Every season and every preserve has its own individual style, its own best places to see, and its own small details to enjoy.
</p>

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
