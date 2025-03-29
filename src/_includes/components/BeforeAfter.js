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
		this.renderDOM();
		this.renderStyles();
		this.addEventListener('click', this.clickListener);
	}
	
	disconnectedCallback() {
		this.removeEventListener('click', this.clickListener);
	}
	
	update() {
		const value = this.active ? 0 : 100;
	  this.style.setProperty('--shift', `${value}%`);
	  this.active = !this.active;
	}
	
	renderDOM() {
		this.attachShadow({mode: 'open'});
		this.shadowRoot.innerHTML = '<slot></slot>';
	}
	
	renderStyles() {
    const styles = new CSSStyleSheet();
    styles.replaceSync(`
      :host {
				--shift: 0;
				
				display: grid;
				grid: 1fr / 1fr;
				inline-size: 100%;
			}

			::slotted(img) {
				grid-area: 1 / 1 / -1 / -1;
				inline-size: 100%;
				transition: clip-path .3s ease-in-out;
			}
			
			::slotted(img:first-child) {
				clip-path: polygon(0% 0%, var(--shift) 0%, var(--shift) 100%, 0% 100%);
			}
		`);
		this.shadowRoot.adoptedStyleSheets = [styles];
	}
}

customElements.define('before-after', BeforeAfter);
