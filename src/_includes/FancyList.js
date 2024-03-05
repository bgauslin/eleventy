
class FancyList extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.watchItems();
    this.setupControls();
    this.addEventListener('click', this.handleClick);
  }

  watchItems() {
    this.list = this.querySelector('ol');
    this.items = this.list.querySelectorAll('li');
    this.total = this.items.length;

    const observer = new IntersectionObserver(this.update.bind(this), {
      root: this.list,
      rootMargin: '0px',
      threshold: .66,
    });
  
    for (const item of this.items) {
      observer.observe(item);
    }
  }

  setupControls() {
    this.prevButton = this.querySelector('[data-direction="prev"]');
    this.nextButton = this.querySelector('[data-direction="next"]');
    this.count = this.querySelector('.count');

    this.prev = -1;
    this.next = 1;
  }

  /**
   * IntersectionObserver callback that updates controls.
   */
  update(entries) {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        return;
      }
      
      for (const [index, item] of this.items.entries()) {
        if (entry.target === item) {
          this.prev = (index > 0) ? index - 1 : -1;
          this.next = (index < this.total - 1) ? index + 1 : false;
          this.count.textContent = `${index + 1}/${this.total}`;

          this.prevButton.disabled = this.prev < 0;
          this.nextButton.disabled = !this.next;          
        }
      }
    }
  }

  /**
   * Scrolls next or previous item into view on button click.
   */
  handleClick(event) {
    let offset = 0;
    const direction = event.target.dataset.direction;

    if (direction === 'prev') {
      const {width} = this.items[this.prev].getBoundingClientRect();
      offset = -width;
    }
    
    if (direction === 'next') {
      const {x} = this.items[this.next].getBoundingClientRect();
      offset = x;
    }
    
    this.list.scrollTo({
      top: 0,
      left: this.list.scrollLeft + offset,
      behavior: 'smooth',
    });
  }
}

customElements.define('fancy-list', FancyList);
