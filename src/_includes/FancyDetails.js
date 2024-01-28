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
   * Sets/removes className on elements to enable/disable CSS transitions.
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
   * Updates CSS vars and HTML attributes on click for animated/accordion UX.
   */ 
  handleClick(event) {
    if (event.target.tagName.toLowerCase() !== 'summary') {
      return;
    }

    const current = event.target.closest('details');

    if (this.animated) { 
      window.requestAnimationFrame(() => {
        if (current.hasAttribute('open')) {
          current.style.setProperty('--height', `${current.scrollHeight}px`);
        } else {
          current.style.removeProperty('--height');
        }
      });
    }

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
