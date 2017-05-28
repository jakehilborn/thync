/*jslint browser:true */

const videoSourceElement = "video_url";
const audioSourceElement = "audio_url";
const videoTargetElement = "video_element";
const audioTargetElement = "audio_element";
let youtubeAPIInitialized = false;
let youtubePendingVideo;
let youtubePendingAudio;
let videoID;
let audioID;

const youtube = "youtube";
const v_mp4 = "video/mp4";
const a_mp3 = "audio/mp3";
const mediaMap = [
    {code: "0", type: youtube},
    {code: "1", type: v_mp4},
    {code: "2", type: a_mp3}
];

window.onload = function () { //initialization
    const queryString = window.location.search;
    if (queryString.startsWith("?q=")) {
        const args = parseQueryString(queryString);

        document.getElementById(videoSourceElement).value = args.videoUrl;
        document.getElementById(audioSourceElement).value = args.audioUrl;

        loadMedia(videoSourceElement, args.videoUrl, args.videoType);
        loadMedia(audioSourceElement, args.audioUrl, args.audioType);

        if (args.audioDelta >= 0) {
            document.getElementById(audioTargetElement).currentTime = args.audioDelta;
        } else {
            document.getElementById(videoTargetElement).currentTime = Math.abs(args.audioDelta);
        }

        setSync(true);
    }
};

//example: ?q=00abcdefg2hijklmn1004
//0: queryString formatVersion
//0: media type
//abcdefg: video bitly hash
//2: media type
//hijklmn: audio bitly hash
//1004: audio delta in seconds*10
function parseQueryString(queryString) {
    const args = {};
    if (queryString.charAt(3) === "0") {
        args.videoType = mediaCodeToType(queryString.charAt(4));
        args.videoUrl = "http://bit.ly/" + queryString.substring(5, 12);
        args.audioType = mediaCodeToType(queryString.charAt(12));
        args.audioUrl = "http://bit.ly/" + queryString.substring(13, 20);
        args.audioDelta = queryString.substring(20) / 10;
    }

    return args;
}

function mediaCodeToType(code) {
    for (let i = 0; i < mediaMap.length; i++) {
        if (code === mediaMap[i].code) {
            return mediaMap[i].type;
        }
    }
}

function mediaTypeToCode(type) {
    for (let i = 0; i < mediaMap.length; i++) {
        if (type === mediaMap[i].type) {
            return mediaMap[i].code;
        }
    }
}

function loadMedia(sourceElement, overrideURL, overrideType) {
    const isVideo = sourceElement.includes("video");
    const url = extractVideoFiles(overrideURL || document.getElementById(sourceElement).value)[0];
    const type = overrideType || inferMime(url, isVideo);

    if (type === youtube && !youtubeAPIInitialized) {
        if (isVideo) {
            youtubePendingVideo = url;
        } else {
            youtubePendingAudio = url;
        }
        initYouTube(); //will call putMediaInDOM after YouTube API has loaded
    } else {
        putMediaInDOM(isVideo, url, type);
    }

    buildMediaID(isVideo, url, isVideo);
}

function putMediaInDOM(isVideo, url, type) {
    let media;
    const targetElement = isVideo ? videoTargetElement : audioTargetElement;
    if (type === youtube) {
        const videoId = youTubeGetID(url);

        new YT.Player(targetElement, {
            height: "390",
            width: "640",
            videoId: videoId,
            events: {
                "onReady": onPlayerReady
            }
        });
        return
    }

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

    const toReplace = document.getElementById(targetElement);
    toReplace.parentNode.replaceChild(media, toReplace);
    media.id = (targetElement); //Reuse targetElement id after replacing targetElement
    initControls(media);
}

function initYouTube() {
    //Loads the IFrame Player API code asynchronously
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function onYouTubeIframeAPIReady() {
    youtubeAPIInitialized = true;
    if (youtubePendingVideo) {
        putMediaInDOM(true, youtubePendingVideo, youtube);
        youtubePendingVideo = null;
    }

    if (youtubePendingAudio) {
        putMediaInDOM(false, youtubePendingVideo, youtube);
        youtubePendingAudio = null;
    }
}

function onPlayerReady(event) {
    event.target.playVideo();
}

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

// Source: https://gist.github.com/takien/4077195
function youTubeGetID(url){
    let ID = "";
    url = url.replace(/(>|<)/gi,"").split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    if(url[2] !== undefined) {
        ID = url[2].split(/[^0-9a-z_\-]/i);
        ID = ID[0];
    }
    else {
        ID = url;
    }
    return ID;
}

// function getDirectYTLink(isVideo, url) {
//     const request = new XMLHttpRequest();
//     request.onreadystatechange = function () {
//         if (request.readyState === 4) {
//             if (request.status >= 200 && request.status < 300) {
//                 const response = JSON.parse(request.responseText);
//                 putMediaInDOM(isVideo, response.url);
//             } else {
//                 alert("Failed to load YouTube url");
//             }
//         }
//     };
//     request.open("GET", "https://uploadbeta.com/api/video/?cached&video=" + url);
//     request.send();
// }

function extractVideoFiles(s) {
    const matches = new Set(); //using a set to only keep unique URLs

    const len = s.length;
    for (let i = 0; i < len; i++) {
        if (s[i] === "m" && s[i + 1] === "p" && s[i + 2] === "4") {
            let beg = i;
            let end = i + 2;
            while (beg >= 0 && s[beg] !== "\"") {
                beg--;
            }

            //if beg less than 4 this is the case where the user entered the mp4 url directly instead of an HTML page
            if (beg >= 4 && s.substring(beg - 4, beg) !== "src=") {
                continue; //this mp4 is not in the src tag, often we find mp4 in the type tag.
            }

            while (end < len && s[end] !== "\"") {
                end++;
            }

            //HTML decode the mp4 match. Some sites HTML encode strings multiple times, so decode 3 times.
            matches.add(he.decode(he.decode(he.decode(s.substring(beg + 1, end)))));
        }
    }

    return Array.from(matches);
}

function buildMediaID(isVideo, url, type) {
    const mediaCode = mediaTypeToCode(type);

    if (url.includes("bit.ly")) {
        if (isVideo) {
            videoID = url.substring(url.length - 7);
        } else {
            audioID = url.substring(url.length - 7);
        }
        return;
    }

    const request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            const response = JSON.parse(request.responseText);
            if (isVideo) {
                videoID = mediaCode + response.data.hash;
            } else {
                audioID = mediaCode + response.data.hash;
            }
        }
    };
    request.open("GET",
            "https://api-ssl.bitly.com/v3/shorten?access_token=8bce4d63dc868bb564949ccb2966cc8c69dfe19c&longUrl=" +
            encodeURIComponent(url));
    request.send();
}
