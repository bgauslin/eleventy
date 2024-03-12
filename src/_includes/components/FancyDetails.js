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
   * Sets and removes attributes to trigger opening/closing transitions on
   * <details> child element.
   * @param {Event} event
   */
  handleClick(event) {
    if (event.target.tagName !== 'SUMMARY') {
      return;
    }
    
    const details = event.target.closest('details');
    
    if (details.open) {
      // Hijack click since 'open' attribute needs to be set after closing
      // transition ends. Immediately removing 'open' attribute sets
      // contents' display to 'none' and we don't want that just yet.
      event.preventDefault();
      this.fancyClose(details);
    } else {
      this.fancyOpen(details);
    }
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
      }, {once: true});
    });
  }

  /**
   * Opens a <details> element with a transition..
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
      }, {once: true});
    });
  }
}

customElements.define('fancy-details', FancyDetails);
