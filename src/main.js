const menuContainer = document.createElement("div");
Object.assign(menuContainer.style, {
    zIndex: "999999",
    position: "fixed",
    top: "50px",
    right: "50px",
    width: "400px",
    backgroundColor: "rgb(12 12 12)",
    border: "1px solid #ccc",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
    padding: "16px",
    color: "white"
});

const title = document.createElement("h3");
title.textContent = "TrollCam";
title.style.marginTop = "0";
title.style.marginBottom = "12px";
menuContainer.appendChild(title);

const previewWrapper = document.createElement("div");
Object.assign(previewWrapper.style, {
    width: "100%",
    aspectRatio: "16 / 9",
    border: "1px solid #ccc",
    borderRadius: "6px",
    overflow: "hidden",
    background: "#000",
    marginBottom: "12px"
});

const previewVideo = document.createElement("video");
Object.assign(previewVideo, {
    controls: true,
    loop: true
});
Object.assign(previewVideo.style, {
    width: "100%",
    height: "100%",
    backgroundColor: "#000"
});

previewWrapper.appendChild(previewVideo);
menuContainer.appendChild(previewWrapper);

const videoListElement = document.createElement("ul");
Object.assign(videoListElement.style, {
    listStyle: "none",
    padding: "0",
    margin: "0 0 12px 0",
    maxHeight: "120px",
    overflowY: "auto",
    borderTop: "1px solid #eee",
    borderBottom: "1px solid #eee"
});
menuContainer.appendChild(videoListElement);

const addVideoBtn = document.createElement("button");
addVideoBtn.textContent = "Add Video";
Object.assign(addVideoBtn.style, {
    width: "100%",
    padding: "10px",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "#007BFF",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px"
});
addVideoBtn.onmouseover = () => addVideoBtn.style.backgroundColor = "#0056b3";
addVideoBtn.onmouseout = () => addVideoBtn.style.backgroundColor = "#007BFF";
menuContainer.appendChild(addVideoBtn);

document.body.appendChild(menuContainer);

const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "video/*";
fileInput.style.display = "none";
document.body.appendChild(fileInput);

addVideoBtn.addEventListener("click", () => fileInput.click());

let videoList = [];
let currentVideoIndex = -1;

const canvas = document.createElement("canvas");
canvas.width = 640;
canvas.height = 360;
canvas.style.display = "none";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");
const videoStream = canvas.captureStream(30);
const canvasVideoTrack = videoStream.getVideoTracks()[0];
let currentVideoTrack = canvasVideoTrack;

let audioStream = new MediaStream();
let currentAudioTrack = null;
const audioContext = new AudioContext();

function setVideoSource(url) {
    previewVideo.pause();
    previewVideo.src = url;
    previewVideo.load();
    previewVideo.play();

    const draw = () => {
        if (!previewVideo.paused && !previewVideo.ended) {
            ctx.drawImage(previewVideo, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(draw);
        }
    };
    draw();

    previewVideo.onloadedmetadata = () => {
        const stream = previewVideo.captureStream();
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
            if (currentAudioTrack) {
                audioStream.removeTrack(currentAudioTrack);
            }
            audioStream.addTrack(audioTrack);
            currentAudioTrack = audioTrack;

            const audioSource = audioContext.createMediaStreamSource(stream);
            audioSource.connect(audioContext.destination);
        }
    };
}

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        const url = event.target.result;
        videoList.push({ url: url, name: file.name });

        const videoItem = document.createElement("li");
        videoItem.textContent = file.name;
        Object.assign(videoItem.style, {
            padding: "6px 10px",
            cursor: "pointer",
            borderRadius: "4px"
        });
        videoItem.onmouseover = () => videoItem.style.backgroundColor = "#161616";
        videoItem.onmouseout = () => videoItem.style.backgroundColor = "transparent";
        videoItem.onclick = () => {
            currentVideoIndex = videoList.findIndex(v => v.url === url);
            setVideoSource(url);
        };

        videoListElement.appendChild(videoItem);

        if (videoList.length === 1) {
            setVideoSource(url);
        }
    };
    reader.readAsDataURL(file);
});

