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
			<slot name="caption"><small>Click the image!</small></slot>
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
				transition: opacity .3s, clip-path .3s ease-in-out;
			}

			::slotted(img:last-child) {
				z-index: 1
			}
			
			:host-context([type='wipe']) ::slotted(img:last-child) {
				clip-path: polygon(0% 0%, var(--action) 0%, var(--action) 100%, 0% 100%);
			}

			:host-context([type='fade']) ::slotted(img:last-child) {
				opacity: var(--action);
			}
				
			small {
				opacity: var(--text-opacity);
				margin-block: .5rem;
				margin-inline: 1rem;
				text-align: center;
			}
		`);
		this.shadowRoot.adoptedStyleSheets = [styles];
	}
}

customElements.define('before-after', BeforeAfter);
