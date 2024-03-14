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
    if (event.target.tagName !== 'SUMMARY') {
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
        this.saveState();
      }, {once: true});
    });
  }

  /**
   * Closes a <details> element with a transition.
   * @param {HTMLDetailsElement} element
   */
  fancyClose(element) {
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
        this.saveState();
      }, {once: true});
    });
  }

  /**
   * Saves state of opened <details> elements to localStorage for restoring
   * on page load.
   */
  saveState() {
    const saved = [];
    for (const details of this.allDetails) {
      if (details.open) {
        saved.push(details.id);
      }
    }
    localStorage.setItem(this.storageItem, JSON.stringify(saved));
  }
  
  /**
   * Restores 'open' state of <details> elements from localStorage.
   */
  restoreState() {
    const saved = JSON.parse(localStorage.getItem(this.storageItem));
    if (!saved) {
      return;
    }

    for (const details of this.allDetails) {
      // Reset any hard-coded open elements.
      if (this.accordion) {
        details.open = false;
      }

      // Restore previously saved state.
      if (saved.includes(details.id)) {
        details.open = true;
        details.style.setProperty(this.sizeProp, 'auto');
      }
    }
  }
}

customElements.define('fancy-details', FancyDetails);
