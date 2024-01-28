/**
 * Extends all <details> elements in the DOM with open/closing transitions and
 * accordion behavior based on custom attributes set on the custom element.
 */
class FancyDetails extends HTMLElement {
  static observedAttributes = ['accordion', 'animated'];

  constructor() {
    super();
    this.clickListener = this.handleClick.bind(this);
  }

  connectedCallback() {
    this.details = document.querySelectorAll('details');
    document.body.addEventListener('click', this.clickListener);
    this.updateElements();
  }

  attributeChangedCallback() {
    this.accordion = this.hasAttribute('accordion');
    this.animated = this.hasAttribute('animated');
    this.updateElements();
  }

  disconnectedCallback() {
    document.body.removeEventListener('click', this.clickListener);
  }

  /**
   * Adds/removes className on each <details> element to enable/disable
   * CSS transitions.
   */ 
  updateElements() {
    if (!this.details || !this.details.length) {
      return;
    }

    for (const details of this.details) {
      if (this.animated) {
        details.classList.add('fancy');
      } else {
        details.classList.remove('fancy');
        details.style.removeProperty('--height');
      }
    }
  }

  /**
   * Gets current <details> element and updates CSS vars and HTML attributes
   * for animated/accordion UX.
   */ 
  handleClick(event) {
    if (event.target.tagName.toLowerCase() !== 'summary') {
      return;
    }

    const current = event.target.closest('details');

    // Set CSS var scoped directly on <details> element if it's open;
    // otherwise remove the CSS var and fallback to default value.
    if (this.animated) { 
      window.requestAnimationFrame(() => {
        if (current.hasAttribute('open')) {
          current.style.setProperty('--height', `${current.scrollHeight}px`);
        } else {
          current.style.removeProperty('--height');
        }
      });
    }

    // Remove 'open' attributes from all non-active <details> elements.
    if (this.accordion) {
      for (const details of this.details) {
        if (details !== current) {
          details.removeAttribute('open');
          details.style.removeProperty('--height');
        }
      }
    }
  }
}

customElements.define('fancy-details', FancyDetails);
