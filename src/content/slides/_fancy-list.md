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
  
  <!-- TODO: shadow DOM with default slot -->
  <div id="controls">
    <p id="count"></p>
    <button id="prev" disabled>Prev</button>
    <button id="next">Next</button>
  </div>
</fancy-list>


<style>
  html {
    touch-action: manipulation;
  }

  :where(*) {
    box-sizing: border-box;
  }

  body {
    font: bold 1rem / 1.5 monospace;
    margin: 0
  }
  
  :is(ol, li) {
    display: grid;
    inline-size: 100vw;
  }
  
  ol {
    grid: 1fr / auto-flow;
    overflow: scroll hidden;
    padding: 0;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }
  
  ol::-webkit-scrollbar {
    display: none;
  }
  
  li {
    aspect-ratio: 4 / 3;
    background: rgba(0,0,0,.1);
    place-content: center;
    scroll-snap-align: start;
    user-select: none;
  }
  
  li:nth-child(even) {
    background: rgba(0,0,0,.15);
  }
  
  [id='controls'] {
    display: grid;
    gap: 0 .5rem;
    grid: 'prev count next' / auto 1fr auto;
    inline-size: 100vw;
    padding-inline: .5rem;
  }
  
  :is(button, p) {
    margin: 0;
  }
  
  button {
    appearance: none;
    background: rgba(0,0,0,.05);
    border: none;
    border-radius: 3rem;
    cursor: pointer;
    font: inherit;
    padding: .375rem 1rem;
    transition: opacity .3s;
  }
  
  button[disabled] {
    opacity: 0;
  }
  
  [id='prev'] {
    grid-area: prev;
  }
  
  [id='next'] {
    grid-area: next;
  }
  
  [id='count'] {
    grid-area: count;
    place-self: center;
  }
</style>


<script>
  {% include 'FancyList.js' %}
</script>