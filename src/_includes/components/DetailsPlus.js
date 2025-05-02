/**
 * Custom element that enhances light DOM children <details> elements with
 * open/close transitions and saved state via URL hash or localStorage.
 * 
 * If element has an 'accordion' attribute, only one child <details> element
 * can be open at a time and its hash is saved to localStorage. Otherwise, any
 * number of them can be open simultaneously and the open/closed state of each
 * is saved to localStorage.
 * 
 * @example
 * <details-plus accordion>
 *   <details></details>
 *   <details></details>
 *   <details></details>
 * </details-plus>
 */
customElements.define('details-plus', class extends HTMLElement {
  accordion;    /** @type {boolean} */ 
  details;      /** @type {HTMLDetailsElement[]} */
  size;         /** @type {string} */ 
  storageItem;  /** @type {string} */ 

  constructor() {
    super();
  }

  static observedAttributes = ['accordion'];

  connectedCallback() {
    this.setup();
    this.restoreState();
    this.addEventListener('click', this.handleClick);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'accordion') {
      this.accordion = this.hasAttribute('accordion');

      // Accordion disabled; remove URL hash and default to localStorage.
      if (oldValue === '' && !newValue) {
        this.updateURL();
        this.saveState();
      }

      // Accordion enabled: delete localStorage and use URL hash.
      if (newValue === '' && !oldValue) {
        localStorage.removeItem(this.storageItem);
      }
    }
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick);
  }

  /**
   * Gets element references and provides open <details> elements with a
   * var that sets their height.
   */
  setup() {
    this.details = [...this.querySelectorAll('details')];
    this.size = '--block-size';
    this.storageItem = 'open';
    
    for (const details of this.details) {
      if (details.open) {
        details.style.setProperty(this.size, 'auto');
      }
    }
  }

  /**
   * Restores 'open' state of <details> elements from URL hash for accordion
   * behavior, or from localStorage otherwise. If there's a valid hash, but
   * no accordion behavior, the element whose ID matches the hash will be
   * open, and localStorage is reset accordingly.
   */
  restoreState() {
    const url = new URL(window.location);
    const hash = url.hash.replace('#', '');
    const current = this.details.find(element => element.id === hash);

    // Open the <details> element whose ID matched URL hash.
    if (current) {
      current.style.setProperty(this.size, 'auto');
      current.open = true;
    
    // Otherwise, get localStorage and open the elements from prior visit.
    } else {
      const saved = JSON.parse(localStorage.getItem(this.storage));
      if (saved) {
        for (const details of this.details) {
          if (saved.includes(details.id)) {
            details.open = true;
            details.style.setProperty(this.size, 'auto');
          }
        }
      }
    }

    // Remove localStorage if accordion is enabled; otherwise, reset URL and
    // save the single 
    if (this.accordion) {
      localStorage.removeItem(this.storage);
    } else {
      this.updateURL();
      this.saveState();
    }
  }

  /**
   * Updates URL hash if accordion is enabled; otherwise saves a list of opened
   * <details> elements to localStorage for restoring on page load.
   * @param {HTMLDetailsElement} element
   */
  saveState(element) {
    if (element && this.accordion) {
      if (element.open) {
        this.updateURL(element.id);
      }
    } else {
      const saved = [];
      for (const details of this.details) {
        if (details.open) {
          saved.push(details.id);
        }
      }
      localStorage.setItem(this.storage, JSON.stringify(saved));
    }
  }

  /**
   * Sets and removes attributes to trigger opening/closing transitions on
   * <details> child element.
   * @param {Event} event
   */
  handleClick(event) {
    if (!event.target.closest('summary')) return;
    
    const target = event.target.closest('details');
    
    // Hijack click since 'open' attribute needs to be set after closing
    // transition ends. Immediately removing 'open' attribute sets
    // contents' display to 'none' and we don't want that just yet.
    if (target.open) {
      event.preventDefault();
      this.fancyClose(target);
    } else {
      this.fancyOpen(target);

      // Close other <details> elements if accordion behavior is enabled.
      if (this.accordion) {
        for (const details of this.details) {
          if (details.open && details !== target) {
            this.fancyClose(details);
          }
        }
      }
    }
  }
  
  /**
   * Opens a <details> element with a transition.
   * @param {HTMLDetailsElement} element
   */
  fancyOpen(element) {
    window.requestAnimationFrame(() => {
      // Set height var on next tick to trigger opening transition.
      element.style.setProperty(this.size, `${element.scrollHeight}px`);

      // After transition ends, set var's value to 'auto' which ensures
      // <details> has fluid height on resize.
      element.addEventListener('transitionend', () => {
        element.style.setProperty(this.size, 'auto');
        this.saveState(element);
      }, {once: true});
    });
  }

  /**
   * Closes a <details> element with a transition.
   * @param {HTMLDetailsElement} element
   */
  fancyClose(element) {
    if (this.accordion) {
      this.updateURL();
    }

    window.requestAnimationFrame(() => {
      // Set var from 'auto' to pixel value for height transition to occur.
      element.style.setProperty(this.size, `${element.scrollHeight}px`);

      // Remove var on next tick and set data-attribute to trigger transition.
      window.requestAnimationFrame(() => {
        element.style.removeProperty(this.size);
        element.dataset.closing = '';

        // Remove 'open' and 'data-closing' attributes after transition ends.
        element.addEventListener('transitionend', () => {
          element.open = false;
          delete element.dataset.closing;
          this.saveState(element);
        }, {once: true});
      });
    });
  }

  /**
   * Helper method that updates browser history with hash in URL if an ID is
   * provided; otherwise removes the hash (if it exists) and resets URL.
   * @param {string} id - <details> element ID
   */
  updateURL(id) {
    const hash = id ? `#${id}` : '.';
    history.replaceState(null, '', hash);
  }
});
