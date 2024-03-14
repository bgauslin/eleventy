---
layout: base
permalink: index.html

title: Ben Gauslin
description: Ben’s home page on the World Wide Web
classname: home
---
# Ben Gauslin

<fancy-details accordion>
  <details id="about">
    <summary>
      <h2>About</h2>
    </summary>

    Hello, I’m a former Chicago architect and ex-Google engineer who currently lives in New Orleans.
    
    I was formally trained as a percussionist, have a degree in Architecture, and started teaching myself code during the Dot-com Bubble; you can check out some of the stuff I’ve made below.
    
    When I’m not renovating my 140-year old house in the Vieux Carré, I spend quality time with friends, family, and the electric bass.

    <img src="img/selfie.jpg" alt="" class="avatar">

  </details>

  {% include 'projects.njk' %}

  <details id="contact">
    <summary>
      <h2>Contact</h2>
    </summary>

    You can reach me via email, text, or voicemail.

    {% include 'contact.njk' %}

  </details>
</fancy-details>
