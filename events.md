---
layout: default
title: Events
---

Want to celebrate getting outdoors on the bus? Eager to try a car-free hike but want to try it with folks? Come join us for an event!


<ul>
{% assign pages_list = site.pages | sort:"url" %}
{% for node in pages_list reversed %}
    {% if node.event_date != null %}
<li>{{ node.event_date }}: <a href="{{ node.url | absolute_url }}">{{ node.title }}</a></li>
    {% endif %}
{% endfor %}
</ul>
