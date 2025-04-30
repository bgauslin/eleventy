/**
 * Singleton custom element that uses the YouTube IFrame Player API to provide
 * custom controls for music tracks. This widget loads up YouTube videos, then
 * hides each video so the UI can behave more like a simple audio controller.
 */
customElements.define('audio-player', class AudioPlayer extends HTMLElement {
  buttons = [];     // <HTMLButtonElement[]>
  current;          // <HTMLElement> current/elapsed time
  duration;         // <HTMLElement> total time
  ids = [];         // <string[]>
  interval = 0;     // <number>
  percent;          // <HTMLInputElement> range slider
  players = [];     // <YT.Player[]>
  ranges = [];      // <HTMLInputElement[]>
  seeking = false;  // <boolean>

  constructor() {
    super();
    this.clickHandler = this.handleClick.bind(this);
    this.rangeHandler = this.handleRange.bind(this);
    this.downHandler = this.handleDown.bind(this);
    this.upHandler = this.handleUp.bind(this);

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
    document.addEventListener('input', this.rangeHandler);
    ['mousedown', 'touchstart'].forEach(type => document.addEventListener(type, this.downHandler));
    ['mouseup', 'touchend'].forEach(type => document.addEventListener(type, this.upHandler));
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.clickHandler);
    document.removeEventListener('input', this.rangeHandler);
    ['mousedown', 'touchstart'].forEach(type => document.removeEventListener(type, this.downHandler));
    ['mouseup', 'touchend'].forEach(type => document.removeEventListener(type, this.upHandler));
  }

  /**
   * Attaches a <script> element to the DOM for the YouTube IFrame API.
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
    // easier to make the <button> and its reference with old-school JS, hence 
    // the mix of DOM insertion types.
    for (const [index, element] of elements.entries()) {
      const id = this.ids[index];
      element.innerHTML = `<div id="${id}"></div>`;
      const button = document.createElement('button');
      this.updateButton(button, 'play');
      element.appendChild(button);
      element.innerHTML += `
        <span class="current"></span>
        <span class="duration"></span>
        <input
          data-for="${id}"
          max="100"
          min="0"
          name="percent"
          type="range"
          value="0"/>
      `;

      // Remove the value since JS is done with it, but leave the attribute
      // for CSS layout and style.
      element.setAttribute('data-player', '');
    }

    // Make references to all <button> elements for auto-updating.
    this.buttons = document.querySelectorAll('[data-player] > button'); 
  }

  /**
   * Generates a new YT.Player instance for each video.
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
   * Saves all the generated Player instances for auto-toggling their play/pause
   * states.
   * @param {Event} event
   */
  onReady(event) {
    const player = event.target;
    this.players.push(player);
    this.updateElements(player, true);
  }

  /**
   * Tracks current time for the active Player.
   * @param {Event} event
   */
  onStateChange(event) {    
    const player = event.target;
    const state = player.getPlayerState();

    // Auto-update current time.
    if (state === YT.PlayerState.PLAYING) {
      this.updateElements(player);
      this.interval = setInterval(() => this.updateElements(player), 500);
    }

    // Stop auto-updating current time.
    if (state === YT.PlayerState.PAUSED ||
        state === YT.PlayerState.ENDED) {
      clearInterval(this.interval);
    }

    // Reset everything.
    if (state === YT.PlayerState.ENDED) {
      this.setupPlayer(player);
    }
  }

  /**
   * Sets the starting time for a Player instance.
   * @param {YT.Player} player
   */
  setupPlayer(player) {
    const iframe = `iframe[id="${player.g.id}"]`;
    const parent = document.querySelector(`${iframe}`).closest('[data-start]');
    const button = document.querySelector(`${iframe} ~ button`);
    
    const start = parent ? parent.dataset.start : '0:00';
    const time = this.playerTime(start);

    player.seekTo(time);
    player.pauseVideo();

    this.current.textContent = start;
    this.percent.value = time;
    this.updateButton(button, 'play');
  }

  /**
   * Updates the current time element as a visual indicator of user-selected
   * time to jump to.
   * @param {Event} event
   */
  handleRange(event) {
    const {value} = event.target;
    const time = this.humanTime(value);
    const id = event.target.dataset.for;
    this.current = document.querySelector(`iframe[id="${id}"] ~ .current`);
    this.current.textContent = time;
  }

  /**
   * Sets a guard that prevents the 'current' time from being auto-updated while
   * user selects a different time to play.
   * @param {Event} event
   */
  handleDown(event) {
    if (event.target.type === 'range') {
      this.seeking = true;
    }
  }

  /**
   * Jumps to selected time and prevents auto-playing if the player is cued up
   * or paused. The guard is always removed on up/end events regardless of the
   * event target.
   * @param {Event} event
   */
  handleUp(event) {
    this.seeking = false;
    const {type, value} = event.target;

    if (type !== 'range') return;

    const player = this.players.find(player => player.g.id === event.target.dataset.for);
    const state = player.getPlayerState();
    player.seekTo(value);
    if (state !== YT.PlayerState.PLAYING) {
      player.pauseVideo();
    }
  }

  /**
   * Gets references to current player's UI elements and populates them.
   * @param {YT.Player} player
   * @param {boolean=} setup
   */
  updateElements(player, setup = false) {
    const iframe = `iframe[id="${player.g.id}"]`;

    this.current = document.querySelector(`${iframe} ~ .current`);
    this.duration = document.querySelector(`${iframe} ~ .duration`);
    this.percent = document.querySelector(`${iframe} ~ input[type='range']`);

    const c = player.getCurrentTime();
    const d = player.getDuration();
    const current = this.humanTime(c);
    const duration = this.humanTime(d);

    // Static values.
    this.duration.textContent = duration;
    this.percent.max = Math.floor(d);

    // Dynamic values.
    if (!setup && !this.seeking) {
      this.current.textContent = current;
      this.percent.value = Math.floor(c);
    }

    // Set everything up on first run.
    if (setup) {
      this.setupPlayer(player);
    }
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
   * Converts a duration in human-friendly MM:SS format to seconds.
   * E.g., 4:32 = 272 seconds 
   * @param {string} duration 
   * @returns {number}
   */
  playerTime(duration) {
    if (!duration) return 0; // Bail since any zero value is falsy.

    const [minutes, seconds] = duration.split(':');
    return (parseInt(minutes) * 60) + parseInt(seconds);
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
      // Pause all Players and reset <button> elements before playing the active
      // video and updating its <button>.
      this.players.forEach(player => player.pauseVideo());
      this.buttons.forEach(button => this.updateButton(button, 'play'));
      active.playVideo();
      this.updateButton(button, 'pause');
    } else {
      // All other Players should already be paused, so only the active <button>
      // needs to be updated when its video is paused.
      active.pauseVideo();
      this.updateButton(button, 'play');
    }
  }

  /**
   * Helper method for rendering <button> elements with an SVG icon.
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
