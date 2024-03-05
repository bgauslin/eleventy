
class FancyList extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.setupControls();
    this.watchItems();
    this.addEventListener('click', this.handleClick);
  }

  setupControls() {
    this.attachShadow({mode: 'open'});
    this.shadowRoot.innerHTML = `
      <slot></slot>
      <p></p>
      <button data-direction="prev" disabled>Prev</button>
      <button data-direction="next">Next</button>
    `;

    // References to shadow elements that update on interaction.
    this.prevButton = this.shadowRoot.querySelector('[data-direction="prev"]');
    this.nextButton = this.shadowRoot.querySelector('[data-direction="next"]');
    this.count = this.shadowRoot.querySelector('p');

    // Set default prev/next item indexes.
    this.prev = -1;
    this.next = 1;
  }

  watchItems() {
    this.list = this.querySelector('ol');
    this.items = this.list.querySelectorAll('li');
    this.total = this.items.length;

    const observer = new IntersectionObserver(this.update.bind(this), {
      root: this.list,
      rootMargin: '0px',
      threshold: .66,
    });
  
    for (const item of this.items) {
      observer.observe(item);
    }
  }

  /**
   * IntersectionObserver callback that updates controls.
   */
  update(entries) {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        return;
      }
      
      for (const [index, item] of this.items.entries()) {
        if (entry.target === item) {
          this.prev = (index > 0) ? index - 1 : -1;
          this.next = (index < this.total - 1) ? index + 1 : false;
          
          // Update elements.
          this.prevButton.disabled = this.prev < 0;
          this.nextButton.disabled = !this.next;
          this.count.textContent = `${index + 1}/${this.total}`;
        }
      }
    }
  }

  /**
   * Scrolls next or previous item into view on button click.
   */
  handleClick(event) {
    // Only accept clicks from buttons with a data-attribute.
    const path = event.composedPath();
    const direction = path[0].dataset.direction;
    if (!direction) {
      return;
    }

    let offset = 0;

    if (direction === 'prev') {
      const {width} = this.items[this.prev].getBoundingClientRect();
      offset = -width;
    }
    
    if (direction === 'next') {
      const {x} = this.items[this.next].getBoundingClientRect();
      offset = x;
    }
    
    this.list.scrollTo({
      top: 0,
      left: this.list.scrollLeft + offset,
      behavior: 'smooth',
    });
  }

  stylesTodo() {
    const styles = `
    .controls {
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
      background: rgba(0, 0, 0, .05);
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
    
    [data-direction='prev'] {
      grid-area: prev;
    }
    
    [data-direction='next'] {
      grid-area: next;
    }
    
    .count {
      grid-area: count;
      place-self: center;
    }
    `;
  }
}

customElements.define('fancy-list', FancyList);
