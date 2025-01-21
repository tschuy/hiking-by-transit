---
layout: page
title: South Bay Hikes
---

<p class="message">
  The Valley of Heart's Delight was once famous for its fresh fruit, flowering trees, and scenic beauty. Today, the orchards are gone, but the hills remain, standing resolute above the traffic jams and sprawl. 
</p>

The South Bay is an absolutely massive region, with the San José basin stretching some 15 miles from side to side. Unfortunately, this makes getting out of the urban area somewhat more difficult than in other parts of the Bay, and a lot of the South Bay's best transit-accessible hiking is only accessible on weekdays. There are no buses up into the hills to go to destination parks like Castle Rock or the redwoods parks. The following selected hikes are reachable any day of the week, and provide access to some great panoramic views nevertheless.

### Selected Hikes

Filter by difficulty
<div class="message" id="difficulty-selector"></div>
<p></p>

Filter by tag
<div class="message" id="tag-selector"></div>

<hr>

<ul>
{%- assign pages_list = site.pages | sort:"url" -%}
{%- for node in pages_list -%}
    {%- if node.title != null -%}
    {% if node.region == "south-bay" %}
    <li class="hike" data-difficulty="{{ node.difficulty }}" data-tags="{{ node.tags }}"><a href="{{ node.url | absolute_url }}">{{ node.title }}</a></li>
    {%- endif -%}
    {%- endif -%}
{%- endfor %}
</ul>
