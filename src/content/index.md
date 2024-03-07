---
layout: base
permalink: index.html

title: Ben Gauslin
description: Ben’s home page on the World Wide Web
view: home
---
# Ben Gauslin

- Engineer
- Architect
- Musician

<fancy-details>
  <details>
    <summary>
      <h2>About</h2>
    </summary>

    Hello, I’m an ex-Google engineer and former Chicago architect who currently lives in New Orleans.
    
    When I’m not renovating my 140-year old house in the Vieux Carré, I spend quality time with friends, family, and electric bass.

  </details>
</fancy-details>

<fancy-details>
  <details>
    <summary>
      <h2>Projects</h2>
    </summary>

    A selection of apps built with Web Components alongside a few architecture and music projects.

    {% include 'projects.njk' %}

  </details>
</fancy-details>

<fancy-details>
  <details>
    <summary>
      <h2>Contact</h2>
    </summary>

    You can reach me via email, text, or voicemail.

    {% include 'contact.njk' %}

  </details>
</fancy-details>

<script>
  {% include 'FancyDetails.js' %}
</script>