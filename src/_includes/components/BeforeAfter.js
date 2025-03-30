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
			<slot></slot>
			<p><slot name="caption">Click me!</slot></p>
		`;
		this.style.setProperty('--action', '0%');
	}
	
	update() {
		let value = this.active ? 0 : 100;
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
				cursor: pointer;
				display: grid;
				grid: 1fr / 1fr;
				inline-size: 100%;
			}

			::slotted(img) {
				grid-area: 1 / 1 / -1 / -1;
				inline-size: 100%;
				place-self: center;
				transition: opacity var(--transition);
			}

			::slotted(img:last-child) {
				opacity: var(--action);
				z-index: 1;
			}

			p {
				font-size: var(--font-size-small);
				margin-block: .25em;
				opacity: var(--text-opacity);
				text-align: center;
			}
		`);
		this.shadowRoot.adoptedStyleSheets = [styles];
	}
}

customElements.define('before-after', BeforeAfter);
