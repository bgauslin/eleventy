---
layout: base
permalink: index.html

title: Ben Gauslin
description: Ben’s home page on the World Wide Web
classname: home
---
# Ben Gauslin

<details-plus accordion>
  <details id="about" open>
    <summary>
      <h2>About</h2>
    </summary>

    Hello, I’m a former Chicago architect, Google engineer, and design professor who also plays drumkit and fretless bass because, well, why not?
    
    I like to make things and discover stuff and live in Madrid these days, where I am currently learning Spanish the hard way.
    
    <small>_...que es muy lento pero muy emocionante y mucho más valioso. ¡Bienvenidos y gracias por visitarme!_</small>

    <img src="images/selfie.jpg" alt="" class="avatar">
  </details>

  {% include 'projects.njk' %}

  <details id="contact">
    <summary>
      <h2>Contact</h2>
    </summary>

    You can reach me via email, text, or voicemail.

    {% include 'contact.njk' %}

  </details>
</details-plus>
