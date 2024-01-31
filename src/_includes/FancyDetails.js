/**
 * Extends <details> elements with open/close transitions.
 * 
 * When opened, a CSS var is set directly on the <details> element; otherwise
 * the CSS var is removed so that layout falls back to default.
 * 
 * If a <details> element is already open when clicked, the click is hijacked
 * so that the 'open' attribute is removed after the transition. Otherwise,
 * the default display is 'none' for its content when a <details> element is
 * closed, and we want to prevent that until the transition ends.
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

  handleClick(event) {
    if (event.target.tagName !== 'SUMMARY') {
      return;
    }

    const element = event.target.closest('details');

    if (element.open) {
      event.preventDefault();
      element.style.removeProperty('--height');
      element.addEventListener('transitionend', () => {
        element.open = false;
      }, {once: true});
    } else {
      window.requestAnimationFrame(() => {
        element.style.setProperty('--height', `${element.scrollHeight}px`);
      });
    }
  }
}

customElements.define('fancy-details', FancyDetails);
