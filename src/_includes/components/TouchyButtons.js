class TouchyButtons extends HTMLElement {
  constructor() {
    super();
    this.start = this.touchstart.bind(this);
    this.end = this.touchend.bind(this);
  }

  connectedCallback() {
    document.addEventListener('touchstart', this.start);
    document.addEventListener('touchend', this.end);
  }

  disconnectedCallback() {
    document.removeEventListener('touchstart', this.start);
    document.removeEventListener('touchend', this.end);
  }

  touchstart(event) {
    const composed = event.composedPath();
    this.target = composed[0];
    console.log('touchstart', this.target);

    if (this.target.tagName === 'BUTTON' ||
        this.target.classList.contains('button')) {
      console.log(`${this.target} touched!`);
      this.target.dataset.touched = '';
    }
  }

  touchend() {
    console.log('touchend', this.target);
    delete this.target.dataset.touched;
    [...document.querySelectorAll('[data-touched]')].forEach(link => {
      delete link.dataset.touched;
    });
  }
}
customElements.define('touchy-buttons', TouchyButtons);