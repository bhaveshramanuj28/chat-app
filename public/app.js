const socket = io();

let room;
let pc;
let channel;
let localStream;

// JOIN
function join() {
  room = document.getElementById("room").value;
  let password = document.getElementById("password").value;

  socket.emit("join", { room, password });

  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "block";
}

// ERRORS
socket.on("wrongPassword", () => alert("Wrong Password"));
socket.on("invalidRoom", () => alert("Room does not exist"));
socket.on("full", () => alert("Room Full"));

// START CALL
socket.on("start", async () => {

  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  channel = pc.createDataChannel("chat");
  channel.onmessage = handle;

  pc.onicecandidate = e => {
    if (e.candidate) {
      socket.emit("ice", { room, candidate: e.candidate });
    }
  };

  let offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit("offer", { room, offer });

  pc.ontrack = e => {
    document.getElementById("remoteVideo").srcObject = e.streams[0];
  };
});

// OFFER
socket.on("offer", async (offer) => {

  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  pc.ondatachannel = e => {
    channel = e.channel;
    channel.onmessage = handle;
  };

  pc.onicecandidate = e => {
    if (e.candidate) {
      socket.emit("ice", { room, candidate: e.candidate });
    }
  };

  await pc.setRemoteDescription(offer);

  let answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  socket.emit("answer", { room, answer });
});

// ANSWER
socket.on("answer", async (answer) => {
  await pc.setRemoteDescription(answer);
});

// ICE
socket.on("ice", async (c) => {
  try {
    await pc.addIceCandidate(c);
  } catch (e) {}
});

// SEND MESSAGE
function send() {
  let msg = document.getElementById("msg").value;

  if (channel) {
    channel.send(JSON.stringify({ type: "text", msg }));
  }

  add("Me: " + msg);
  document.getElementById("msg").value = "";
}

// HANDLE MESSAGE
function handle(e) {
  let data = JSON.parse(e.data);

  if (data.type === "text") {
    add("Friend: " + data.msg);
  }

  if (data.type === "file") {
    let a = document.createElement("a");
    a.href = data.file;
    a.download = data.name;
    a.innerText = "Download " + data.name;
    document.getElementById("messages").appendChild(a);
  }
}

// MESSAGE UI
function add(msg) {
  let div = document.createElement("div");
  div.innerText = msg;
  document.getElementById("messages").appendChild(div);

  setTimeout(() => div.remove(), 8000);
}

// FILE
function sendFile() {
  let file = document.getElementById("file").files[0];
  let reader = new FileReader();

  reader.onload = () => {
    if (channel) {
      channel.send(JSON.stringify({
        type: "file",
        name: file.name,
        file: reader.result
      }));
    }
  };

  reader.readAsDataURL(file);
}

// CAMERA
async function startCamera() {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  document.getElementById("localVideo").srcObject = localStream;

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
}

// CALL
function startCall() {
  startCamera();
}

// SNAP
function capture() {
  let video = document.getElementById("localVideo");

  let canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  let ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  let img = canvas.toDataURL("image/png");

  if (channel) {
    channel.send(JSON.stringify({
      type: "file",
      name: "snap.png",
      file: img
    }));
  }
}

// TYPING
function typing() {
  socket.emit("typing", room);
}

socket.on("typing", () => {
  let t = document.getElementById("typing");
  t.innerText = "Typing...";
  setTimeout(() => t.innerText = "", 1000);
});
