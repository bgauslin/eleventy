/**
 * Extends <details> elements with open/close transitions.
 */
class FancyDetails extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.addEventListener('click', this.handleClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick);
  }

  /**
   * Set CSS var scoped directly on <details> element if it's open; otherwise
   * removes the CSS var and fallback to default value.
   * If element is already open, hijack click so that arttribute is removed
   * after the transition. Otherwise, default display is none for content
   * when 'open' attribute is removed and we want to prevent that until the
   * after the transition ends.
   */ 
  handleClick(event) {
    if (event.target.tagName !== 'SUMMARY') {
      return;
    }

    const element = event.target.closest('details');

    if (element.open) {
      event.preventDefault();
      element.style.removeProperty('--height');
      element.addEventListener('transitionend', () => element.open = false, {once: true});
    } else {
      window.requestAnimationFrame(() => {
        element.style.setProperty('--height', `${element.scrollHeight}px`);
      });
    }
  }
}

customElements.define('fancy-details', FancyDetails);
