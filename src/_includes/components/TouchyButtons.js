/**
 * Adds/removes a 'class' attribute to touch targets for CSS transitions.
 */	
class TouchyButtons extends HTMLElement {
  constructor() {
    super();
    this.start = this.touchstart.bind(this);
    this.end = this.touchend.bind(this);
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
}
customElements.define('touchy-buttons', TouchyButtons);