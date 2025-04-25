// Attach a <script> element for the YouTube API.
const script = document.createElement('script');
script.src = 'https://www.youtube.com/iframe_api';
document.body.appendChild(script);

// Get all the custom elment IDs for generating HTML and video objects.
const elements = document.querySelectorAll('[data-video]');
const ids = [...elements].map(element => element.dataset.video);

// Inject elements for <iframe> replacement. The YouTube API doesn't like
// multi-line template literals, hence the multiple lines of innerHTML.
for (const [index, element] of elements.entries()) {
  element.innerHTML = `<div id="${ids[index]}"></div>`;
  element.innerHTML += `
    <button title="Play">
      ${renderIcon('play')}
    </button>
  `;
}

// Save references to all the buttons for updating their labels on click.
const buttons = document.querySelectorAll('[data-video] > button');

// Single listener for all clicks.
const clickHandler = handleClick.bind(this);

// Empty array for saving all the video objects created by the YouTube API.
const videos = [];

/**
 * Makes a new Player for each video, then add a 'click' handler for
 * play/pause control over all videos.
 */
function onYouTubeIframeAPIReady() {
	for (const id of ids) {
		const player = new YT.Player(id, {
      videoId: id,
			events: {
        onReady: onReady,
      },
      playerVars: {
        'controls': 0,
        'enablejsapi': 1,
        'fs': 0,
        'playsinline': 1,
      },
		});
	}

  document.addEventListener('click', clickHandler);
}

/**
 * Saves all the generated video objects on the page for auto-toggling their
 * play/pause state.
 */
function onReady(event) {
  videos.push(event.target);
}

/**
 * Gets the click target and updates the rest of the DOM if a play/pause
 * <button> was clicked.
 */ 
function handleClick(event) {
  const target = event.composedPath()[0];

  if (target.tagName.toLowerCase() !== 'button') return;
  
  const button = target;
  const iframe = button.previousElementSibling || button.nextElementSibling;
  const active = videos.find(video => video.g.id === iframe.id);

  if (button.title === 'Play') {
    videos.forEach(video => video.pauseVideo());
    buttons.forEach(button => {
      button.title = 'Play';
      button.innerHTML = renderIcon('play');
    });
    active.playVideo();
    button.title = 'Pause';
    button.innerHTML = renderIcon('pause');
  } else {
    active.pauseVideo();
    button.title = 'Play';
    button.innerHTML = renderIcon('play');
  }
}

function renderIcon(type) {
  const path = (type === 'play') ? 'M6,3 L6,21 L21,12 Z' : 'M6,4 L6,20 L10,20 L10,4 M14,4 L14,20 L18,20 L18,4';
  
  return `
    <svg aria-hidden="true" viewbox="0 0 24 24">
      <path d="${path}"/>
    </svg>
  `;
}
