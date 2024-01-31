/**
 * Extends all <details> elements in the DOM with open/closing transitions.
 */
class FancyDetails extends HTMLElement {
  constructor() {
    super();
    this.clickListener = this.handleClick.bind(this);
  }

  connectedCallback() {
    this.updateElements();
    document.body.addEventListener('click', this.clickListener);
  }

  disconnectedCallback() {
    document.body.removeEventListener('click', this.clickListener);
  }

  /**
   * Adds/removes className on each <details> element to enable/disable
   * CSS transitions.
   */ 
  updateElements() {
    this.details = document.querySelectorAll('details');
    if (this.details && this.details.length) {
      for (const details of this.details) {
        details.classList.add('fancy');
      }
    }
  }

  /**
   * Gets current <details> element and updates CSS vars and HTML attributes
   * for animated/accordion UX.
   */ 
  handleClick(event) {
    if (event.target.tagName !== 'SUMMARY') {
      return;
    }

    const details = event.target.closest('details');

    // Set CSS var scoped directly on <details> element if it's open;
    // otherwise remove the CSS var and fallback to default value.
    // If element is already open, hijack click so that arttribute is removed
    // after the transition. Otherwise, default display is none for content
    // when 'open' attribute is removed and we want to prevent that until the
    // after the transition ends.
    if (details.open) {
      event.preventDefault();
      details.style.removeProperty('--height');
      details.addEventListener('transitionend', () => {
        details.open = false;
      }, {once: true});
    } else {
      window.requestAnimationFrame(() => {
        details.style.setProperty('--height', `${details.scrollHeight}px`);
      });
    }
  }
}

customElements.define('fancy-details', FancyDetails);
