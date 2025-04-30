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
    
    Hello, I’m a former Google engineer and Chicago architect, and forever a New Orleans musician.
    
    This little website is home to some of the web, architecture, and music stuff I’ve made over the years.
    
    Please feel free to look around...

    <img src="images/home/selfie.jpg" alt="" class="avatar">
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
