/**
 * Carousel web component that reflects slides in a shadow DOM slot and adds
 * buttons and a counter.
 */
class Carousel extends HTMLElement {
  constructor() {
    super();

    this.buttons = [
      {
        type: 'closer',
        label: 'Return to slideshow',
        path: 'M5,5 L19,19 M5,19 L19,5',
      },
      {
        type: 'opener',
        label: 'View thumbnail images',
        path: null,
      },
      {
        type: 'prev',
        label: 'Previous slide',
        path: 'M15,4 L7,12 L15,20',
      },
      {
        type: 'next',
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

    this.prev = -1;
    this.current = 0;
    this.next = 1;
  }
  
  /**
   * Creates a slot, counter, and prev-next buttons.
   */
  setupShadowDOM() {
    this.attachShadow({mode: 'open'});

    this.shadowRoot.innerHTML = `
      <slot></slot>

      ${this.createButton('prev')}
      ${this.createButton('next')}

      ${this.createButton('opener')}
      <dialog>
        <h3>${document.title}</h3>
        ${this.createButton('closer')}
        ${this.createThumbnails()}
      </dialog>
    `;
    
    this.closer = this.shadowRoot.querySelector('.closer');
    this.counter = this.shadowRoot.querySelector('.counter');
    this.dialog =  this.shadowRoot.querySelector('dialog');
    this.nextButton = this.shadowRoot.querySelector('.next');
    this.opener = this.shadowRoot.querySelector('.opener');
    this.prevButton = this.shadowRoot.querySelector('.prev');
  }

  /**
   * Helper function for rendering prev-next buttons.
   * @param {string} type
   * @returns {HTMLButtonElement}
   */
  createButton(type) {
    const {label, path} = this.buttons.find(button => button.type === type);

    let content = `<svg aria-hidden="true" viewbox="0 0 24 24"><path d="${path}"/></svg>`;
    if (type === 'opener') {
      content = '<span class="counter"></span>';
    }

    return `<button aria-label="${label}" class="${type}" title="${label}" type="button">${content}</button>`;
  }

  createThumbnails() {
    let html = '<ol class="thumbs">';

    for (const [index, item] of this.items.entries()) {
      const heading = item.querySelector('h2');
      const title = heading.textContent;
      const image = item.querySelector('img');
      html += `
        <li>
          <a class="thumb" href="#${item.id}" title="${title}">
            <img src="${image.dataset.preview}" alt="">
          </a>
        </li>
      `;
    }
    html += '</ol>';

    return html;
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
      const url = new URL(window.location);
      url.hash = item.id;
      history.replaceState(null, '', url.href);
      this.updateElements();
    }
  }

  /**
   * Updates controls, preloads next slide's images, and disables tabbable
   * elements based on current item.
   */
  updateElements() {
    // Update counter.
    this.counter.textContent = `${this.current + 1} / ${this.total}`;

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
    const url = new URL(window.location);

    const anchor = url.hash.replace('#', '');
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

    if (['DIALOG', 'H3'].includes(target.tagName)) {
      return;
    }

    const type = target.className;
    switch (type) {
      case 'closer':
        this.dialog.close();
        break;
      case 'opener':
        this.dialog.showModal();
        break;
      case 'thumb':
        event.preventDefault();
        history.replaceState(null, '', target.href);
        this.dialog.close();
        this.scrollToHash();
        break;
      case 'prev':
      case 'next':
        this.scrollToItem(type);
        break;
      default:
        break;
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

      button {
        appearance: none;
        background-color: var(--fill-2);
        block-size: var(--button-size);
        border: none;
        border-radius: var(--button-size);
        color: var(--text-color);
        cursor: pointer;
        font: var(--font-size-small) / 1 inherit;
        outline: none;
        place-self: center;
        transition: background-color var(--transition), color var(--transition), opacity var(--transition), transform var(--transition);
        z-index: 2;
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

      button:where(.prev, .next, .closer) {
        aspect-ratio: 1;
        display: grid;
        grid: 1fr / 1fr;
        place-items: center;
      }

      .prev {
        grid-area: var(--prev-grid-area);
      }
      
      .next {
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
        padding-inline: 1rem;
      }

      .counter {
        opacity: var(--text-opacity);
        pointer-events: none;
      }

      dialog {
        background-color: var(--fill-2);
        border: none;
        border-radius: .5rem;
        color: var(--text-color);
        inline-size: 100%;
        max-block-size: min(30rem, 75dvh);
        max-inline-size: min(36rem, 80dvw);
        padding: .75rem;
      }

      dialog[open] {
        display: grid;
        gap: .5rem;
        grid: var(--button-size) 1fr / 1fr var(--button-size);
      }

      ::backdrop {
        backdrop-filter: blur(1px);
        background-color: rgba(0, 0, 0, .25);
      }
      
      h3 {
        grid-area: 1 / 1 / 1 / 1;
        line-height: 1.1;
        place-self: center start;
      }

      .closer {
        grid-area: 1 / 2 / 1 / 2;
      }

      ol {
        block-size: 100%;
        display: grid;
        gap: .25rem;
        grid: auto-flow / repeat(auto-fill, minmax(6rem, 1fr));
        grid-area: 2 / 1 / 2 / -1;
        list-style: none;
        margin-block: 0 1rem;
        overflow: auto;
        padding: 0;
        place-self: start stretch;
      }

      li {
        background-color: var(--fill-1);
      }
      
      a {
        aspect-ratio: 1;
        display: grid;
        overflow: hidden;
        place-content: center;
      }

      img {
        object-fit: cover;
      }
    `);
    this.shadowRoot.adoptedStyleSheets = [styles];
  }
}

customElements.define('slideshow-carousel', Carousel);

