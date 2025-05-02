/**
 * Singleton custom element that uses the YouTube IFrame Player API to provide
 * custom controls for music tracks. This widget loads up YouTube videos, then
 * hides each video so the UI can behave more like a simple audio controller.
 */
customElements.define('audio-player', class AudioPlayer extends HTMLElement {
  buttons = [];  // <HTMLButtonElement[]>
  duration;      // <HTMLElement>
  elapsed;       // <HTMLElement>
  interval = 0;  // <number>
  players = [];  // <YT.Player[]>
  ranges = [];   // <HTMLInputElement[]>
  scrubber;      // <HTMLInputElement>
  seek = false;  // <boolean>

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
    this.setup();
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
   * Injects JS for the YouTube IFrame Player API, renders elements into the
   * DOM, and creates Player instances.
   */
  setup() {
    // Attach a <script> element to the DOM for the YouTube IFrame API.
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(script);

    // Get all the IDs for generating Player instances and rendering HTML child
    // elements for UI controls and <iframe> replacement.
    const elements = document.querySelectorAll('[data-player]');
    const ids = [...elements].map(element => element.dataset.player);

    // The YouTube API doesn't like multi-line template literals, and it's
    // easier to make the <button> with old-school JS, hence the mix of DOM
    // insertion types.
    for (const [index, element] of elements.entries()) {
      const id = ids[index];

      // Element the API will replace with an <iframe>.
      element.innerHTML = `<div id="${id}"></div>`;

      // Play/pause button.
      const button = document.createElement('button');
      this.updateButton(button, 'play');
      element.appendChild(button);
      
      // Scrubber.
      element.innerHTML += `
        <time class="elapsed"></time>
        <time class="duration"></time>
        <input
          aria-label="Move the playhead forward or backward"
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

    // Generate a new YT.Player instance for each video.
    window.onYouTubeIframeAPIReady = () => {
      for (const id of ids) {
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
   * Tracks elapsed time for the active Player.
   * @param {Event} event
   */
  onStateChange(event) {    
    const player = event.target;
    const state = player.getPlayerState();

    // Auto-update elapsed time.
    if (state === YT.PlayerState.PLAYING) {
      this.updateElements(player);
      this.interval = setInterval(() => this.updateElements(player), 500);
    }

    // Stop auto-updating elapsed time.
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

    this.scrubber = document.querySelector(`${iframe} ~ input[type="range"]`);
    
    const start = parent ? parent.dataset.start : '0:00';
    const time = this.playerTime(start);

    player.seekTo(time);
    player.pauseVideo();

    this.elapsed.textContent = start;
    this.scrubber.value = time;
    this.updateButton(button, 'play');
    this.setTrackSize();
  }

  /**
   * Updates width of the elapsed side of the range track.
   */
  setTrackSize() {
    const {max, value} = this.scrubber;
    const percent = Math.floor((value / max) * 100);
    this.scrubber.style.setProperty('--elapsed', `${percent}%`);
  }

  /**
   * Updates the elapsed time element as a visual indicator of user-selected
   * time to jump to.
   * @param {Event} event
   */
  handleRange(event) {
    this.scrubber = event.target;
    const {value} = this.scrubber;
    const id = this.scrubber.dataset.for;

    // Get element for the active Player.
    this.elapsed = document.querySelector(`iframe[id="${id}"] ~ .elapsed`);

    // Update the UI.
    this.elapsed.textContent = this.humanTime(value);
    this.elapsed.setAttribute('datetime', this.datetimeDuration(value));

    this.setTrackSize();
  }

  /**
   * Sets a guard that prevents the elapsed time from auto-updating while user
   * moves the playhead with the scrubber.
   * @param {Event} event
   */
  handleDown(event) {
    if (event.target.type === 'range') {
      this.seek = true;
    }
  }

  /**
   * Jumps to selected time and prevents auto-playing if the player is cued up
   * or paused. The guard is always removed on up/end events regardless of the
   * event target.
   * @param {Event} event
   */
  handleUp(event) {
    this.seek = false;
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
   * Gets references to active player's UI elements and populates them.
   * @param {YT.Player} player
   * @param {boolean=} setup
   */
  updateElements(player, setup = false) {
    const selector = `iframe[id="${player.g.id}"]`;

    this.elapsed = document.querySelector(`${selector} ~ .elapsed`);
    this.duration = document.querySelector(`${selector} ~ .duration`);
    this.scrubber = document.querySelector(`${selector} ~ input[type='range']`);

    const c = player.getCurrentTime();
    const d = player.getDuration();
    const current = this.humanTime(c);
    const duration = this.humanTime(d);
    const datetime = this.datetimeDuration(c);

    // Static values.
    this.duration.textContent = duration;
    this.duration.setAttribute('datetime', this.datetimeDuration(d));

    this.scrubber.max = Math.floor(d);

    // Dynamic values.
    if (!setup && !this.seek) {
      this.elapsed.textContent = current;
      this.elapsed.setAttribute('datetime', datetime);
      this.scrubber.value = Math.floor(c);
      this.setTrackSize();
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
   * Converts a duration in seconds to duration format.
   * E.g., 272 seconds = T4M32S
   * @param {string} duration 
   * @returns {string}
   */
  datetimeDuration(duration) {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `T${minutes}M${seconds}S`;
  }

  /**
   * Converts a duration in human-friendly MM:SS format to seconds.
   * E.g., 4:32 = 272 seconds 
   * @param {string} duration 
   * @returns {number}
   */
  playerTime(duration) {
    if (duration) {
      const [minutes, seconds] = duration.split(':');
      return (parseInt(minutes) * 60) + parseInt(seconds);
    } else {
      return 0;
    }
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
