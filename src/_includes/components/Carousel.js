const BUTTONS = [
  {
    direction: 'prev',
    label: 'Previous slide',
    path: 'M15,4 L7,12 L15,20',
  },
  {
    direction: 'next',
    label: 'Next slide',
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
    this.url = new URL(window.location);

    this.prev = -1;
    this.current = 0;
    this.next = 1;
  }
  
  /**
   * Creates a slot, prev-next buttons, and a counter.
   */
  setupShadowDOM() {
    this.attachShadow({mode: 'open'});

    const slot = document.createElement('slot');
    this.counter = document.createElement('div');
    this.counter.classList.add('counter');
    this.prevButton = this.createButton('prev');
    this.nextButton = this.createButton('next');

    for (const element of [slot, this.counter, this.prevButton, this.nextButton]) {
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
    const {label, path} = BUTTONS.find(button => button.direction === direction);

    button.ariaLabel = label;
    button.dataset.direction = direction;
    button.title = label;
    button.type = 'button';
    
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
      
      const item = [...this.items].find(item => item.id === entry.target.id);
      this.current = [...this.items].indexOf(item);

      // Update address bar and DOM.
      this.url.hash = item.id;
      history.replaceState(null, '', this.url.href);
      this.updateElements();
    }
  }

  /**
   * Updates controls and preloads next slide's images based on current item.
   */
  updateElements() {
    this.prev = (this.current > 0) ? this.current - 1 : -1;
    this.next = (this.current < this.total - 1) ? this.current + 1 : false;
    
    // Update controls.
    this.prevButton.disabled = this.prev < 0;
    this.nextButton.disabled = !this.next;
    this.counter.textContent = `${this.current + 1} of ${this.total}`;

    // Preload next item's images.
    if (this.next) {
      const images = this.items[this.next].querySelectorAll('img');    
      this.preloadImages(images);
    }
    
    // Disable tabbable links outside of the viewport; only enable links
    // that are visible.
    for (const [index, item] of this.items.entries()) {
      for (const link of [...item.querySelectorAll('a')]) {
        if (index === this.current) {
          link.removeAttribute('tabindex');
        } else {
          link.tabIndex = '-1';
        }
      }
    }
  }

  /**
   * Preloads images by changing their 'loading' attribute.
   * @param {HTMLImageElement[]} images  
   */
  preloadImages(images) {
    for (const image of images) {
      image.setAttribute('loading', 'eager');
    }
  }

  /**
   * Scrolls item into view based on scroll direction.
   * @param {string} direction - 'prev' or 'next'
   */
  scrollToItem(direction) {
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

  /**
   * Scrolls to individual item by ID if there's a hash in the URL on load.
   */
  scrollToHash() {
    const anchor = this.url.hash.replace('#', '');
    if (!anchor) {
      return;
    }

    const item = [...this.items].find(item => item.id === anchor);
    if (!item) {
      return;
    }
    const {left} = item.getBoundingClientRect();
    const images = item.querySelectorAll('img');
    
    this.current = [...this.items].indexOf(item);
    this.list.scrollTo(left, 0);
    this.preloadImages(images);
    this.updateElements();
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
        --grid: 1fr var(--button-size) 0 / 0 var(--button-size) 1fr var(--button-size) 0;
        --prev-grid-area: 2 / 2 / 2 / 3;
        --next-grid-area: 2 / -2 / 2 / -3;
        --counter-grid-area: 2 / 3 / 2 / -3;
        --counter-place-self: end center;
      }

      @media (orientation: landscape) {
        :host {
          --grid: 1fr var(--button-size) 0 / 0 var(--button-size) 2fr 3fr var(--button-size) 0;
          --prev-grid-area: 1 / 2 / -1 / 3;
          --next-grid-area: 1 / -2 / -1 / -3;
          --counter-grid-area: 2 / 3 / 2 / 4;
          --counter-place-self: end start;
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
        grid-area: 1 / 1 / -1 / -1;
        z-index: 1;
      }
      
      :is(.counter, button) {
        -webkit-backdrop-filter: blur(6px);
        backdrop-filter: blur(6px);
        block-size: var(--button-size);
        border-radius: var(--button-size);
        z-index: 2;
      }

      .counter {
        display: grid;
        font-size: var(--font-size-small);
        grid-area: var(--counter-grid-area);
        margin-inline: -1em;
        opacity: var(--text-opacity);
        padding-inline: 1em;
        place-content: center;
        place-self: var(--counter-place-self);
      }
      
      button {
        appearance: none;
        background-color: var(--button-background);
        border: none;
        box-shadow: var(--shadow-1);
        color: var(--text-color);
        cursor: pointer;
        outline: none;
        place-self: center;
        transition: background-color var(--duration), color var(--duration), opacity var(--duration), transform var(--duration);
      }
      
      button:focus,
      button:hover {
        background-color: var(--text-color);
        color: var(--background-0);
      }

      button:active {
        transform: scale(.8);
      }

      button[disabled] {
        opacity: 0;
      }

      [data-direction] {
        aspect-ratio: 1;
        display: grid;
        grid: 1fr / 1fr;
        place-items: center;
      }

      [data-direction='prev'] {
        grid-area: var(--prev-grid-area);
      }
      
      [data-direction='next'] {
        grid-area: var(--next-grid-area);
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

