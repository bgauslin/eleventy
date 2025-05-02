/**
 * Singleton custom element that adds/removes a 'touch' class on all touch
 * targets in the DOM for applying CSS transitions.
 * 
 * @example
 * <touchy-buttons></touchy-buttons>
 */	
customElements.define('touchy-buttons', class TouchyButtons extends HTMLElement {
  end;     /** @type {EventListenerObject} */
  start;   /** @type {EventListenerObject} */
  target;  /** @type {HTMLElement} */

  constructor() {
    super();

    if (!TouchyButtons.instance) {
      TouchyButtons.instance = this;
      this.start = this.touchstart.bind(this);
      this.end = this.touchend.bind(this);
    }
    return TouchyButtons.instance;
  }

  connectedCallback() {
    document.addEventListener('touchstart', this.start, {passive: true});
    document.addEventListener('touchend', this.end, {passive: true});
  }

  disconnectedCallback() {
    document.removeEventListener('touchstart', this.start);
    document.removeEventListener('touchend', this.end);
  }

  touchstart(event) {
    this.target = event.composedPath()[0];

    if (this.target.tagName === 'BUTTON' ||
        this.target.classList.contains('button')) {
      this.target.classList.add('touch');
    }
  }

  touchend() {
    this.target.classList.remove('touch');

    // In case of touchmove.
    [...document.querySelectorAll('.touch')].forEach(link => {
      link.classList.remove('touch');
    });
  }
});
