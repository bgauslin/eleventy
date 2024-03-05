---
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
  /* Fancy list styles set in light DOM */
  fancy-list :is(ol, li) {
    display: grid;
    inline-size: 100vw;
  }
  
  fancy-list ol {
    grid: 1fr / auto-flow;
    overflow: scroll hidden;
    margin: 0;
    padding: 0;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }
  
  fancy-list ol::-webkit-scrollbar {
    display: none;
  }
  
  fancy-list li {
    scroll-snap-align: start;
    user-select: none;
  }

  /* Debug styles: REMOVE. */
  html {
    touch-action: manipulation;
  }

  body {
    font: bold 1rem / 1.5 monospace;
    margin: 0
  }
  
  fancy-list li {
    aspect-ratio: 4 / 3;
    place-content: center;
  }

  fancy-list li:nth-child(odd) {
    background: rgba(0, 0, 0, .1);
  }

  fancy-list li:nth-child(even) {
    background: rgba(0, 0, 0, .15);
  }
</style>


<script>
  {% include 'FancyList.js' %}
</script>