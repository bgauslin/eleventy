---
layout: base
permalink: fancy-list.html
---

<fancy-list>
  <ol>
    <li>one</li>
    <li>two</li>			
    <li>three</li>
    <li>four</li>
    <li>five</li>
    <li>six</li>
    <li>seven</li>
    <li>eight</li>
    <li>nine</li>
    <li>ten</li>
  </ol>
</fancy-list>

<style>
  /* Debug styles: REMOVE. */
  :root {
    --main-padding: 0;
  }

  fancy-list li {
    aspect-ratio: 4 / 3;
    place-content: center;
  }
</style>

<script>
  {% include 'FancyList.js' %}
</script>