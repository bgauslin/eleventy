class Tools extends HTMLElement {
  static observedAttributes = ['accordion', 'animated', 'links'];

  constructor() {
    super();
    this.clickListener = this.#fancyDetails.bind(this);
  }

  connectedCallback() {
    this.#updateLinks();
    this.#updateDetails();
    document.body.addEventListener('click', this.clickListener);
  }

  attributeChangedCallback() {
    this.accordion = this.hasAttribute('accordion');
    this.animated = this.hasAttribute('animated');
    this.externalLinks = this.hasAttribute('links');
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.clickListener);
  }

  // Sets attribute on elements to activate CSS transitions.
  #updateDetails() {
    this.details = document.querySelectorAll('details');

    if (this.details.length && this.animated) {
      for (const detail of this.details) {
        detail.setAttribute('data-animated', '');
      }
    }
  }

  // Updates CSS vars and HTML attributes on click for animated and/or
  // accordion UX.
  #fancyDetails(event) {
    if (event.target.tagName.toLowerCase() !== 'summary') {
      return;
    }

    const sizeVar = '--details-size';
    const detailsActive = event.target.closest('details');

    if (this.animated) {  
      window.requestAnimationFrame(() => {
        detailsActive.style.setProperty(sizeVar, `${detailsActive.scrollHeight}px`);
        if (!detailsActive.hasAttribute('open')) {
          detailsActive.style.removeProperty(sizeVar);
        }
      });
    }

    if (this.accordion) {
      for (const details of this.details) {
        if (details !== detailsActive) {
          details.removeAttribute('open');
          details.style.removeProperty(sizeVar);
        }
      }
    }
  }

  // Adds attributes to external links to open each in a new window.
  #updateLinks() {
    if (!this.externalLinks) {  
      return;
    }

    const home = new URL(window.location);
    const links = document.querySelectorAll('a');

    for (const link of links) {
      const {hostname, protocol} = new URL(link.href);
      if (protocol === 'https:' && hostname !== home.hostname) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener');
      }
    }
  }
}

customElements.define('my-tools', Tools);
