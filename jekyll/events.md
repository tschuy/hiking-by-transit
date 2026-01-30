---
layout: default
title: Events
---

Want to celebrate getting outdoors on the bus? Eager to try a car-free hike but want to try it with folks? Come join us for an event!

To register for notifications about future events, [sign up here!](https://docs.google.com/forms/d/e/1FAIpQLSdAlFGvGSKRyt6ri-lLNEvcCkrHgNATMYvdxIZw-bfXFIZOHg/viewform?entry.839337160=Emails+about+upcoming+transit-accessible+hike+events)

<ul>
{% assign pages_list = site.pages | sort:"url" %}
{% for node in pages_list reversed %}
    {% if node.event_date != null %}
<li>{{ node.event_date }}: <a href="{{ node.url | absolute_url }}">{{ node.title }}</a></li>
    {% endif %}
{% endfor %}
</ul>
