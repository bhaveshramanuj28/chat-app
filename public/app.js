const socket = io();

let room, name;
let pc;
let recorder;
let chunks = [];

// JOIN
function join() {
  name = document.getElementById("name").value;
  room = document.getElementById("room").value;

  socket.emit("join", { name, room }, (res) => {
    if (!res.ok) return alert(res.error);

    document.getElementById("login").style.display = "none";
    document.getElementById("chat").style.display = "flex";
  });
}

// SEND TEXT
function send() {
  let msg = document.getElementById("msg").value;
  socket.emit("msg", msg);
  document.getElementById("msg").value = "";
}

// RECEIVE TEXT
socket.on("msg", (d) => {
  let div = document.createElement("div");
  div.className = "msg " + (d.name === name ? "me" : "other");
  div.innerText = d.name + ": " + d.msg;
  document.getElementById("messages").appendChild(div);
});

// FILE
function sendFile() {
  let file = document.getElementById("file").files[0];
  let reader = new FileReader();

  reader.onload = () => {
    socket.emit("file", {
      file: reader.result,
      type: file.type
    });
  };

  reader.readAsDataURL(file);
}

// RECEIVE FILE
socket.on("file", (d) => {
  let div = document.createElement("div");

  if (d.type.startsWith("image")) {
    div.innerHTML = `<img src="${d.file}">`;
  } else if (d.type.startsWith("audio")) {
    div.innerHTML = `<audio controls src="${d.file}"></audio>`;
  } else {
    div.innerHTML = `<a href="${d.file}" download>Download File</a>`;
  }

  document.getElementById("messages").appendChild(div);
});

// VOICE NOTE (FIXED)
async function voice() {

  let stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  recorder = new MediaRecorder(stream);
  chunks = [];

  recorder.ondataavailable = e => chunks.push(e.data);

  recorder.onstop = () => {

    let blob = new Blob(chunks, { type: "audio/webm" });
    let reader = new FileReader();

    reader.onload = () => {
      socket.emit("file", {
        file: reader.result,
        type: "audio"
      });
    };

    reader.readAsDataURL(blob);
  };

  recorder.start();

  setTimeout(() => recorder.stop(), 4000);
}

// CALL (WEBRTC FIXED)
async function call() {

  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  let stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  document.getElementById("local").srcObject = stream;

  stream.getTracks().forEach(track => pc.addTrack(track, stream));

  pc.ontrack = (e) => {
    document.getElementById("remote").srcObject = e.streams[0];
  };

  pc.onicecandidate = (e) => {
    if (e.candidate) socket.emit("ice", e.candidate);
  };

  let offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit("offer", offer);
}

// RECEIVE CALL
socket.on("offer", async (offer) => {

  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  pc.ontrack = (e) => {
    document.getElementById("remote").srcObject = e.streams[0];
  };

  await pc.setRemoteDescription(offer);

  let ans = await pc.createAnswer();
  await pc.setLocalDescription(ans);

  socket.emit("answer", ans);

  pc.onicecandidate = (e) => {
    if (e.candidate) socket.emit("ice", e.candidate);
  };
});

socket.on("answer", (ans) => pc.setRemoteDescription(ans));
socket.on("ice", (c) => pc.addIceCandidate(c));

// TYPING
function typing() {
  socket.emit("typing");
}

socket.on("typing", (name) => {
  document.getElementById("typing").innerText = name + " typing...";
  setTimeout(() => {
    document.getElementById("typing").innerText = "";
  }, 1000);
});
