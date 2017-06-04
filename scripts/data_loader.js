/*jslint browser:true */

const videoSourceElement = "video_url";
const audioSourceElement = "audio_url";
const videoTargetElement = "video_element";
const audioTargetElement = "audio_element";
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

    let mediaSource = overrideURL || document.getElementById(sourceElement).value;
    if (isVideo) {
        const urls = extractVideoFiles(mediaSource);
        if (urls.length > 1) {
            getVideoSizes(urls);
            mediaSource = urls[0];
        }
    }
    const type = overrideType || inferMime(mediaSource, isVideo);

    if (type === youtube) {
        mediaSource = getDirectYTLink(isVideo, mediaSource, 0);
        return;
    }

    if (document.getElementById(sourceElement).value.length > 5000) {
        //If user copies in whole web page the textbox will be unresponsive, now that we have the data remove the text.
        document.getElementById(sourceElement).value = "";
    }

    putMediaInDOM(isVideo, mediaSource, type);
    buildMediaID(isVideo, mediaSource, type);
}

function putMediaInDOM(isVideo, url, type) {
    let media;
    const targetElement = isVideo ? videoTargetElement : audioTargetElement;

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

function getDirectYTLink(isVideo, url, tryCount) {
    const baseURLs = [
        "helloacm.com",
        "steakovercooked.com",
        "uploadbeta.com",
        "happyukgo.com"
    ];

    console.log("try: " + tryCount);

    fetchJSONP("http://anyorigin.com/go?url=" + encodeURIComponent("https://" + baseURLs[tryCount] + "/api/video/?lang=en&video=" + url)).then((response) => {
        return response.json();
    }).then((data) => {
        const body = data.contents;
        if (!body.url && !body.urls) { // no mp4 in response, try the next server
            if (tryCount < 3) {
                getDirectYTLink(isVideo, url, tryCount + 1);
            }
            return;
        }

        let media = body.url;
        if (body.urls) { //video and audio are separate files
            media = isVideo ? body.urls[0] : body.urls[1];
        } //TODO - load both files and sync these up as well

        console.log("media: " + media);
        putMediaInDOM(isVideo, media);
    });
}

//Source: https://gist.github.com/gf3/132080/110d1b68d7328d7bfe7e36617f7df85679a08968
const fetchJSONP = (unique => url =>
    new Promise(rs => {
        const script = document.createElement("script");
        const name = `_jsonp_${unique++}`;

        if (url.match(/\?/)) {
            url += `&callback=${name}`;
        } else {
            url += `?callback=${name}`;
        }

        script.src = url;
        window[name] = json => {
            rs(new Response(JSON.stringify(json)));
            script.remove();
            delete window[name];
        };

        document.body.appendChild(script);
    })
)(0);

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

function getVideoSizes(urls) {
    let videoVersion = 1;

    for (let i = 0; i < urls.length; i++) {
        const request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                let megabytes = null;
                if (request.status === 200) { //if server doesn't allow CORS, leave megabytes as null
                    megabytes = Math.floor(request.getResponseHeader("Content-Length") / 1024 / 1024);
                }
                addVidSourceOption(urls[i], megabytes, videoVersion);
                videoVersion++;
            }
        };
        request.open("HEAD", urls[i]);
        request.send();
    }
}

function buildMediaID(isVideo, url, type) {
    const mediaCode = mediaTypeToCode(type);

    if (url.includes("bit.ly")) {
        if (isVideo) {
            videoID = mediaCode + url.substring(url.length - 7);
        } else {
            audioID = mediaCode + url.substring(url.length - 7);
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
