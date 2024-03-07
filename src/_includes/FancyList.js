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
    this.counter = document.createElement('span');
    this.prev = this.createButton('Prev');
    this.next = this.createButton('Next');

    controls.classList.add('controls');
    this.counter.classList.add('counter');

    for (const element of [this.counter, this.prev, this.next]) {
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
          this.counter.textContent = `${index + 1} of ${this.total}`;

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

      slot {
        grid-area: slot;
      }
      
      .controls {
        display: grid;
        font-weight: bold;
        gap: 0 1em;
        grid: '. prev counter next .' / 0 auto 1fr auto 0;
        grid-area: controls;
        place-content: center;
      }

      .counter {
        grid-area: counter;
        opacity: var(--text-opacity);
        place-self: center;
      }
      
      [data-direction='prev'] {
        grid-area: prev;
      }
      
      [data-direction='next'] {
        grid-area: next;
      }

      button {
        appearance: none;
        background-color: var(--link-background);
        block-size: var(--button-size);
        border: none;
        border-radius: var(--button-size);
        color: var(--link-color);
        cursor: pointer;
        font: inherit; /* TODO: remove */
        margin: 0;
        padding-inline: 1.25em; /* TODO: remove */
        transition: background-color var(--duration), color var(--duration), opacity var(--duration);

        &:is(:focus, :hover) {
          background-color: var(--link-color);
          color: var(--background-0);
        }

        &[disabled] {
          opacity: 0;
        }
      }
    `);
    this.shadowRoot.adoptedStyleSheets = [styles];
  }
}

customElements.define('fancy-list', FancyList);

