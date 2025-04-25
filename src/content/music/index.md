---
layout: base
permalink: music/index.html

title: Music
description: Music description goes here
classname: music
---

<av-player video="Lrle0x_DHBM"></av-player>
<av-player video="5X-Mrc2l1d0"></av-player>
<av-player video="ViwtNLUqkMY"></av-player>

<style>
av-player {
  display: grid;
  grid: auto auto / auto;
  max-inline-size: 30rem;
}

av-player > iframe {
  aspect-ratio: 16 / 9;
  block-size: auto;
  grid-area: 1 / 1;
  inline-size: 100%;
  place-self: center;
}

av-player > button {
  appearance: none;
  background-color: #eee;
  block-size: 2.75rem;
  border: none;
  border-radius: 2.75rem;
  cursor: pointer;
  grid-area: 2 / 1;
  outline: none;
  padding-inline: 1rem;
  place-self: center;
}
</style>

<script>
// Attach a <script> element for the YouTube API.
const script = document.createElement('script');
script.src = 'https://www.youtube.com/iframe_api';
document.body.appendChild(script);

// Get all the custom elment IDs for generating HTML and video objects.
const elements = document.querySelectorAll('av-player');
const ids = [...elements].map(element => element.getAttribute('video'));

// Inject elements for <iframe> replacement. The YouTube API doesn't like
// multi-line template literals, hence the multiple lines of innerHTML.
for (const [index, element] of elements.entries()) {
  element.innerHTML = `<div id="${ids[index]}"></div>`;
  element.innerHTML += '<button>Play</button>';
}

// Save references to all the buttons for updating their labels on click.
const buttons = document.querySelectorAll('av-player > button');

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
        onStateChange: onStateChange,
			},
      playerVars: {
        'controls': 0,
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

function onStateChange(event) {
  const state = event.data;
  console.log('state', state);

  switch (state) {
    case 0:  // ended
    case 2:  // paused
      pauseAllVideos();
      break;
    case 1:  // playing
      updatePlayingButton();
      break;
    case 3:  // buffering
    case 5:  // video cued
      break;
    default:
      break;
  }
}

/**
 * Pauses all the videos and resets their <button> labels. 
 */
function pauseAllVideos() {
  buttons.forEach(button => button.textContent = 'Play');
  videos.forEach(video => video.pauseVideo());
}

function updatePlayingButton() {
  console.log('updatePlayingButton()');
}

/**
 * Gets the click target and updates the rest of the DOM if a play/pause
 * <button> was clicks.
 */ 
function handleClick(event) {
  const target = event.composedPath()[0];

  if (target.tagName.toLowerCase() !== 'button') return;

  let label = 'Pause';
  const iframe = target.previousElementSibling || target.nextElementSibling;
  const current = videos.find(video => video.g.id === iframe.id);

  if (target.textContent === 'Play') {
    pauseAllVideos();
    current.playVideo();
  } else {
    current.pauseVideo();
    label = 'Play';
  }
  target.textContent = label;
}
</script>