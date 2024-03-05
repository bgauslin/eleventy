class FancyList extends HTMLElement {
  constructor() {
    super();
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

    const slot = document.createElement('slot');
    this.count = document.createElement('div');
    this.prevButton = this.createButton('Prev');
    this.nextButton = this.createButton('Next');

    this.shadowRoot.appendChild(slot);
    this.shadowRoot.appendChild(this.count);
    this.shadowRoot.appendChild(this.prevButton);
    this.shadowRoot.appendChild(this.nextButton);
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

    // Set total for the counter and starting prev/next values.
    this.total = this.items.length;
    this.prev = -1;
    this.next = 1;

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
   * Scrolls next or previous item into view on button click and only accepts
   * clicks from buttons with a data-attribute.
   */
  handleClick(event) {
    const path = event.composedPath();
    const direction = path[0].dataset.direction;
    if (!direction) {
      return;
    }
    this.scrollToItem(direction);
  }

  /**
   * Scrolls item into view based on scroll direction.
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
        gap: 1em;
        grid: 'slot slot slot slot slot' 1fr '. prev count next .' / 0 auto 1fr auto 0;
        inline-size: 100vw;
        margin-block: 0 1em;
      }

      slot { grid-area: slot }
      div { grid-area: count; place-self: center }
      [data-direction='prev'] { grid-area: prev }
      [data-direction='next'] { grid-area: next }

      button {
        appearance: none;
        background: rgba(0, 0, 0, .05);
        border: none;
        border-radius: 3em;
        cursor: pointer;
        font: inherit;
        inline-size: fit-content;
        margin: 0;
        padding: .375em 1em;
        transition: opacity .3s;
      }

      button[disabled] { opacity: 0 }
    `);
    this.shadowRoot.adoptedStyleSheets = [styles];
  }
}

customElements.define('fancy-list', FancyList);

