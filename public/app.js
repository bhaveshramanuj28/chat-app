const socket = io();

let room;
let pc = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});

let channel;
let localStream;

// JOIN
function join() {
  room = document.getElementById("room").value;

  socket.emit("join", room);

  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "flex";
}

socket.on("full", () => alert("Room full"));

// START CONNECTION
socket.on("start", async () => {
  channel = pc.createDataChannel("chat");
  channel.onmessage = handle;

  let offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit("offer", { room, offer });
});

socket.on("offer", async (offer) => {
  pc.ondatachannel = e => {
    channel = e.channel;
    channel.onmessage = handle;
  };

  await pc.setRemoteDescription(offer);

  let answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  socket.emit("answer", { room, answer });
});

socket.on("answer", async (answer) => {
  await pc.setRemoteDescription(answer);
});

// ICE
pc.onicecandidate = e => {
  if (e.candidate) socket.emit("ice", { room, candidate: e.candidate });
};

socket.on("ice", c => pc.addIceCandidate(c));

// CHAT
function send() {
  let msg = document.getElementById("msg").value;

  channel.send(JSON.stringify({ type: "text", msg }));
  add("Me: " + msg);

  document.getElementById("msg").value = "";
}

// HANDLE DATA
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

// DISAPPEAR
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
    channel.send(JSON.stringify({
      type: "file",
      name: file.name,
      file: reader.result
    }));
  };

  reader.readAsDataURL(file);
}

// CAMERA
async function startCamera() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

  document.getElementById("localVideo").srcObject = localStream;

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
}

// VIDEO CALL
pc.ontrack = e => {
  document.getElementById("remoteVideo").srcObject = e.streams[0];
};

function startCall() {
  startCamera();
}

// SNAP PHOTO
function capture() {
  let video = document.getElementById("localVideo");

  let canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  let ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  let img = canvas.toDataURL("image/png");

  channel.send(JSON.stringify({
    type: "file",
    name: "snap.png",
    file: img
  }));
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
