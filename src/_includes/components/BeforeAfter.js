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
			<p>
				<slot name="before">Click for view after</slot>
				<slot name="after">Return to view before</slot>
			</p>
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
				cursor: pointer;
				display: grid;
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

			p {
				font-size: small;
				font-weight: bold;
				grid-area: 2 / 1;
				margin-block: .5rem 0;
				opacity: var(--text-opacity);
				text-align: center;
			}
		`);
		this.shadowRoot.adoptedStyleSheets = [styles];
	}
}

customElements.define('before-after', BeforeAfter);
