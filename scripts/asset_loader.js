/*jslint browser:true */

const v_mp4 = "video/mp4";
const a_mp3 = "audio/mp3";

function loadURL(sourceElement, targetElement) {
    const isVideo = targetElement.includes("video");

    const url = document.getElementById(sourceElement).value;
    const type = inferMime(url, isVideo);

    let media;
    if (isVideo) {
        media = document.createElement("VIDEO");
        media.width = "320";
        media.height = "240";
    } else { //audio
        media = document.createElement("AUDIO");
    }
    media.src = url;
    media.type = type;
    media.controls = true;

    const toReplace = document.getElementById(targetElement);
    toReplace.parentNode.replaceChild(media, toReplace);
    media.id = targetElement; //Reuse targetElement id after replacing targetElement
    initListeners(media);
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
