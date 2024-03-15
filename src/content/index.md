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

    Hello, I’m a former Chicago architect and ex-Google engineer who currently lives in New Orleans.
    
    I’m formally trained as a percussionist, have a [degree in Architecture][vt-arch], and began teaching myself code during the [dot-com bubble][bubble].
    
    When I’m not renovating my 140-year old house in the [Vieux Carré][vieux-carre], I spend quality time with friends, family, and the electric bass.

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
[vieux-carre]: https://en.wikipedia.org/wiki/French_Quarter "Wikipedia article about the New Orleans French Quarter"
[vt-arch]: https://arch.vt.edu/ "College of Architecture at Virginia Tech"
