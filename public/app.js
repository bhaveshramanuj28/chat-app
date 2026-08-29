const socket = io();

let room;
let user;
let pc;
let channel;
let ready = false;

// CREATE ROOM
function createRoom() {
  let pass = document.getElementById("password").value;

  socket.emit("createRoom", pass, ({ roomId }) => {
    const link = `${location.origin}?room=${roomId}`;
    prompt("Invite Link:", link);
  });
}

// AUTO FILL ROOM FROM LINK
window.onload = () => {
  const r = new URLSearchParams(location.search).get("room");
  if (r) document.getElementById("room").value = r;
};

// JOIN
function join() {
  room = document.getElementById("room").value;
  let password = document.getElementById("password").value;
  user = document.getElementById("user").value;

  socket.emit("join", { room, password, user });
}

// INIT PEER
function initPeer() {

  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  pc.onicecandidate = e => {
    if (e.candidate) {
      socket.emit("ice", { room, candidate: e.candidate });
    }
  };

  pc.ondatachannel = (e) => {
    channel = e.channel;

    channel.onopen = () => ready = true;

    channel.onmessage = (e) => {
      add("Friend: " + e.data);
    };
  };
}

// START EVENT
socket.on("start", async ({ initiator }) => {

  initPeer();

  if (initiator) {

    channel = pc.createDataChannel("chat");

    channel.onopen = () => ready = true;

    let offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("offer", { room, offer });
  }

});

// OFFER
socket.on("offer", async (offer) => {

  initPeer();

  await pc.setRemoteDescription(offer);

  let answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  socket.emit("answer", { room, answer });
});

// ANSWER
socket.on("answer", ans => pc.setRemoteDescription(ans));

// ICE
socket.on("ice", c => pc.addIceCandidate(c));

// SEND MESSAGE
function send() {

  let msg = document.getElementById("msg").value;

  if (!channel || !ready) {
    alert("Not connected yet");
    return;
  }

  channel.send(msg);
  add("Me: " + msg);

  document.getElementById("msg").value = "";
}

// UI
function add(msg) {
  let div = document.createElement("div");
  div.className = "msg";
  div.innerText = msg;
  document.getElementById("messages").appendChild(div);
}
