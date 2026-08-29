const socket = io();

let room;
let name;
let pc;

// JOIN
function join() {

  name = document.getElementById("name").value;
  room = document.getElementById("room").value;

  socket.emit("join", { name, room });

  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "block";
}

// SEND MESSAGE (NO DUPLICATE BUG FIXED)
function send() {

  let msg = document.getElementById("msg").value;

  socket.emit("msg", { room, msg });

  document.getElementById("msg").value = "";
}

// RECEIVE MESSAGE
socket.on("msg", data => {

  if (data.name === name) {
    add("You: " + data.msg);
  } else {
    add(data.name + ": " + data.msg);
  }
});

// FILE SEND
function sendFile() {

  let file = document.getElementById("file").files[0];

  let reader = new FileReader();

  reader.onload = () => {
    socket.emit("file", {
      room,
      file: reader.result
    });
  };

  reader.readAsDataURL(file);
}

// FILE RECEIVE
socket.on("file", data => {

  let a = document.createElement("a");
  a.href = data.file;
  a.download = "file";
  a.innerText = data.name + " sent a file";

  document.getElementById("messages").appendChild(a);
});

// ONLINE USERS
socket.on("online", users => {
  document.getElementById("online").innerText =
    "Online: " + users.join(", ");
});

// TYPING
function typing() {
  socket.emit("typing", room);
}

socket.on("typing", name => {
  document.getElementById("typing").innerText =
    name + " is typing...";

  setTimeout(() => {
    document.getElementById("typing").innerText = "";
  }, 1000);
});

// ADD MESSAGE UI
function add(msg) {
  let div = document.createElement("div");
  div.className = "msg";
  div.innerText = msg;
  document.getElementById("messages").appendChild(div);
}

---

# 📞 CALL SYSTEM (WEBRTC SIMPLE)

async function startCall() {

  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  let stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  document.getElementById("local").srcObject = stream;

  stream.getTracks().forEach(t => pc.addTrack(t, stream));

  pc.ontrack = e => {
    document.getElementById("remote").srcObject = e.streams[0];
  };

  pc.onicecandidate = e => {
    if (e.candidate) {
      socket.emit("ice", { room, candidate: e.candidate });
    }
  };

  let offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit("offer", { room, offer });
}

// RECEIVE CALL
socket.on("offer", async (offer) => {

  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  pc.ontrack = e => {
    document.getElementById("remote").srcObject = e.streams[0];
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

socket.on("answer", ans => pc.setRemoteDescription(ans));
socket.on("ice", c => pc.addIceCandidate(c));
