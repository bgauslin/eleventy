/**
 * Custom element that embeds a YouTube video of audis, adds controls, and
 * hides the video from view.
 */

// TODO: Review this GitHub post for multiple videos on a single page:
// https://gist.github.com/bajpangosh/d322c4d7823d8707e19d20bc71cd5a4f

customElements.define('audio-player', class extends HTMLElement {
  constructor() {
    super();
    this.clickHandler = this.playPause.bind(this);
    this.play = false;
    this.videoId = this.getAttribute('embed');
  }

  connectedCallback() {
    this.setup();
    this.addEventListener('click', this.clickHandler);
  }

  disconnectedCallback() {
    this.setup();
    this.removeEventListener('click', this.clickHandler);
  }
  
  onReady() {
    console.log('onReady', event);
  }
  
  onStateChange() {
    console.log('onStateChange', event.data);

      // -1  unstarted
      //  0  ended
      //  1  playing
      //  2  paused
      //  3  buffering
      //  5  video cued
  }
  
  playPause(event) {
    if (event.target !== this.button) return;

    this.play = !this.play;
    this.button.textContent = this.play ? 'Pause' : 'Play';
    
    if (this.play) {
      this.player.playVideo();
    } else {
      this.player.pauseVideo();
    }
  }

  showPlayback() {
    const interval = setInterval(() => {
      const fraction = this.player.getVideoLoadedFraction();
      const state = this.player.getPlayerState();
      const time = this.player.getCurrentTime();
      const duration = this.player.getDuration();
    }, 1000);
  }

  setup() {
    this.innerHTML = `
      <div id="video"></div>
      <button>Play</button>
    `;

    this.button = this.querySelector('button');
    
    if (!window.YT) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      this.appendChild(script);
    }

    window.onYouTubeIframeAPIReady = () => {
      this.player = new YT.Player('video', {
        videoId: this.videoId,
        events: {
          'onReady': this.onReady.bind(this),
          'onStateChange': this.onStateChange.bind(this),
        },
      });
    }
  }
});
