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

      // Set var from 'auto' to pixel value for height transition to occur.
      details.style.setProperty(this.sizeProp, `${details.scrollHeight}px`);

      // Remove var on next tick and set data-attribute to trigger transition.
      window.requestAnimationFrame(() => {
        details.style.removeProperty(this.sizeProp);
        details.dataset.closing = '';

        // Remove 'open' and 'data-closing' attributes after transition ends.
        details.addEventListener('transitionend', () => {
          details.open = false;
          delete details.dataset.closing;
        }, {once: true});
      });
    } else {
      window.requestAnimationFrame(() => {
        // Set height var on next tick to trigger opening transition.
        details.style.setProperty(this.sizeProp, `${details.scrollHeight}px`);

        // After transition ends, set var's value to 'auto' which ensures
        // <details> has fluid height on resize.
        details.addEventListener('transitionend', () => {
          details.style.setProperty(this.sizeProp, 'auto');
        }, {once: true});
      });
    }
  }
}

customElements.define('fancy-details', FancyDetails);
