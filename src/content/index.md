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

    Hello, I’m an ex-Google engineer and former Chicago architect who currently
    lives in New Orleans.
    
    After formal training on percussion, drumset, and bass guitar, I earned a
    [degree in Architecture][vt-arch] and began teaching myself code during
    the [dot-com bubble][bubble].
    
    I craft apps, spaces, and songs...

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
</details-plus>


[bubble]: https://en.wikipedia.org/wiki/Dot-com_bubble "Wikipedia article about the dot-com boom and bust of the late 90s"
[vieux-carre]: https://en.wikipedia.org/wiki/French_Quarter "Wikipedia article about New Orleans’ French Quarter"
[vt-arch]: https://arch.vt.edu/ "College of Architecture at Virginia Tech"
