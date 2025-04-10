---
layout: base
permalink: index.html

title: Ben Gauslin
description: Ben’s home page on the World Wide Web
classname: home
---
# Ben Gauslin

<details-plus accordion>
  <details id="about">
    <summary>
      <h2>About</h2>
    </summary>

    Hello, I’m an ex-Google engineer and former Chicago architect who now lives in Spain, where I am currently learning Spanish the Hard Way.
    
    This little website is home to some of the web, architecture, and music stuff I’ve made over the years. Please feel free to poke around.

    <img src="images/home/selfie.jpg" alt="" class="avatar">

    <p class="hola">¡Bienvenidos y gracias por visitarme!</p>
  </details>

  {% include 'projects.njk' %}

  <details id="contact">
    <summary>
      <h2>Contact</h2>
    </summary>

    You can reach me via email, voicemail, or WhatsApp.

    {% include 'contact.njk' %}

  </details>
</details-plus>

<style>
  .hola {
    font-size: .9em;
    font-style: italic;
    text-align: center;
  }
</style>
