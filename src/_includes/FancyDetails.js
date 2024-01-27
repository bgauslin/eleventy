const DETAILS_SIZE = '--details-size';

class FancyDetails extends HTMLElement {
  static observedAttributes = ['accordion', 'animated'];

  constructor() {
    super();
    this.clickListener = this.#handleClick.bind(this);
  }

  connectedCallback() {
    this.details = document.querySelectorAll('details');
    document.body.addEventListener('click', this.clickListener);
    this.#updateElements();
  }

  attributeChangedCallback() {
    this.accordion = this.hasAttribute('accordion');
    this.animated = this.hasAttribute('animated');
    this.#updateElements();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.clickListener);
  }

  // Sets attribute on elements to activate CSS transitions.
  #updateElements() {
    if (!this.details || !this.details.length) {
      return;
    }

    for (const details of this.details) {
      if (this.animated) {
        details.setAttribute('data-animated', '');
      } else {
        details.removeAttribute('data-animated');
        details.style.removeProperty(DETAILS_SIZE);
      }
    }
  }

  // Updates CSS vars and HTML attributes on click for animated and/or
  // accordion UX.
  #handleClick(event) {
    if (event.target.tagName.toLowerCase() !== 'summary') {
      return;
    }

    const detailsActive = event.target.closest('details');

    if (this.animated) {  
      window.requestAnimationFrame(() => {
        detailsActive.style.setProperty(DETAILS_SIZE, `${detailsActive.scrollHeight}px`);
        if (!detailsActive.hasAttribute('open')) {
          detailsActive.style.removeProperty(DETAILS_SIZE);
        }
      });
    }

    if (this.accordion) {
      for (const details of this.details) {
        if (details !== detailsActive) {
          details.removeAttribute('open');
          details.style.removeProperty(DETAILS_SIZE);
        }
      }
    }
  }
}

customElements.define('fancy-details', FancyDetails);
