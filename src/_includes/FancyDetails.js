const SIZE_VAR = '--block-size';

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
    document.body.removeEventListener('click', this.clickListener);
  }

  // Sets attribute on elements to activate CSS transitions.
  #updateElements() {
    if (!this.details || !this.details.length) {
      return;
    }

    for (const details of this.details) {
      if (this.animated) {
        details.classList.add('fancy');
      } else {
        details.classList.remove('fancy');
        details.style.removeProperty(SIZE_VAR);
      }
    }
  }

  // Updates CSS vars and HTML attributes on click for animated and/or
  // accordion UX.
  #handleClick(event) {
    if (event.target.tagName.toLowerCase() !== 'summary') {
      return;
    }

    const current = event.target.closest('details');

    if (this.animated) { 
      window.requestAnimationFrame(() => {
        if (current.hasAttribute('open')) {
          current.style.setProperty(SIZE_VAR, `${current.scrollHeight}px`);
        } else {
          current.style.removeProperty(SIZE_VAR);
        }
      });
    }

    if (this.accordion) {
      for (const details of this.details) {
        if (details !== current) {
          details.removeAttribute('open');
          details.style.removeProperty(SIZE_VAR);
        }
      }
    }
  }
}

customElements.define('fancy-details', FancyDetails);
