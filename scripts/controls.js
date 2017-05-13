/*jslint browser:true */

let audioDelta = 0; //audio typically a few minutes ahead of movie
let synced = false;
let audioElement;
let videoElement;

function initControls(media) {
    if (media.nodeName === "AUDIO") {
        audioElement = media;
    } else if (media.nodeName === "VIDEO") {
        videoElement = media;
        videoElement.onwaiting = function () { // hack to show loading gif when buffering, but not when first loading
            videoElement.poster = "/assets/loading.gif";
        };
    }

    if (audioElement && videoElement) {
        setSync(false); //new resource loaded. If data_loader initializing it will explicitly call setSync(true)
        watchSync();
    }
}

function resync(toVideo) {
    console.log("resync. ToVideo=" + toVideo);

    if (toVideo) {
        if (audioDelta > audioElement.currentTime) { //pre-movie chat
            //show something in UI
        } else if (videoElement.currentTime > audioElement.duration - audioDelta) { //video longer than audio

        } else if (audioElement.currentTime - audioDelta > videoElement.duration) { //audio longer than video

        } else { //within range of both audio and video
            audioElement.currentTime = videoElement.currentTime + audioDelta;
        }
    } else {
        videoElement.currentTime = audioElement.currentTime - audioDelta;
    }
}

//Ensure sync never drifts by more than 0.25 seconds
function watchSync() {
    if (audioDelta && !audioElement.paused && !videoElement.paused &&
            ((Math.abs(audioElement.currentTime - videoElement.currentTime) > Math.abs(audioDelta) + 0.25) ||
            (Math.abs(audioElement.currentTime - videoElement.currentTime) < Math.abs(audioDelta) - 0.25))) {
        console.log("watchSync is resyncing");
        resync(true); //usually video is the one stuttering, resync to video
        //TODO handle audio stutter
    }
    setTimeout(watchSync, 1000); //recheck every second
}

function logDelta() {
    console.log((audioDelta - (audioElement.currentTime - videoElement.currentTime)) + " : " + (audioElement.currentTime - videoElement.currentTime));
}

function setDelta(audioAdjust, offset) {
    if (offset) {
        audioDelta = offset + (audioElement.currentTime - videoElement.currentTime);
    } else {
        audioDelta += audioAdjust;
    }
    buildSharingURL();
}

function setSync(forceSync) {
    if ("undefined" !== typeof forceSync) {
        synced = !forceSync;
    }

    if (!synced) {
        synced = true;
        document.getElementById("sync_toggle").textContent = "Unlock sync";
        audioDelta = audioElement.currentTime - videoElement.currentTime;
        audioElement.removeAttribute("controls");

        //synchronize controls to video
        videoElement.onpause = function () {
            console.log("videoElement on pause");
            audioElement.pause();
        };
        videoElement.onplay = function () {
            console.log("videoElement on play");
            audioElement.play();
        };
        videoElement.onseeked = function () {
            console.log("videoElement on seeked");
            resync(true);
        };

        //synchronize buffering between both
        videoElement.oncanplaythrough = function () {
            console.log("onVideoCanPlay");
            audioElement.play();
        };
        audioElement.oncanplaythrough = function () {
            console.log("onAudioCanPlay");
            videoElement.play();
        };
        videoElement.onwaiting = function () {
            console.log("videoelement onwaiting");
            audioElement.pause();
            videoElement.poster = "/assets/loading.gif";
        };
        audioElement.onwaiting = function () {
            console.log("audioelement onwaiting");
            videoElement.pause();
        };

        //allow the longer file to keep playing
        videoElement.onended = function () {
            if (!audioElement.ended) {
                audioElement.play();
            }
        };
        audioElement.onended = function () {
            if (!videoElement.ended) {
                videoElement.play();
            }
        };

        videoElement.play(); //Sync is usually done with audio playing and video paused. Force play of both.
        buildSharingURL();
    } else {
        synced = false;
        document.getElementById("sync_toggle").textContent = "Lock sync";
        audioDelta = 0;
        audioElement.setAttribute("controls", "controls");
        videoElement.onpause = null;
        videoElement.onplay = null;
        videoElement.onseeked = null;
        videoElement.oncanplaythrough = null;
        audioElement.oncanplaythrough = null;
        videoElement.onwaiting = null;
        audioElement.onwaiting = null;

        videoElement.pause();
        audioElement.pause();
    }
}

function buildSharingURL(remove = false) {
    if (remove) {
        document.getElementById("share_url").textContent = null;
    } else if (videoHash && audioHash) {
        const shareUrl = "https://jakehilborn.github.io/thync/?q=" + videoHash + audioHash + Math.round(audioDelta * 10);
        document.getElementById("share_url").textContent = "Share this dub: " + shareUrl;
    }
}

// // 2. This code loads the IFrame Player API code asynchronously.
// var tag = document.createElement('script');
//
// tag.src = "https://www.youtube.com/iframe_api";
// var firstScriptTag = document.getElementsByTagName('script')[0];
// firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
//
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
