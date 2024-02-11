---
layout: base
permalink: index.html

title: Ben Gauslin
description: Ben Gauslin’s World Wide Web home page.
view: home
---
# Ben Gauslin

<small>Architect · UXE · Musician</small>

<fancy-details>
  <details>
    <summary>About</summary>

    Hello, I’m a former Chicago architect and ex-Google engineer who currently lives in New Orleans.
    
    When I’m not renovating my 140-year old house in the Vieux Carré, I spend quality time with friends, family, and the electric bass.

  </details>
</fancy-details>

<fancy-details>
  <details>
    <summary>Projects</summary>

    A selection of apps I made with Web Components, vanilla JavaScript, and browser APIs alongside a few of my architecture and music projects.

    {% include 'projects.njk' %}

  </details>
</fancy-details>

<fancy-details>
  <details>
    <summary>Contact</summary>

    You can reach me via email, text, or voicemail:

    {% include 'contact.njk' %}

  </details>
</fancy-details>

<script>
  {% include 'FancyDetails.js' %}
</script>