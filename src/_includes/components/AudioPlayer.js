/**
 * Class that uses the YouTube iframe API to provide custom controls for music
 * tracks. This widget loads up YouTube videos, then hides the actual video so
 * that the UI can look and feel like a simple audio controller.
 */
class AudioPlayer {
  buttons = [];
  ids = [];
  videos = [];

  setup() {
    this.injectJS();
    this.renderElements();
    this.addListeners();
    this.createVideos();
  }

  /**
   * Attaches a <script> element for the YouTube API.
   */
  injectJS() {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(script);
  }

  /**
   * Gets all the IDs for generating HTML and video objects, then renders child
   * elements for <iframe> replacement.
   */
  renderElements() {
    const elements = document.querySelectorAll('[data-video]');
    this.ids = [...elements].map(element => element.dataset.video);

    // The YouTube API doesn't like multi-line template literals, hence the
    // multiple/different lines of innerHTML.
    for (const [index, element] of elements.entries()) {
      element.innerHTML = `<div id="${this.ids[index]}"></div>`;
      element.innerHTML += `
        <button title="Play">
          ${this.renderIcon('play')}
        </button>
      `;
    }

    // Save references to all the buttons for updating their content on click.
    this.buttons = document.querySelectorAll('[data-video] > button');
  }

  /**
   * Adds a single listener for all clicks.
   */
  addListeners() {
    this.clickHandler = this.handleClick.bind(this);
    document.addEventListener('click', this.clickHandler);
  }

  /**
   * Makes a new Player for each video.
   */
  createVideos() {
    window.onYouTubeIframeAPIReady = () => {
      for (const id of this.ids) {
        const player = new YT.Player(id, {
          videoId: id,
          events: {
            onReady: this.onReady.bind(this),
          },
          playerVars: {
            'controls': 0,
            'enablejsapi': 1,
            'fs': 0,
            'playsinline': 1,
          },
        });
      }
    }
  }

  /**
   * Saves all the generated video objects on the page for auto-toggling their
   * play/pause state.
   * @param {Event} event
   */
  onReady(event) {
    this.videos.push(event.target);
  }

  /**
   * Gets the click target and updates the rest of the DOM if a play/pause
   * <button> was clicked.
   * @param {Event} event
   */
  handleClick(event) {
    const target = event.target;

    if (target.tagName.toLowerCase() !== 'button') return;
    
    const button = target;
    const iframe = button.previousElementSibling || button.nextElementSibling;
    const active = this.videos.find(video => video.g.id === iframe.id);

    if (button.title === 'Play') {
      // Reset all <button> elements and videos.
      for (const button of this.buttons) {
        button.title = 'Play';
        button.innerHTML = this.renderIcon('play');
      }
      this.videos.forEach(video => video.pauseVideo());
      
      // Update the active <button> and play the active video.
      button.title = 'Pause';
      button.innerHTML = this.renderIcon('pause');
      active.playVideo();
    } else {
      // All other videos should already be aused, so only the active <button>
      // needs to be updated when its video is paused.
      button.title = 'Play';
      button.innerHTML = this.renderIcon('play');
      active.pauseVideo();
    }
  }

  /**
   * Helper function for rendering <button> elements with an SVG icon.
   * @param {string} type 
   * @returns {SVGElement}
   */
  renderIcon(type) {
    const path = (type === 'play') ? 'M6,3 L6,21 L21,12 Z' : 'M6,4 L6,20 L10,20 L10,4 M14,4 L14,20 L18,20 L18,4';

    return `
      <svg aria-hidden="true" viewbox="0 0 24 24">
        <path d="${path}"/>
      </svg>
    `;
  }
}

const player = new AudioPlayer;
player.setup();
