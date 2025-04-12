/**
 * Carousel widget that reflects slides in a shadow DOM <slot> and adds
 * previous/next <button> elements along with an 'X/Y' <button> that
 * opens a <dialog> populated with thumbnail images.
 */
class Carousel extends HTMLElement {
  constructor() {
    super();
    this.clickListener = this.handleClick.bind(this);
    this.keyListener = this.handleKey.bind(this);
  }

  connectedCallback() {
    this.setup();
    this.shadowStyles();
    this.jumpToHash();
    this.setImageFit();
    this.watch();
    document.addEventListener('click', this.clickListener);
    document.addEventListener('keydown', this.keyListener);
  }

  disconnectedCallback() {
    this.observer.disconnect();
    document.removeEventListener('click', this.clickListener);
    document.removeEventListener('keydown', this.keyListener);
  }

  /**
   * Sets light DOM references, initializes properties, populates shadow DOM.
   */
  setup() {
    // Navigation state.
    this.prev = -1;
    this.current = 0;
    this.next = 1;

    // Dialog state.
    this.open = false;

    // Light DOM element references.
    this.list = this.querySelector('ol');
    this.items = [...this.list.querySelectorAll('li')];
    this.total = this.items.length;

    // Buttons and their attributes.
    this.buttons = [
      {type: 'closer', label: 'Return to slideshow', path: 'M7,7 L17,17 M7,17 L17,7'},
      {type: 'next', label: 'Next slide', path: 'M9,4 L17,12 L9,20'},
      {type: 'opener', label: 'View thumbnail images', path: null},
      {type: 'prev', label: 'Previous slide', path: 'M15,4 L7,12 L15,20'},
    ];

    // Project name for browser history updates.
    this.baseTitle = document.title;

    // Shadow DOM.
    this.attachShadow({mode: 'open'});

    this.shadowRoot.innerHTML = `
      <slot></slot>
      ${this.renderButton('prev')}
      ${this.renderButton('next')}
      ${this.renderButton('opener')}
      <dialog inert>
        <h3 class="toggle"></h3>
        ${this.renderButton('closer')}
        ${this.renderThumbnails()}
      </dialog>
    `;

    // Shadow DOM element references.
    this.closer = this.shadowRoot.querySelector('.closer');
    this.counter = this.shadowRoot.querySelector('.counter');
    this.dialog =  this.shadowRoot.querySelector('dialog');
    this.heading =  this.shadowRoot.querySelector('h3');
    this.nextButton = this.shadowRoot.querySelector('.next');
    this.opener = this.shadowRoot.querySelector('.opener');
    this.prevButton = this.shadowRoot.querySelector('.prev');
  }

  /**
   * Helper function for rendering prev-next buttons.
   * @param {string} type
   * @returns {string}
   */
  renderButton(type) {
    const {label, path} = this.buttons.find(button => button.type === type);
    let content = `<svg aria-hidden="true" viewbox="0 0 24 24"><path d="${path}"/></svg>`;
    if (type === 'opener') {
      content = '<span class="counter"></span>';
    }

    return `<button aria-label="${label}" class="${type}" title="${label}" type="button">${content}</button>`;
  }

