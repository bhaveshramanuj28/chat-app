const socket = io();

let room, name;
let pc;
let msgMap = {};

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

// SEND
function send() {
  let msg = document.getElementById("msg").value;

  socket.emit("msg", msg);

  document.getElementById("msg").value = "";
}

// RECEIVE
socket.on("msg", d => {

  let div = document.createElement("div");
  div.className = "msg " + (d.name === name ? "me" : "other");

  div.innerHTML = `
    ${d.name}: ${d.msg}
    <div class="tick" id="t-${d.id}">✓</div>
  `;

  div.onclick = () => socket.emit("read", d.id);

  document.getElementById("messages").appendChild(div);

  msgMap[d.id] = div;
});

// DELIVERED
socket.on("delivered", id => {
  if (msgMap[id]) {
    msgMap[id].querySelector(".tick").innerText = "✓✓";
  }
});

// READ
socket.on("read", id => {
  if (msgMap[id]) {
    msgMap[id].querySelector(".tick").style.color = "skyblue";
    msgMap[id].querySelector(".tick").innerText = "✓✓";
  }
});

// ONLINE STATUS
socket.on("presence", users => {
  document.getElementById("users").innerText =
    users.map(u => u.name + (u.online ? "🟢" : "⚫")).join(", ");
});

// 📞 VIDEO CALL FIXED
async function call() {

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
    if (e.candidate) socket.emit("ice", e.candidate);
  };

  let offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit("offer", offer);
}

// RECEIVE CALL
socket.on("offer", async offer => {

  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  pc.ontrack = e => {
    document.getElementById("remote").srcObject = e.streams[0];
  };

  await pc.setRemoteDescription(offer);

  let ans = await pc.createAnswer();
  await pc.setLocalDescription(ans);

  socket.emit("answer", ans);

  pc.onicecandidate = e => {
    if (e.candidate) socket.emit("ice", e.candidate);
  };
});

socket.on("answer", ans => pc.setRemoteDescription(ans));
socket.on("ice", c => pc.addIceCandidate(c));
