---
permalink: shotgun/index
tags: slideshow

title: Shotgun Renovation
images:
  - shotgun/listing-dining-living.jpg
---
Breathing new life into an 1890s New Orleans shotgun house.

<ul>
{%- for item in collections.shotgun %}
  <li>{{ item.url }}</li>
{% endfor -%}
</ul>