  /**
   * Helper function for rendering thumbnail images.
   * @returns {string}
   */
  renderThumbnails() {
    let html = '<ol>';
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
      if (!entry.isIntersecting) return;

      // Set index of current slide.
      const item = this.items.find(item => item.id === entry.target.id);
      this.current = this.items.indexOf(item);

      // Update address bar.
      const url = new URL(window.location);
      url.hash = item.id;
      history.replaceState(null, '', url.href);

      // Update browser history.
      const heading = item.querySelector('h2');
      document.title = `${heading.textContent} · ${this.baseTitle}`;

      // Update shadow DOM.
      this.updateElements();
    }
  }

  /**
   * One Listener to Handle Them All. For better performance and simpler a11y,
   * and because we have a mix of light and shadow DOM, all clicks on buttons,
   * links, whatever are routed through here for better UX control.
   * @param {Event} event
   */
  handleClick(event) {
    const path = event.composedPath();
    
    // Close the <dialog> if it's open and click is outside of it.
    if (this.open && !path.includes(this.dialog)) {
      this.toggleDialog();
      return;
    }

    // Otherwise, update UI based on click target.
    const target = path[0];
    const type = target.className;
    switch (type) {
      case 'toggle':
        this.setImageFit();
        break;
      case 'closer':
      case 'opener':      
        this.toggleDialog();
        break;
      case 'next':
      case 'prev':
        this.scrollToSlide(type);
        break;
      case 'thumb':
        event.preventDefault();
        const url = new URL(target.href);
        history.replaceState(null, '', url);
        this.jumpToSlide(url.hash);
        this.toggleDialog();
        break;
      default:
        break;
    }
  }

  /**
   * Toggles between two values for setting CSS 'object-fit' via data-attribute.
   */
  setImageFit() {
    let fit = 'contain';
    let label = 'Aspect Ratio Grid';
    if (this.dialog.dataset.fit === 'contain') {
      fit = 'cover';
      label = 'Square Grid';
    }
    this.dialog.dataset.fit = fit;
    this.heading.textContent = label;
  }

  /**
   * Opens/closes <dialog> with CSS transitions.
   */  
  toggleDialog() {
    if (this.open) {
      this.dialog.setAttribute('inert', '');
      this.dialog.addEventListener('transitionend', () => {
        this.dialog.close();
        this.open = false;
      }, {once: true});
    } else {
      this.dialog.removeAttribute('inert');
      this.dialog.show();
      this.open = true;
    }
  }

  /**
   * Scrolls to a slide on page load if there's a valid hash in the URL.
   */
  jumpToHash() {
    const url = new URL(window.location);
    if (url.hash) {
      this.jumpToSlide(url.hash);
    }
  }

  /**
   * Scrolls to slide from a clicked thumbnail image.
   * @param {string} hash - URL hash
   */
  jumpToSlide(hash) {
    const id = hash.replace('#', '');
    const item = this.items.find(item => item.id === id);

    if (!item) return;

    // Reset current index.
    this.current = [...this.items].indexOf(item);

    // Scroll the current slide into view.
    const {left} = item.getBoundingClientRect();
    const position = (this.list.scrollLeft + left);
    
    this.list.scrollTo({
      top: 0,
      left: position,
      behavior: 'instant',
    });

    // Load neighboring images.
    const images = item.querySelectorAll('img');
    this.preloadImages(images);

    // Update shadow DOM.
    this.updateElements();
  }

  /**
   * Smooth scrolls item into view based on direction.
   * @param {string} direction - 'prev' or 'next'
   */
  scrollToSlide(direction) {
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
   * Keyboard controls for a11y and better UX.
   * @param {KeyboardEvent} event
   */
  handleKey(event) {
    if (event.code === 'ArrowLeft') {
      this.scrollToSlide('prev');
    }

    if (event.code === 'ArrowRight') {
      this.scrollToSlide('next');
    }

    if (event.code === 'Escape' && this.open) {
      this.toggleDialog();
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

      :host:has(dialog[open]) slot {
        pointer-events: none;
      }

      ::slotted(ol) {
        grid-area: 1 / 1 / -1 / -1;
        z-index: 1;
      }

      * {
        box-sizing: border-box;
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
        padding: 0;
        place-self: center;
        transition: background-color var(--transition), color var(--transition), opacity var(--transition), transform var(--transition);
        white-space: nowrap;
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
        block-size: var(--button-icon-size);
        fill: none;
        pointer-events: none;
        stroke: currentColor;
        stroke-width: var(--button-stroke-width, 3px);
      }

      .opener {
        font-size: var(--font-size-small);
        font-variation-settings: 'wght' 600;
        grid-area: var(--counter-grid-area);
        padding-inline: 1.25rem;
      }

      .counter {
        pointer-events: none; /* For better event targeting. */
      }

      dialog {
        --gap: 1rem;

        background-color: var(--fill-2);
        block-size: auto;
        border: none;
        color: var(--text-color);
        display: grid;
        gap: var(--gap);
        grid: auto 1fr / 1fr auto;
        inline-size: 100%;
        inset-block: auto 0;
        inset-inline: 0;
        max-block-size: 100dvh;
        outline: none;
        padding-block: var(--gap) 0;
        padding-inline: var(--gap);
        position: fixed;
        transition: transform var(--transition);
        z-index: 3;
      }

      dialog[inert] {
        transform: translateY(100%);
      }

      :where(h3, ol) {
        padding-inline: .75rem;
      }

      h3 {
        cursor: pointer;
        font-size: var(--font-size-small);
        grid-area: 1 / 1;
        margin: 0;
        max-inline-size: 100%;
        overflow: hidden;
        padding: 0;
        place-self: center start;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .closer {
        --button-size: var(--button-icon-size);
        --button-stroke-width: 2px;

        grid-area: 1 / 2;
      }

      ol {
        block-size: 100%;
        display: grid;
        gap: .125rem;
        grid: auto-flow / repeat(auto-fill, minmax(6rem, 1fr));
        grid-area: 2 / 1 / 2 / -1;
        list-style: none;
        margin: 0;
        overflow: auto;
        padding-block: 0 var(--gap);
        padding-inline: 0;
        place-self: start stretch;
        scrollbar-width: none;

        &::-webkit-scrollbar {
          display: none;
        }
      }

      a {
        background-color: var(--fill-1);
        display: block;
        outline: none;
      }

      a:focus-visible img {
        transform: scale(.9);
      }

      @media (any-hover: hover) {
        a:hover img {
          transform: scale(.9);
        }
      }

      img {
        aspect-ratio: 1;
        inline-size: 100%;
        pointer-events: none; /* For better event targeting. */
        transition: transform var(--transition);
        vertical-align: middle;
      }

      [data-fit='contain'] img {
        object-fit: contain;
      }

      [data-fit='cover'] img {
        object-fit: cover;
      }
    `);
    this.shadowRoot.adoptedStyleSheets = [styles];
  }
}

customElements.define('slideshow-carousel', Carousel);

