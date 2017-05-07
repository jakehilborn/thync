/*jslint browser:true */

let videoDelta = 0;
let audioElement;
let videoElement;
let audio_ready = false;
let video_ready = false;

function initListeners(media) {
    // media.onplay = play;
    // media.onpause = pause;

    if (media.nodeName === "AUDIO") {
        audioElement = media;
    } else if (media.nodeName === "VIDEO") {
        videoElement = media;
        videoElement.onwaiting = function () {
            audioElement.pause();
        };
    }

    if (audioElement && videoElement) {
        watchSync();
    }
}

function play() {
    audioElement.play();
    videoElement.play();
    audioElement.addEventListener("canplaythrough", onAudioCanPlay);
    videoElement.addEventListener("canplaythrough", onVideoCanPlay);
}

function pause() {
    audioElement.pause();
    videoElement.pause();
    audioElement.removeEventListener("canplaythrough", onAudioCanPlay);
    videoElement.removeEventListener("canplaythrough", onVideoCanPlay);
}

function rewind(time) {
    resync(audioElement.currentTime - time, null);
}

function forward(time) {
    resync(audioElement.currentTime + time, null);
}

function resync(audioOffset, videoOffset) {
    videoElement.pause();
    audioElement.pause();

    audio_ready = false;
    video_ready = false;

    if (videoOffset) {
        audioElement.currentTime = videoOffset - videoDelta;
        videoElement.currentTime = videoOffset;
    } else {
        audioElement.currentTime = audioOffset;
        videoElement.currentTime = audioOffset + videoDelta;
    }
}

function onVideoCanPlay() {
    video_ready = true;
    if (audio_ready) {
        audioElement.play();
        videoElement.play();
    }
}

function onAudioCanPlay() {
    audio_ready = true;
    if (video_ready) {
        audioElement.play();
        videoElement.play();
    }
}

function watchSync() {
    if (!audioElement.paused && !videoElement.paused &&
            Math.abs(audioElement.currentTime - videoElement.currentTime) > Math.abs(videoDelta) + 0.25) {
        resync(null, videoElement.currentTime); //usually video is the one stuttering
        //TODO handle audio stutter
    }
    setTimeout(watchSync, 1000); //recheck every second
}

function logDelta() {
    console.log(audioElement.currentTime - videoElement.currentTime);
    // setTimeout(logDelta(),100);
}

// // 2. This code loads the IFrame Player API code asynchronously.
// var tag = document.createElement('script');
//
// tag.src = "https://www.youtube.com/iframe_api";
// var firstScriptTag = document.getElementsByTagName('script')[0];
// firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
//
// // 3. This function creates an <iframe> (and YouTube video_div)
// //    after the API code downloads.
// var youtubePlayer;
// function onYouTubeIframeAPIReady() {
//     youtubePlayer = new YT.Player('video_element', {
//         height: '390',
//         width: '640',
//         videoId: 'M7lc1UVf-VE',
//         events: {
//             'onReady': onPlayerReady,
//             'onStateChange': onPlayerStateChange
//         }
//     });
// }
//
// // 4. The API will call this function when the video_div video_div is ready.
// function onPlayerReady(event) {
//     event.target.playVideo();
// }
//
// // 5. The API calls this function when the video_div's state changes.
// //    The function indicates that when playing a video_div (state=1),
// //    the video_div should play for six seconds and then stop.
// var done = false;
// function onPlayerStateChange(event) {
//     if (event.data == YT.PlayerState.PLAYING && !done) {
//         setTimeout(stopVideo, 6000);
//         done = true;
//     }
// }
// function stopVideo() {
//     youtubePlayer.stopVideo();
// }
