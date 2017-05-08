/*jslint browser:true */

const v_mp4 = "video/mp4";
const a_mp3 = "audio/mp3";
let audioHash;
let videoHash;

window.onload = function () { //initialization
    const query = window.location.search; //example: ?q=abcdefabcdef1004
    if (query.startsWith("?q=")) {
        const videoUrl = "http://bit.ly/" + query.substring(3, 10);
        const audioUrl = "http://bit.ly/" + query.substring(10, 17);
        const audioDelta = query.substring(17) / 10;

        document.getElementById("video_url").value = videoUrl;
        document.getElementById("audio_url").value = audioUrl;

        loadURL("video_url", "video_element");
        loadURL("audio_url", "audio_element");

        if (audioDelta >= 0) {
            document.getElementById("audio_element").currentTime = audioDelta;
        } else {
            document.getElementById("video_element").currentTime = Math.abs(audioDelta);
        }

        setSync(true);
    }
};

function loadURL(sourceElement, targetElement) {
    const isVideo = targetElement.includes("video");

    const url = document.getElementById(sourceElement).value;
    const type = inferMime(url, isVideo);

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

    const toReplace = document.getElementById(targetElement);
    toReplace.parentNode.replaceChild(media, toReplace);
    media.id = targetElement; //Reuse targetElement id after replacing targetElement
    initControls(media);

    shortenURL(url, isVideo);
}

function inferMime(url, isVideo) {
    if (url.includes("://youtube.com") || url.includes("www.youtube.com") || url.startsWith("youtube.com")) {
        //youtube
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
