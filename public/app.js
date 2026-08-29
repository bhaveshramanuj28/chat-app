const socket = io();

let room;
let user;
let pc;
let channel;
let ready = false;

// AUTO ROOM FROM LINK
window.onload = () => {
  const r = new URLSearchParams(location.search).get("room");
  if (r) document.getElementById("room").value = r;
};

// CREATE ROOM
function createRoom() {
  let pass = document.getElementById("password").value;

  socket.emit("createRoom", pass, ({ roomId }) => {
    const link = `${location.origin}?room=${roomId}`;
    prompt("Invite Link", link);
  });
}

// JOIN
function join() {
  room = document.getElementById("room").value;
  let pass = document.getElementById("password").value;
  user = document.getElementById("user").value;

  socket.emit("join", { room, password: pass, user });
}

// SHOW CHAT ONLY WHEN READY
socket.on("ready", () => {
  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "block";
  initPeer();
});

// PEER INIT
function initPeer() {

  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  pc.onicecandidate = e => {
    if (e.candidate)
      socket.emit("ice", { room, candidate: e.candidate });
  };

  pc.ontrack = e => {
    document.getElementById("remote").srcObject = e.streams[0];
  };

  pc.ondatachannel = (e) => {
    channel = e.channel;

    channel.onopen = () => ready = true;

    channel.onmessage = (e) => {
      add("Friend: " + e.data);
    };
  };
}

// OFFER
socket.on("ready", async () => {

  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  channel = pc.createDataChannel("chat");

  channel.onopen = () => ready = true;

  let offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit("offer", { room, offer });
});

// OFFER/ANSWER
socket.on("offer", async (offer) => {

  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  pc.ondatachannel = (e) => {
    channel = e.channel;
    channel.onopen = () => ready = true;
    channel.onmessage = (e) => add("Friend: " + e.data);
  };

  await pc.setRemoteDescription(offer);

  let ans = await pc.createAnswer();
  await pc.setLocalDescription(ans);

  socket.emit("answer", { room, answer: ans });
});

socket.on("answer", ans => pc.setRemoteDescription(ans));

socket.on("ice", c => pc.addIceCandidate(c));

// SEND MSG
function send() {

  let msg = document.getElementById("msg").value;

  if (!channel || !ready) return alert("Not connected");

  channel.send(msg);
  add("Me: " + msg);

  document.getElementById("msg").value = "";
}

// FILE
function sendFile() {
  let f = document.getElementById("file").files[0];

  let r = new FileReader();
  r.onload = () => channel.send(r.result);
  r.readAsDataURL(f);
}

// UI
function add(m) {
  let div = document.createElement("div");
  div.className = "msg";
  div.innerText = m;
  document.getElementById("messages").appendChild(div);
}

// CALL
async function startCall() {
  let stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

  document.getElementById("local").srcObject = stream;

  stream.getTracks().forEach(t => pc.addTrack(t, stream));
}
