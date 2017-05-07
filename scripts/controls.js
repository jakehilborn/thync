/*jslint browser:true */

function play() {
    document.getElementById("audio_element").play();
    document.getElementById("video_element").play();
}

function pause() {
    document.getElementById("audio_element").pause();
    document.getElementById("video_element").pause();
}

function rewind(time) {
    document.getElementById("audio_element").currentTime -= time;
    document.getElementById("video_element").currentTime -= time;
}

function forward(time) {
    document.getElementById("audio_element").currentTime += time;
    document.getElementById("video_element").currentTime += time;
}

// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube video_div)
//    after the API code downloads.
var youtubePlayer;
function onYouTubeIframeAPIReady() {
    youtubePlayer = new YT.Player('video_element', {
        height: '390',
        width: '640',
        videoId: 'M7lc1UVf-VE',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// 4. The API will call this function when the video_div video_div is ready.
function onPlayerReady(event) {
    event.target.playVideo();
}

// 5. The API calls this function when the video_div's state changes.
//    The function indicates that when playing a video_div (state=1),
//    the video_div should play for six seconds and then stop.
var done = false;
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
        setTimeout(stopVideo, 6000);
        done = true;
    }
}
function stopVideo() {
    youtubePlayer.stopVideo();
}
