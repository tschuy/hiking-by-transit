---
layout: page
title: Peninsula Hikes
---

<p class="message">
  Parkland on the peninsula takes many shapes: hills that once held radio towers and Nike missles today offer a respite from the sprawl below. State beaches and rugged windswept parkland line the coast. Towering redwood forests loom large over the interior.
</p>

In the northern part of San Mateo County, the northern end of the Santa Cruz Mountains finally meets the sea. To the east of the ridgeline, famous tech companies like YouTube and biotech firms like Genentech make their homes in the unending sprawl near the airport; to the west, Pacifica and Half Moon Bay sit quietly, a world away despite their closeness. Between, thousands of acres of protected parkland dominated by coastal scrub provide incredible panoramic views.

The inland and southern coast of San Mateo County is quite difficult to get to by transit. The Southern Skyline Boulevard Ridge Trail is a notable exception, with buses stopping only a few hundred feet from the trailhead; apart from that, the only way to get to the county's famous redwoods and most remote beaches is using a call-ahead shuttle service called SamCoast. [Learn more about SamCoast here »](/peninsula/samcoast/)

### Selected Hikes

<div class="infobox">
  <div>
  <b>Filter by difficulty</b>
  <div class="message" id="difficulty-selector"></div>
  </div>

  <div>
  <b>Filter by tag</b>
  <div class="message" id="tag-selector"></div>
  </div>

  <img class="sidebar-image" src="/assets/sweeney-ridge.jpg">
</div>

<ul>
{%- assign pages_list = site.pages | sort:"url" -%}
{%- for node in pages_list -%}
    {%- if node.title != null -%}
    {% if node.region == "peninsula" %}
    <li class="hike" data-difficulty="{{ node.difficulty }}" data-tags="{{ node.tags }}"><a href="{{ node.url | absolute_url }}">{{ node.title }}</a></li>
    {%- endif -%}
    {%- endif -%}
{%- endfor %}
</ul>

<img class="footer-image" src="/assets/sweeney-ridge.jpg">
