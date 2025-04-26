/**
 * Singleton custom element that uses the YouTube Iframe API to provide custom
 * controls for music tracks. This widget loads up YouTube videos, then hides
 * the actual video so the UI can behave more like a simple audio controller.
 */
customElements.define('audio-player', class AudioPlayer extends HTMLElement {
  buttons = [];  // <HTMLButtonElement[]>
  current;       // HTMLElement
  duration;      // HTMLElement
  ids = [];      // <string[]>
  interval = 0;  // number
  players = [];  // <YT.Player[]>

  constructor() {
    super();
    this.clickHandler = this.handleClick.bind(this);

    if (!AudioPlayer.instance) {
      AudioPlayer.instance = this;
    }
    return AudioPlayer.instance;
  }

  connectedCallback() {
    this.injectJS();
    this.renderElements();
    this.makePlayers();
    document.addEventListener('click', this.clickHandler);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.clickHandler);
  }

  /**
   * Attaches a <script> element to the DOM for the YouTube Iframe API.
   */
  injectJS() {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(script);
  }

  /**
   * Gets all the IDs for generating Player objects and rendering HTML child
   * elements for UI controls and <iframe> replacement.
   */
  renderElements() {
    const elements = document.querySelectorAll('[data-player]');
    this.ids = [...elements].map(element => element.dataset.player);

    // The YouTube API doesn't like multi-line template literals, and it's
    // easier to set up the <button> with old-school JS, hence the mix of DOM
    // insertion types.
    for (const [index, element] of elements.entries()) {
      element.innerHTML = `<div id="${this.ids[index]}"></div>`;
      const button = document.createElement('button');
      this.updateButton(button, 'play');
      element.appendChild(button);
      element.innerHTML += `
        <span data-current></span>
        <span data-duration></span>
      `;

      // Remove the value since JS is done with it, but leave the attribute
      // for CSS layout and style.
      element.setAttribute('data-player', '');
    }

    // Save references to all the buttons for updating their content on click.
    this.buttons = document.querySelectorAll('[data-player] > button');
  }

  /**
   * Makes a new YT.Player for each video.
   */
  makePlayers() {
    window.onYouTubeIframeAPIReady = () => {
      for (const id of this.ids) {
        const options = {
          events: {
            onReady: this.onReady.bind(this),
            onStateChange: this.onStateChange.bind(this),
          },
          height: 180,
          playerVars: {
            'controls': 0,
            'enablejsapi': 1,
            'fs': 0,
            'playsinline': 1,
          },
          videoId: id,
          width: 320,
        }
        new YT.Player(id, options);
      }
    }
  }

  /**
   * Saves all the generated video objects on the page for auto-toggling their
   * play/pause state.
   * @param {Event} event
   */
  onReady(event) {
    const player = event.target;
    this.players.push(player);
    this.updateElements(player);
  }

  /**
   * Tracks current time for the active video.
   */
  onStateChange(event) {
    const player = event.target;
    const state = player.getPlayerState();

    if (state === YT.PlayerState.PLAYING) {
      this.updateElements(player);
      this.interval = setInterval(() => this.updateElements(player), 500);
    }

    if (state === YT.PlayerState.ENDED ||
        state === YT.PlayerState.PAUSED) {
      clearInterval(this.interval);
    }
  }
  
  /**
   * Gets references to current player's UI elements and populates them.
   */
  updateElements(player) {
    const iframe = `iframe[id="${player.g.id}"]`;
    this.current = document.querySelector(`${iframe} ~ [data-current]`);
    this.duration = document.querySelector(`${iframe} ~ [data-duration]`);

    const c = player.getCurrentTime();
    const d = player.getDuration();
    const current = this.humanTime(c);
    const duration = this.humanTime(d);
    const percent = Math.floor((c / d) * 100);

    this.current.textContent = current;
    this.current.dataset.current = percent;
    this.duration.textContent = duration;
  }

  /**
   * Converts a duration in seconds to human-friendly MM:SS format.
   * E.g., 272 seconds = 4:32
   * @param {number} duration 
   * @returns {string}
   */
  humanTime(duration) {
    const minutes = Math.floor(duration / 60);
    const s = Math.floor(duration % 60);
    const seconds = (s < 10) ? `0${s}` : s;
    
    return `${minutes}:${seconds}`;
  }
  
  /**
   * Gets the click target and updates the rest of the DOM if a play/pause
   * <button> was clicked.
   * @param {Event} event
   */
  handleClick(event) {
    if (event.target.tagName !== 'BUTTON') return;
    
    const button = event.target;
    const iframe = button.previousElementSibling;
    const active = this.players.find(player => player.g.id === iframe.id);

    if (button.dataset.state === 'paused') {
      // Pause all videos and reset <button> elements before playing the active
      // video and updating its <button>.
      this.players.forEach(player => player.pauseVideo());
      this.buttons.forEach(button => this.updateButton(button, 'play'));
      active.playVideo();
      this.updateButton(button, 'pause');
    } else {
      // All other videos should already be paused, so only the active <button>
      // needs to be updated when its video is paused.
      active.pauseVideo();
      this.updateButton(button, 'play');
    }
  }

  /**
   * Helper function for rendering <button> elements with an SVG icon.
   * @param {HTMLButtonElement} button
   * @param {string} type
   */
  updateButton(button, type) {
    let label = 'Play this track';
    let path = 'M6,3 L6,21 L21,12 Z';
    let state = 'paused';
    
    if (type === 'pause') {
      label = 'Pause this track';
      path = 'M6,4 L6,20 L10,20 L10,4 M14,4 L14,20 L18,20 L18,4';
      state = 'playing';
    }
    
    button.ariaLabel = label;
    button.title = label;
    button.dataset.state = state;
    button.innerHTML = `
      <svg aria-hidden="true" viewbox="0 0 24 24">
        <path d="${path}"/>
      </svg>
    `;
  }
});
