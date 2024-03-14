/**
 * Extends <details> elements with open/close transitions.
 */
class FancyDetails extends HTMLElement {
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

      if (oldValue === '' && !newValue) {
        history.replaceState(null, '', '.');
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
    this.allDetails = [...this.querySelectorAll('details')];
    this.sizeProp = '--block-size';
    this.storageItem = 'open';
    this.url = new URL(window.location);
    
    for (const details of this.allDetails) {
      if (details.open) {
        details.style.setProperty(this.sizeProp, 'auto');
      }
    }
  }

  /**
   * Sets and removes attributes to trigger opening/closing transitions on
   * <details> child element.
   * @param {Event} event
   */
  handleClick(event) {
    if (!event.target.closest('summary')) {
      return;
    }
    
    const details = event.target.closest('details');
    
    // Hijack click since 'open' attribute needs to be set after closing
    // transition ends. Immediately removing 'open' attribute sets
    // contents' display to 'none' and we don't want that just yet.
    if (details.open) {
      event.preventDefault();
      this.fancyClose(details);
    } else {
      this.fancyOpen(details);

      // Close other <details> elements if accordion behavior is enabled.
      if (this.accordion) {
        for (const element of this.allDetails) {
          if (details !== element && element.open) {
            this.fancyClose(element);
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
      element.style.setProperty(this.sizeProp, `${element.scrollHeight}px`);

      // After transition ends, set var's value to 'auto' which ensures
      // <details> has fluid height on resize.
      element.addEventListener('transitionend', () => {
        element.style.setProperty(this.sizeProp, 'auto');
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
      history.replaceState(null, '', '.');
    }

    window.requestAnimationFrame(() => {
      // Set var from 'auto' to pixel value for height transition to occur.
      element.style.setProperty(this.sizeProp, `${element.scrollHeight}px`);

      // Remove var on next tick and set data-attribute to trigger transition.
      window.requestAnimationFrame(() => {
        element.style.removeProperty(this.sizeProp);
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
   * Saves state of opened <details> elements to localStorage for restoring
   * on page load.
   * @param {HTMLDetailsElement} element
   */
  saveState(element) {
    if (this.accordion) {
      if (element.open) {
        history.replaceState(null, '', `#${element.id}`);
      }
      localStorage.removeItem(this.storageItem);
    } else {
      const saved = [];
      for (const details of this.allDetails) {
        if (details.open) {
          saved.push(details.id);
        }
      }
      localStorage.setItem(this.storageItem, JSON.stringify(saved));
    }
  }
  
  /**
   * Restores 'open' state of <details> elements from URL hash for accordion
   * behavior, or from localStorage otherwise. If there's a valid hash, but
   * no accordion behavior, the element whose ID matches the hash will be
   * open, regardless of its localStorage state.
   */
  restoreState() {
    const hash = this.url.hash.replace('#', '');
    const current = this.allDetails.find(element => element.id === hash);

    if (current) {
      current.style.setProperty(this.sizeProp, 'auto');
      current.open = true;
    }

    if (!this.accordion && !current) {
      const saved = JSON.parse(localStorage.getItem(this.storageItem));
      if (saved) {
        for (const details of this.allDetails) {
          if (saved.includes(details.id)) {
            details.open = true;
            details.style.setProperty(this.sizeProp, 'auto');
          }
        }
      }
    }
  }
}

customElements.define('fancy-details', FancyDetails);
