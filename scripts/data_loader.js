/*jslint browser:true */

const videoSourceElement = "video_url";
const audioSourceElement = "audio_url";
const videoTargetElement = "video_element";
const audioTargetElement = "audio_element";
const youtube = "youtube";
const v_mp4 = "video/mp4";
const a_mp3 = "audio/mp3";
// let youtubeAPIInitialized;
// let youtubePendingVideo;
// let youtubePendingAudio;
let videoHash;
let audioHash;

window.onload = function () { //initialization
    const query = window.location.search; //example: ?q=abcdefabcdef1004
    if (query.startsWith("?q=")) {
        const videoUrl = "http://bit.ly/" + query.substring(3, 10);
        const audioUrl = "http://bit.ly/" + query.substring(10, 17);
        const audioDelta = query.substring(17) / 10;

        document.getElementById(videoSourceElement).value = videoUrl;
        document.getElementById(audioSourceElement).value = audioUrl;

        loadMedia(videoSourceElement);
        loadMedia(audioSourceElement);

        if (audioDelta >= 0) {
            document.getElementById(audioTargetElement).currentTime = audioDelta;
        } else {
            document.getElementById(videoTargetElement).currentTime = Math.abs(audioDelta);
        }

        setSync(true);
    }
};

function loadMedia(sourceElement, overrideURL) {
    const isVideo = sourceElement.includes("video");
    const url = overrideURL || document.getElementById(sourceElement).value;
    const type = inferMime(url, isVideo);

    // if (type === youtube && !youtubeAPIInitialized) {
    //     if (isVideo) {
    //         youtubePendingVideo = url;
    //     } else {
    //         youtubePendingAudio = url;
    //     }
    //     initYouTube();
    //     return;
    // }

    if (type === youtube) {
        getDirectYTLink(url, sourceElement);
        return;
    }

    let media;
    if (isVideo) {
        media = document.createElement("VIDEO");
        media.width = "960";
        media.height = "640";
    } else { //audio
        media = document.createElement("AUDIO");
    }
    media.src = url;
    media.type = type;
    media.controls = "controls";
    media.controlsList = "nodownload";
    media.preload = "auto";

    const toReplace = document.getElementById(isVideo ? videoTargetElement : audioTargetElement);
    toReplace.parentNode.replaceChild(media, toReplace);
    media.id = (isVideo ? videoTargetElement : audioTargetElement); //Reuse targetElement id after replacing targetElement
    initControls(media);

    shortenURL(url, isVideo);
}

// function initYouTube() {
//     //Loads the IFrame Player API code asynchronously
//     const tag = document.createElement("script");
//     tag.src = "https://www.youtube.com/iframe_api";
//     const firstScriptTag = document.getElementsByTagName("script")[0];
//     firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
// }
//
// function onYouTubeIframeAPIReady() {
//     youtubeAPIInitialized = true;
//     if (youtubePendingVideo) {
//         loadMedia(videoSourceElement, youtubePendingVideo);
//         youtubePendingVideo = null;
//     }
//
//     if (youtubePendingAudio) {
//         loadMedia(audioSourceElement, youtubePendingAudio);
//         youtubePendingAudio = null;
//     }
// }
//
// function onPlayerReady(event) {
//     event.target.playVideo();
// }

// new YT.Player('video_element', {
//     height: '390',
//     width: '640',
//     videoId: 'M7lc1UVf-VE',
//     events: {
//         'onReady': onPlayerReady
//     }
// });

function inferMime(url, isVideo) {
    if (url.includes("://youtube.com") || url.includes("www.youtube.com") || url.startsWith("youtube.com") ||
            url.includes("://youtu.be") || url.includes("www.youtu.be") || url.startsWith("youtu.be")) {
        return youtube;
    } else if (url.includes(".mp4")) {
        return v_mp4;
    } else if (url.includes(".webm")) {

    } else if (url.includes(".ogv")) {

    } else if (url.includes(".mp3")) {
        return a_mp3;
    } else if (url.includes(".ogg")) {

    } else if (url.includes("mp4")) {
        return v_mp4;
    } else if (url.includes("webm")) {

    } else if (url.includes("ogv")) {

    } else if (url.includes("mp3")) {
        return a_mp3;
    } else if (url.includes("ogg")) {

    }
}

function getDirectYTLink(url, sourceElement) {
    const request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === 4) {
            if (request.status >= 200 && request.status < 300) {
                const response = JSON.parse(request.responseText);
                loadMedia(sourceElement, response.url);
            } else {
                alert("Failed to load YouTube url");
            }
        }
    };
    request.open("GET", "https://uploadbeta.com/api/video/?cached&video=" + url);
    request.send();
}

function shortenURL(url, isVideo) {
    if (url.includes("bit.ly")) {
        if (isVideo) {
            videoHash = url.substring(url.length - 7);
        } else {
            audioHash = url.substring(url.length - 7);
        }
        return;
    }

    const request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            const response = JSON.parse(request.responseText);
            if (isVideo) {
                videoHash = response.data.hash;
            } else {
                audioHash = response.data.hash;
            }
        }
    };
    request.open("GET",
            "https://api-ssl.bitly.com/v3/shorten?access_token=8bce4d63dc868bb564949ccb2966cc8c69dfe19c&longUrl=" +
            encodeURIComponent(url));
    request.send();
}
