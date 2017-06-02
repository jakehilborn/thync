/*jslint browser:true */

let audioDelta = 0; //audio typically a few minutes ahead of movie
let synced = false;
let audioElement;
let videoElement;
const mediaErrorMessage = document.getElementById("media_error_message");

function initControls(media) {
    if (media.nodeName === "AUDIO") {
        audioElement = media;
        audioElement.onerror = function () {
            onMediaError(audioElement);
        };
    } else if (media.nodeName === "VIDEO") {
        videoElement = media;
        videoElement.onwaiting = function () { // hack to show loading gif when buffering, but not when first loading
            videoElement.poster = "/thync/assets/loading.gif";
        };
        videoElement.onerror = function () {
            onMediaError(videoElement);
        };
    }

    mediaErrorMessage.textContent = null;

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
            videoElement.poster = "/thync/assets/loading.gif";
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

        videoElement.play(); //Sync is usually clicked with audio playing and video paused. Force play of both.
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
    } else if (videoID && audioID) {
        const shareUrl = "https://jakehilborn.github.io/thync/?q=" + formatVersion + videoID + audioID + Math.round(audioDelta * 10);
        document.getElementById("share_url").textContent = "Share this dub: " + shareUrl;
    }
}

function onMediaError(mediaRef) {
    const mediaPlaceholder = document.createElement("DIV");
    mediaRef.parentNode.replaceChild(mediaPlaceholder, mediaRef);
    mediaPlaceholder.id = mediaRef.id; //Reuse targetElement id after replacing targetElement

    const messageContent = "Unable to load " + (mediaRef.id.includes("video") ? "video" : "audio") + ". The link may have expired. Please try a different source.";
    mediaErrorMessage.textContent = messageContent;

    setSync(false);

    alert(messageContent);
}

function addVidSourceOption(url, megabytes, number) {
    const sizeMessage = megabytes === null ? "" : " - " + megabytes + " MB";

    const input = document.createElement("a"); //create hyperlink
    input.textContent = "video version " + number + sizeMessage;
    input.onclick = function () {
        loadMedia("video_url", url);
    };

    input.appendChild(document.createElement("br"));
    const video_quality = document.getElementById("video_quality");
    video_quality.parentNode.insertBefore(input, video_quality);
}