let BoomCameraID = Math.random().toString(36).substring(2, 15);
let BoomAudioID = Math.random().toString(36).substring(2, 15);

let _enumerateDevices = navigator.mediaDevices.enumerateDevices;
navigator.mediaDevices.enumerateDevices = async function () {
    let realDevices = [];
    realDevices.push(
        {
            kind: "videoinput",
            label: "TrollCam",
            deviceId: BoomCameraID,
            groupId: BoomCameraID,
            getCapabilities: () => currentVideoTrack?.getCapabilities() || {},
            toJSON() {
                return {
                    deviceId: this.deviceId,
                    groupId: this.groupId,
                    kind: this.kind,
                    label: this.label
                };
            }
        },
        {
            kind: "audioinput",
            label: "TrollMic",
            deviceId: BoomAudioID,
            groupId: BoomAudioID,
            getCapabilities: () => currentAudioTrack?.getCapabilities() || {},
            toJSON() {
                return {
                    deviceId: this.deviceId,
                    groupId: this.groupId,
                    kind: this.kind,
                    label: this.label
                };
            }
        }
    );
    return realDevices;
};

let _getUserMedia = navigator.mediaDevices.getUserMedia;
navigator.mediaDevices.getUserMedia = async function (constraints) {
    if (!constraints) {
        return _getUserMedia.call(navigator.mediaDevices, constraints);
    }

    let vidId = constraints.video?.deviceId?.exact || constraints.video?.deviceId;
    let audId = constraints.audio?.deviceId?.exact || constraints.audio?.deviceId;

    let combinedStream = new MediaStream();

    if (vidId === BoomCameraID) {
        videoStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
    }

    if (audId === BoomAudioID) {
        audioStream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
    }

    if (combinedStream.getTracks().length === 0) {
        return _getUserMedia.call(navigator.mediaDevices, constraints);
    }

    return combinedStream;
};

function toggleMenu () {
    if (menuContainer.style.display === 'none') {
        menuContainer.style.display = 'block';
    } else {
        menuContainer.style.display = 'none';
    }
}

let toggleButton = document.createElement("div");
toggleButton.textContent = "📷";
toggleButton.style.position = "fixed";
toggleButton.style.top = "100px";
toggleButton.style.left = "0px";
toggleButton.style.padding = "10px 10px";
toggleButton.style.backgroundColor = "rgba(25, 25, 25, 0.75)";
toggleButton.style.border = "1px solid rgb(0, 123, 255)";
toggleButton.style.color = "#fff";
toggleButton.style.borderRadius = "0 5px 5px 0";
toggleButton.style.cursor = "pointer";
toggleButton.style.zIndex = "9999999";
toggleButton.style.userSelect = "none";

toggleButton.addEventListener("click", toggleMenu);

let isDragging = false;
let offsetY = 0;

toggleButton.addEventListener("mousedown", function (event) {
    isDragging = true;
    offsetY = event.clientY - toggleButton.getBoundingClientRect().top;
    event.preventDefault();
});

document.addEventListener("mousemove", function (event) {
    if (isDragging) {
        toggleButton.style.top = `${event.clientY - offsetY}px`;
    }
});

document.addEventListener("mouseup", function () {
    isDragging = false;
});

document.body.appendChild(toggleButton);

let isMenuDragging = false;
let offsetX = 0;
let offsetYMenu = 0;

menuContainer.addEventListener("mousedown", function (event) {
    isMenuDragging = true;
    offsetX = event.clientX - menuContainer.getBoundingClientRect().left;
    offsetYMenu = event.clientY - menuContainer.getBoundingClientRect().top;
    event.preventDefault();
});

document.addEventListener("mousemove", function (event) {
    if (isMenuDragging) {
        menuContainer.style.left = `${event.clientX - offsetX}px`;
        menuContainer.style.top = `${event.clientY - offsetYMenu}px`;
    }
});

document.addEventListener("mouseup", function () {
    isMenuDragging = false;
});

Object.assign(menuContainer.style, {
    left: "50px",
    top: "50px",
});
