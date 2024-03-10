const BUTTON_INFO = [
  {
    direction: 'prev',
    label: 'Previous',
    path: 'M15,4 L7,12 L15,20',
  },
  {
    direction: 'next',
    label: 'Next',
    path: 'M9,4 L17,12 L9,20',
  },
];

class Carousel extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.setup();
    this.setupShadowDOM();
    this.shadowStyles();
    this.scrollToHash();
    this.watch();
    this.addEventListener('click', this.handleClick);
    this.addEventListener('keypress', this.handleKey);
  }

  disconnectedCallback() {
    this.observer.disconnect();
    this.removeEventListener('click', this.handleClick);
    this.removeEventListener('keypress', this.handleKey);
  }

  /**
   * Sets light DOM references and initializes properties.
   */
  setup() {
    this.list = this.querySelector('ol');
    this.items = this.list.querySelectorAll('li');

    this.total = this.items.length;
    this.indexPrev = -1;
    this.indexNext = 1;
    this.url = new URL(window.location);
  }
  
  /**
   * Creates a slot, prev-next buttons, and a counter.
   */
  setupShadowDOM() {
    this.attachShadow({mode: 'open'});

    const slot = document.createElement('slot');
    this.counter = document.createElement('div');
    this.counter.classList.add('counter');
    this.prev = this.createButton('prev');
    this.next = this.createButton('next');

    for (const element of [slot, this.counter, this.prev, this.next]) {
      this.shadowRoot.appendChild(element);
    }
  }

  /**
   * Helper function for rendering prev-next buttons.
   * @param {string} direction - 'prev' or 'next'
   * @returns {HTMLButtonElement}
   */
  createButton(direction) {
    const button = document.createElement('button');
    const {label, path} = BUTTON_INFO.find(button => button.direction === direction);

    button.ariaLabel = label;
    button.title = label;
    button.dataset.direction = direction;
    
    button.innerHTML = `
      <svg aria-hidden="true" viewbox="0 0 24 24">
        <path d="${path}"/>
      </svg>
    `;
    
    return button;
  }

  /**
   * Sets up Intersection Observer to watch list items.
   */
  watch() {
    this.observer = new IntersectionObserver(this.update.bind(this), {
      root: this.list,
      rootMargin: '0px',
      threshold: .66,
    });

    for (const item of this.items) {
      this.observer.observe(item);
    }
  }

  /**
   * IntersectionObserver callback that updates the controls and URL.
   * @param {IntersectionObserverEntry[]} entries - observed items
   */
  update(entries) {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        return;
      }
      
      const item = [...this.items].find(item => item === entry.target);
      const index = [...this.items].indexOf(item);

      // Update address bar and DOM.
      this.url.hash = item.id;
      history.replaceState(null, '', this.url.href);
      this.updateElements(index);
    }
  }

  /**
   * Updates controls and preloads next slide's images based on current item.
   * @param {number} indexCurrent - current item
   */
  updateElements(indexCurrent) {
    this.indexPrev = (indexCurrent > 0) ? indexCurrent - 1 : -1;
    this.indexNext = (indexCurrent < this.total - 1) ? indexCurrent + 1 : false;
    
    // Update controls.
    this.prev.disabled = this.indexPrev < 0;
    this.next.disabled = !this.indexNext;
    this.counter.textContent = `${indexCurrent + 1} of ${this.total}`;

    // Load current item's images in case there's a hash in the URL on load.
    const imagesCurrent = this.items[indexCurrent].querySelectorAll('img');
    for (const image of imagesCurrent) {
      image.setAttribute('loading', 'eager');
    }

    // Preload next item's images.
    if (this.indexNext) {
      const imagesNext = this.items[this.indexNext].querySelectorAll('img');    
      for (const image of imagesNext) {
        image.setAttribute('loading', 'eager');
      }
    }
    
    // Disable tabbable links outside of the viewport; only enable those that
    // are visible.
    for (const [index, item] of this.items.entries()) {
      let links = item.querySelectorAll('a');
      for (const link of links) {
        if (index === indexCurrent) {
          link.removeAttribute('tabindex');
        } else {
          link.setAttribute('tabindex', '-1');
        }
      }
    }
  }

  /**
   * Scrolls item into view based on scroll direction.
   * @param {string} direction - 'prev' or 'next'
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
   * Scrolls to individual item by ID if there's a hash in the URL on load.
   */
  scrollToHash() {
    const anchor = this.url.hash.replace('#', '');
    if (anchor) {
      const item = [...this.items].find(item => item.id === anchor);
      const index = [...this.items].indexOf(item);
      const {left} = item.getBoundingClientRect();
      
      this.list.scrollTo(left, 0);
      this.updateElements(index);
    }
  }

  /**
   * Scrolls next or previous item into view on button click and only accepts
   * clicks from buttons with a data-attribute.
   * @param {Event} event
   */
  handleClick(event) {
    const path = event.composedPath();
    const direction = path[0].dataset.direction;
    if (direction) {
      this.scrollToItem(direction);
    }
  }

  /**
   * Scrolls item into view with left and right arrows for better a11y.
   * @param {KeyboardEvent} event
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
        --counter-grid-area: 2 / 3 / 2 / 4;
        --grid: 1fr var(--button-size) 0 / 0 var(--button-size) 1fr var(--button-size) 0;
        --next-grid-area: 2 / 4 / 2 / 5;
        --prev-grid-area: 2 / 2 / 2 / 3;
        --slot-grid-area: 1 / 1 / 2 / -1;
      }

      @media (orientation: landscape) {
        :host {
          --counter-grid-area: 1 / 4 / 1 / 5;
          --grid: 1fr / 0 var(--button-size) 2fr 1fr var(--button-size) 0;
          --next-grid-area: 1 / 5 / 1 / 6;
          --prev-grid-area: 1 / 2 / 1 / 3;
          --slot-grid-area: 1 / 1 / -1 / -1;
        }
      }

      :host {
        block-size: 100dvh;
        display: grid;
        gap: var(--gap);
        grid: var(--grid);
        inline-size: 100vw;
        place-content: center;
      }

      ::slotted(ol) {
        grid-area: var(--slot-grid-area);
        z-index: 1;
      }
      
      :is(.counter, button) {
        block-size: var(--button-size);
      }

      .counter {
        display: grid;
        font-size: var(--font-size-small);
        grid-area: var(--counter-grid-area);
        padding-inline: var(--gap);
        place-content: center;
        place-self: end center;
        z-index: 3;
      }
      
      [data-direction='prev'] {
        grid-area: var(--prev-grid-area);
      }
      
      [data-direction='next'] {
        grid-area: var(--next-grid-area);
      }

      button {
        appearance: none;
        aspect-ratio: 1;
        background-color: var(--background-1);
        border: none;
        border-radius: var(--button-size);
        box-shadow: var(--shadow-1);
        color: var(--text-color);
        cursor: pointer;
        display: grid;
        grid: 1fr / 1fr;
        margin: 0;
        outline: none;
        place-items: center;
        place-self: center;
        transition: background-color var(--duration), color var(--duration), opacity var(--duration), transform var(--duration);
        z-index: 2;
      }
      
      button:is(:focus, :hover) {
        background-color: var(--text-color);
        color: var(--background-0);
      }

      button:active {
        transform: scale(.8);
      }

      button[disabled] {
        opacity: 0;
      }

      svg {
        block-size: var(--icon-size);
        fill: none;
        pointer-events: none;
        stroke: currentColor;
        stroke-width: 3px;
      }
    `);
    this.shadowRoot.adoptedStyleSheets = [styles];
  }
}

customElements.define('carousel-widget', Carousel);

