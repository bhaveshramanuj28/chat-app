const socket = io();

let pc;
let channel;
let room;
let channelReady = false;

// JOIN
function join() {

  room = document.getElementById("room").value;
  let password = document.getElementById("password").value;

  socket.emit("join", { room, password });

  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "block";
}

// CREATE PEER
function createPeer() {

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

    channel.onopen = () => {
      channelReady = true;
    };

    channel.onmessage = (e) => {
      add("Friend: " + e.data);
    };
  };
}

// START (USER A)
socket.on("start", async () => {

  createPeer();

  channel = pc.createDataChannel("chat");

  channel.onopen = () => {
    channelReady = true;
  };

  channel.onmessage = (e) => {
    add("Friend: " + e.data);
  };

  let offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit("offer", { room, offer });
});

// OFFER (USER B)
socket.on("offer", async (offer) => {

  createPeer();

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
  } catch {}
});

// SEND MESSAGE (🔥 MAIN FIX)
function send() {

  let msg = document.getElementById("msg").value;

  if (!channel || channel.readyState !== "open") {
    alert("Connection not ready");
    return;
  }

  channel.send(msg);
  add("Me: " + msg);

  document.getElementById("msg").value = "";
}

// UI
function add(msg) {
  let div = document.createElement("div");
  div.innerText = msg;
  document.getElementById("messages").appendChild(div);
}
