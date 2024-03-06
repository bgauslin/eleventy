class FancyList extends HTMLElement {
  constructor() {
    super();
    this.indexPrev = -1;
    this.indexNext = 1;
  }

  connectedCallback() {
    this.setupShadowDOM();
    this.shadowStyles();
    this.watchItems();
    this.addEventListener('click', this.handleClick);
    this.addEventListener('keypress', this.handleKey);
  }

  disconnectedCallback() {
    this.observer.disconnect();
    this.removeEventListener('click', this.handleClick);
    this.removeEventListener('keypress', this.handleKey);
  }

  /**
   * Creates prev-next controls and a count label in the shadow DOM.
   */
  setupShadowDOM() {
    this.attachShadow({mode: 'open'});

    // Attach the default slot.
    const slot = document.createElement('slot');
    this.shadowRoot.appendChild(slot);

    // Build and attach the controls.
    const controls = document.createElement('div');
    this.count = document.createElement('div');
    this.prev = this.createButton('Prev');
    this.next = this.createButton('Next');

    controls.dataset.controls = '';
    this.count.dataset.count = '';

    for (const element of [this.count, this.prev, this.next]) {
      controls.appendChild(element);
    }

    this.shadowRoot.appendChild(controls);
  }

  /**
   * Helper function for rendering prev-next buttons.
   */
  createButton(direction) {
    const button = document.createElement('button');
    button.dataset.direction = direction.toLowerCase();
    button.textContent = direction;
    return button;
  }

  /**
   * Sets up Intersection Observer to watch list items.
   */
  watchItems() {
    this.list = this.querySelector('ol');
    this.items = this.list.querySelectorAll('li');

    this.observer = new IntersectionObserver(this.update.bind(this), {
      root: this.list,
      rootMargin: '0px',
      threshold: .66,
    });
  
    for (const item of this.items) {
      this.observer.observe(item);
    }
    
    // Set total for the count.
    this.total = this.items.length;
  }

  /**
   * IntersectionObserver callback that updates the controls.
   */
  update(entries) {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        return;
      }
      
      for (const [index, item] of this.items.entries()) {
        if (entry.target === item) {
          this.indexPrev = (index > 0) ? index - 1 : -1;
          this.indexNext = (index < this.total - 1) ? index + 1 : false;
          
          // Update elements.
          this.prev.disabled = this.indexPrev < 0;
          this.next.disabled = !this.indexNext;
          this.count.textContent = `${index + 1} of ${this.total}`;

          // Preload next item's images.
          const images = this.items[this.indexNext].querySelectorAll('img');
          for (const image of images) {
            image.setAttribute('loading', 'eager');
          }
        }
      }
    }
  }

  /**
   * Scrolls next or previous item into view on button click and only accepts
   * clicks from buttons with a data-attribute.
   */
  handleClick(event) {
    const path = event.composedPath();
    const direction = path[0].dataset.direction;
    if (direction) {
      this.scrollToItem(direction);
    }
  }

  /**
   * Scrolls item into view based on scroll direction.
   */
  scrollToItem(direction) {
    let offset = 0;

    if (direction === 'prev') {
      const {width} = this.items[this.indexPrev].getBoundingClientRect();
      offset = -width;
    }
    
    if (direction === 'next') {
      const {x} = this.items[this.indexNext].getBoundingClientRect();
      offset = x;
    }
    
    this.list.scrollTo({
      top: 0,
      left: this.list.scrollLeft + offset,
      behavior: 'smooth',
    });
  }

  /**
   * Scrolls item into view with left and right arrows for better a11y.
   */
  handleKey(event) {
    if (event.code === 'ArrowLeft') {
      this.scrollToItem('prev');
    }

    if (event.code === 'ArrowRight') {
      this.scrollToItem('next');
    }
  }

  /**
   * Renders encapsulated styles for shadow DOM.
   */
  shadowStyles() {
    const styles = new CSSStyleSheet();
    styles.replaceSync(`
      :host {
        display: grid;
        grid: 'slot' 1fr 'controls' var(--controls-size) / 1fr;
        inline-size: 100vw;
      }

      slot { grid-area: slot }
      [data-controls] { grid-area: controls }
      
      [data-controls] {
        display: grid;
        gap: 0 1em;
        grid: '. prev count next .' / 0 auto 1fr auto 0;
        place-content: center;
      }

      [data-count] {
        font-weight: bold;
        grid-area: count;
        opacity: .75;
        place-self: center;
      }
      
      [data-direction='prev'] { grid-area: prev }
      [data-direction='next'] { grid-area: next }

      button {
        appearance: none;
        background-color: var(--link-background);
        border: none;
        border-radius: 3em;
        color: inherit;color: var(--link-color);
        cursor: pointer;
        font: inherit;
        font-weight: bold;
        inline-size: fit-content;
        margin: 0;
        padding: .5em 1.25em;
        transition: background-color .3s, color .3s, opacity .3s;
      }

      button:is(:focus, :hover) {
        background-color: var(--link-color);
        color: var(--background-0);
      }

      button[disabled] { opacity: 0 }
    `);
    this.shadowRoot.adoptedStyleSheets = [styles];
  }
}

customElements.define('fancy-list', FancyList);

