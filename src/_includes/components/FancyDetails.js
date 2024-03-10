/**
 * Extends <details> elements with open/close transitions.
 */
class FancyDetails extends HTMLElement {
  constructor() {
    super();
    this.sizeProp = '--block-size';
  }

  connectedCallback() {
    this.addEventListener('click', this.handleClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick);
  }

  /**
   * When opened, a CSS var is set directly on the <details> element to force
   * a height transition. When the transtion completes, the var is set to
   * 'auto' to ensure element dimensions change as expected on resize.
   * 
   * When closed, a data attribute and pixel value height are set to force a
   * transition, and the 'open' attribute isn't removed until after it ends.
   * Otherwise, the default display is 'none' for content when a <details>
   * element is closed, and we want to prevent that until transitions end, so
   * we hijack the click, do stuff, then close the element manually.
   * @param {Event} event
   */
  handleClick(event) {
    if (event.target.tagName !== 'SUMMARY') {
      return;
    }

    const details = event.target.closest('details');

    if (details.open) {
      event.preventDefault();
      details.style.setProperty(this.sizeProp, `${details.scrollHeight}px`);
      window.requestAnimationFrame(() => {
        details.style.removeProperty(this.sizeProp);
        details.dataset.state = 'closing';
        details.addEventListener('transitionend', () => {
          details.open = false;
          delete details.dataset.state;
        }, {once: true});
      });
    } else {
      window.requestAnimationFrame(() => {
        details.style.setProperty(this.sizeProp, `${details.scrollHeight}px`);
        details.addEventListener('transitionend', () => {
          details.style.setProperty(this.sizeProp, 'auto');
        }, {once: true});
      });
    }
  }
}

customElements.define('fancy-details', FancyDetails);
