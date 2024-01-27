class ExternalLinks extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.#update();
  }

  // Adds attributes to external links to open each in a new window.
  #update() {
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

customElements.define('external-links', ExternalLinks);
