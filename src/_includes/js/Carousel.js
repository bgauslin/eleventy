class Carousel extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.setup();
    this.setupShadowDOM();
    this.shadowStyles();
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
   * Initializes properties and light DOM references.
   */
  setup() {
    this.list = this.querySelector('ol');
    this.items = this.list.querySelectorAll('li');

    this.total = this.items.length;
    this.indexPrev = -1;
    this.indexNext = 1;
  }
  
  /**
   * Creates prev-next controls and a count label in the shadow DOM.
   */
  setupShadowDOM() {
    this.attachShadow({mode: 'open'});

    const slot = document.createElement('slot');
    this.counter = document.createElement('div');
    this.prev = this.createButton('prev');
    this.next = this.createButton('next');

    this.counter.classList.add('counter');

    for (const element of [slot, this.counter, this.prev, this.next]) {
      this.shadowRoot.appendChild(element);
    }
  }

  /**
   * Helper function for rendering prev-next buttons.
   */
  createButton(direction) {
    let label = 'Next';
    let path = 'M9,4 L17,12 L9,20';

    if (direction === 'prev') {
      label = 'Previous';
      path = 'M15,4 L7,12 L15,20';
    }

    const button = document.createElement('button');
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
          if (this.indexNext) {
            const images = this.items[this.indexNext].querySelectorAll('img');
            for (const image of images) {
              image.setAttribute('loading', 'eager');
            }
          }
          
          // TODO: Update address bar.
          const url = new URL();
          url.hash = item.id;
          console.log(url.href);
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
   * Renders encapsulated styles for shadow DOM.
   */
  shadowStyles() {
    const styles = new CSSStyleSheet();
    styles.replaceSync(`
      :host {
        --gap: 1em;
        --grid: 1fr var(--button-size) 0 / 0 var(--button-size) 1fr var(--button-size) 0;
        --slot-grid-area: 1 / 1 / 2 / -1;
        --counter-grid-area: 2 / 3 / 2 / 4;
        --prev-grid-area: 2 / 2 / 2 / 3;
        --next-grid-area: 2 / 4 / 2 / 5;
      }

      @media (orientation: landscape) {
        :host {
          --grid: 1fr / 0 var(--button-size) 2fr 1fr var(--button-size) 0;
          --slot-grid-area: 1 / 1 / -1 / -1;
          --counter-grid-area: 1 / 4 / 1 / 5;
          --prev-grid-area: 1 / 2 / 1 / 3;
          --next-grid-area: 1 / 5 / 1 / 6;
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
      }
      
      .counter {
        block-size: var(--button-size);
        font-size: var(--font-size-small);
        display: grid;
        grid-area: var(--counter-grid-area);
        opacity: var(--text-opacity);
        place-content: center;
        place-self: end center;
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
        block-size: var(--button-size);
        border: none;
        border-radius: var(--button-size);
        box-shadow: var(--shadow-1);
        color: var(--text-color);
        cursor: pointer;
        display: grid;
        grid: 1fr / 1fr;
        margin: 0;
        place-items: center;
        place-self: center;
        transition: background-color var(--duration), color var(--duration), opacity var(--duration), transform var(--duration);

        &:is(:focus, :hover) {
          background-color: var(--text-color);
          color: var(--background-0);
        }

        &:active {
          transform: scale(.8);
        }

        &[disabled] {
          opacity: 0;
        }
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

