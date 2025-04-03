/**
 * Custom element that transitions between two images showing different states.
 */
class BeforeAfter extends HTMLElement {
  constructor() {
    super();
    this.active = false;
    this.clickListener = this.update.bind(this);
  }
	
  connectedCallback() {
    this.setup();
    this.renderStyles();
    this.addEventListener('click', this.clickListener);
  }
	
  disconnectedCallback() {
    this.removeEventListener('click', this.clickListener);
  }

  setup() {
    this.attachShadow({mode: 'open'});
    this.shadowRoot.innerHTML = `
      <slot name="images"></slot>
      <button type="button">
        <span>
          <slot name="before">Click for view after</slot>
          <slot name="after">Return to view before</slot>
        </span>
      </button>
    `;
    this.before = this.shadowRoot.querySelector('[name=before]');
    this.after = this.shadowRoot.querySelector('[name=after]');

    this.style.setProperty('--action', '0%');
    this.after.hidden = true;
  }
	
  update() {
    let value = this.active ? 0 : 100;
    this.before.hidden = !this.active;
    this.after.hidden = this.active;
    this.style.setProperty('--action', `${value}%`);
    this.active = !this.active;
  }
	
  renderStyles() {
    const styles = new CSSStyleSheet();
    styles.replaceSync(`
      * {
        box-sizing: border-box;
      }

      :host {
        display: grid;
        gap: .75rem;
        grid: 1fr auto / 1fr;
        inline-size: 100%;
      }

      ::slotted(img) {
        grid-area: 1 / 1;
        inline-size: 100%;
        place-self: center;
        transition: opacity .5s;
      }

      ::slotted(img:last-child) {
        opacity: var(--action);
        z-index: 1;
      }

      button {
        appearance: none;
        background-color: var(--fill-2);
        border: none;
        border-radius: 10rem;
        color: var(--text-color);
        cursor: pointer;
        font: inherit;
        font-size: .75em;
        font-variation-settings: 'wght' 600;
        outline: none;
        padding-block: .25rem;
        padding-inline: 1rem;
        place-self: center;
        transition: background-color var(--transition), color var(--transition), transform var(--transition);
        white-space: nowrap;
      }
      
      button:focus-visible {
        background-color: var(--text-color);
        color: var(--fill-0);
      }

      @media (any-hover: hover) {
        button:hover {
          background-color: var(--text-color);
          color: var(--fill-0);
        }
        
        button:active {
          transform: scale(.8);
        }
      }

      button span {
        opacity: .7;
        pointer-events: none;
      }
    `);
    this.shadowRoot.adoptedStyleSheets = [styles];
  }
}

customElements.define('before-after', BeforeAfter);
