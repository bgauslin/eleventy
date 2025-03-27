/**
 * Carousel web component that reflects slides in a shadow DOM slot and adds
 * buttons and a counter.
 */
class Carousel extends HTMLElement {
  constructor() {
    super();
    this.buttons = [
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
  }

  connectedCallback() {
    this.setup();
    this.setupShadowDOM();
    this.shadowStyles();
    this.scrollToHash();
    this.watch();
    this.addEventListener('click', this.handleClick);
    document.addEventListener('keypress', this.handleKey);
  }

  disconnectedCallback() {
    this.observer.disconnect();
    this.removeEventListener('click', this.handleClick);
    document.removeEventListener('keypress', this.handleKey);
  }

  /**
   * Sets light DOM references and initializes properties.
   */
  setup() {
    this.list = this.querySelector('ol');
    this.items = [...this.list.querySelectorAll('li')];

    this.total = this.items.length;
    this.url = new URL(window.location);

    this.prev = -1;
    this.current = 0;
    this.next = 1;
  }
  
  /**
   * Creates a slot, counter, and prev-next buttons.
   */
  setupShadowDOM() {
    this.attachShadow({mode: 'open'});

    this.shadowRoot.innerHTML += `
      <slot></slot>

      ${this.createButton('prev')}

      <button class="opener">
        <span class="counter"></span>
      </button>

      ${this.createButton('next')}

      <dialog>
        <button class="closer"></button>
      </dialog>
    `;
    
    this.closer = this.shadowRoot.querySelector('.closer');
    this.counter = this.shadowRoot.querySelector('.counter');
    this.dialog =  this.shadowRoot.querySelector('dialog');
    this.nextButton = this.shadowRoot.querySelector('[data-direction="next"]');
    this.opener = this.shadowRoot.querySelector('.opener');
    this.prevButton = this.shadowRoot.querySelector('[data-direction="prev"]');
  }

  /**
   * Helper function for rendering prev-next buttons.
   * @param {string} direction - 'prev' or 'next'
   * @returns {HTMLButtonElement}
   */
  createButton(direction) {
    const {label, path} = this.buttons.find(button => button.direction === direction);

    return `
      <button
        aria-label="${label}"
        data-direction="${direction}"
        disabled
        title="${label}"
        type="button">
        <svg aria-hidden="true" viewbox="0 0 24 24"><path d="${path}"/></svg>
      </button>
    `;
  }

  /**
   * Sets up Intersection Observer to watch all list items and set the
   * current item for updating controls and URL hash.
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
   * IntersectionObserver callback that updates the controls and URL based on
   * current item.
   * @param {IntersectionObserverEntry[]} entries - observed items
   */
  update(entries) {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        return;
      }
      
      const item = this.items.find(item => item.id === entry.target.id);
      this.current = this.items.indexOf(item);

      // Update address bar and DOM.
      this.url.hash = item.id;
      history.replaceState(null, '', this.url.href);
      this.updateElements();
    }
  }

  /**
   * Updates controls, preloads next slide's images, and disables tabbable
   * elements based on current item.
   */
  updateElements() {
    // Update counter.
    this.counter.textContent = `${this.current + 1} of ${this.total}`;

    // Update prev/next indexes.
    this.prev = (this.current > 0) ? this.current - 1 : -1;
    this.next = (this.current < this.total - 1) ? this.current + 1 : false;

    // Update prev-next buttons state.
    this.prevButton.disabled = this.prev < 0;
    this.nextButton.disabled = !this.next;

    // Update prev button attributes.
    if (this.prev >= 0) {
      const prevTitle = this.items[this.prev].querySelector('h2').textContent;
      this.prevButton.ariaLabel = `Previous slide: ${prevTitle}`;
      this.prevButton.title = prevTitle;
    }

    // Update next button attributes and preload next item's images.
    if (this.next) {
      const nextItem = this.items[this.next];

      const nextTitle = nextItem.querySelector('h2').textContent;
      this.nextButton.ariaLabel = `Next slide: ${nextTitle}`;
      this.nextButton.title = nextTitle;

      const images = nextItem.querySelectorAll('img');
      this.preloadImages(images);
    }

    // Disable tabbable links outside of the viewport; only enable links
    // for current item in viewport.
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
   * Smooth scrolls item into view based on direction.
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
   * Scrolls to individual item if there's a valid hash in the URL on page load.
   */
  scrollToHash() {
    const anchor = this.url.hash.replace('#', '');
    if (!anchor) {
      return;
    }

    const item = this.items.find(item => item.id === anchor);
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
   * Smooth scrolls next or previous item into view on button click and only
   * accepts clicks from buttons with valid data-attribute.
   * @param {Event} event
   */
  handleClick(event) {
    const target = event.composedPath()[0];

    const isOpener = target.className === 'opener';
    if (isOpener) {
      this.dialog.showModal();
      return;
    }

    const isCloser = target.className === 'closer';
    if (isCloser) {
      this.dialog.close();
      return;
    }

    const direction = target.dataset.direction;
    if (direction) {
      this.scrollToItem(direction);
    }
  }

  /**
   * Smooth scrolls item into view with left and right arrows for improved a11y.
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
   * Renders encapsulated styles into the shadow DOM.
   */
  shadowStyles() {
    const styles = new CSSStyleSheet();
    styles.replaceSync(`
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
      
      :is(button, .counter) {
        block-size: var(--button-size);
        border-radius: var(--button-size);
        z-index: 2;
      }

      button {
        appearance: none;
        background-color: var(--fill-2);
        border: none;
        color: var(--text-color);
        cursor: pointer;
        outline: none;
        place-self: center;
        transition: background-color var(--transition), color var(--transition), opacity var(--transition), transform var(--transition);
      }
      
      button:focus-visible {
        background-color: var(--text-color);
        color: var(--fill-0);
      }

      @media (any-hover: hover) {
        button:hover {
          background-color: var(--text-color);
          color: var(--fill-0);
        }
        
        button:active {
          transform: scale(.8);
        }
      }

      button.touch {
        transform: scale(.8);
      }

      button[disabled] {
        opacity: 0;
        pointer-events: none;
      }

      button[data-direction] {
        aspect-ratio: 1;
        display: grid;
        grid: 1fr / 1fr;
        place-items: center;
      }

      button[data-direction='prev'] {
        grid-area: var(--prev-grid-area);
      }
      
      button[data-direction='next'] {
        grid-area: var(--next-grid-area);
      }

      button svg {
        block-size: 24px;
        fill: none;
        pointer-events: none;
        stroke: currentColor;
        stroke-width: 3px;
      }

      .opener {
        grid-area: var(--counter-grid-area);
        padding-inline: 1em;
      }

      .counter {
        opacity: var(--text-opacity);
        pointer-events: none;
      }
    `);
    this.shadowRoot.adoptedStyleSheets = [styles];
  }
}

customElements.define('slideshow-carousel', Carousel);

