const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");

myVideo.muted = true;

backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});

const user=prompt("Please enter your name")

const currentPeer = [];
var screen ="";

const peer_id = localStorage.getItem("user_id")
var peer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '3030',

});
let peers={};
let myVideoStream;
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {    
    myVideoStream = stream;
    addVideoStream(myVideo, stream);    
    socket.on("user-connected", (userId) => { 
      console.log("User Connected " + userId);   
      console.log(user + " joined")  
      connectToNewUser(userId, stream);  
      
    }); 

    peer.on("call", (call) => {
      call.answer(stream);                                            // answer the call with an audio + video stream
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
        currentPeer.push(call.peerConnection);
        console.log(peers);
        
      });
      
    });
      
  });
socket.on('user-disconnected', userId => {
  if(peers[userId]) peers[userID].close()
  console.log("user-disconnected");
  alert(user + " disconnected")
  
}); 

peer.on("open", (id) => {
  currentUserId = id;
  socket.emit("join-room", ROOM_ID, id, user);
  
});


const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    userVideoStream=stream;
    addVideoStream(video, userVideoStream);
    currentPeer.push(call.peerConnection);
    console.log(user + "joined")

  })
    call.on('close', () => {      
      video.remove();  
    })

    peers[userId] = call;
}

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  //video.controls=true;
  video.setAttribute('disablepictureinpicture', '')
  video.addEventListener("loadedmetadata", () => {
    video.play();  
    
  });
  videoGrid.append(video);  
  
};

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

socket.on("createMessage", (message, userName) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${
          userName === user ? "You" : userName
        }</span> </b>
        <span>${message}</span>
        <div style ="color: white;text-align: right;">
        ${new Date().toLocaleString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        })}
        </div>
    </div>`;
    
});

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
const shareScreen = document.querySelector("#shareScreen");

shareScreen.addEventListener("click", async ()=>{
  shareScreen.classList.toggle("background__red");
  shareScreen.disabled=true;
  const video = document.createElement("video");
  var captureStream = null;
  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia();
    var videoTrack = captureStream.getVideoTracks()[0];
    videoTrack.controls=true;
    videoTrack.onended = ()=>{
    stopScreenShare();
    }
    for( let i = 0; i<currentPeer.length; i++){
      var sender = currentPeer[i].getSenders().find((s)=>{
      return s.track.kind === videoTrack.kind;
    })
    sender.replaceTrack(videoTrack);
    }
  } catch(err)
  {   shareScreen.classList.toggle("background__red");
      console.error("Error: " + err);
  }
})

function stopScreenShare(){
  shareScreen.classList.toggle("background__red");
  var videoTrack = myVideoStream.getVideoTracks()[0];
  for(let i =0; i<currentPeer.length; i++){
    var sender =   currentPeer[i].getSenders().find((s)=>{
    return s.track.kind === videoTrack.kind;
    })
    sender.replaceTrack(videoTrack);
  } 
}


muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    new Notify ({
      status: 'error',      
      text: 'Your mic is off',
      effect: 'fade',
      speed: 300,
      customClass: null,
      customIcon: null,
      showIcon: true,
      showCloseButton: true,
      autoclose: true,
      autotimeout: 3000,
      gap: 20,
      distance: 20,
      type: 3,
      position: 'right top'
    })
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
    
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    new Notify ({
      status: 'warning',      
      text: 'Your mic is on',
      effect: 'fade',
      speed: 300,
      customClass: null,
      customIcon: null,
      showIcon: true,
      showCloseButton: true,
      autoclose: true,
      autotimeout: 3000,
      gap: 20,
      distance: 20,
      type: 3,
      position: 'right top'
    })
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});


stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

inviteButton.addEventListener("click", (e) => {
  var addr = window.location.href
  navigator.clipboard.writeText(addr);
  new Notify ({
    status: 'success',      
    text: 'Link copied!',
    effect: 'fade',
    speed: 300,
    customClass: null,
    customIcon: null,
    showIcon: true,
    showCloseButton: true,
    autoclose: true,
    autotimeout: 3000,
    gap: 20,
    distance: 20,
    type: 3,
    position: 'right top'
  })
});

function endmeeting() {  
  console.log("someone left")
  window.location.href="../views/end.html";
}
 

const record = document.querySelector('.record');
const stop = document.querySelector('.stop');
const soundClips = document.querySelector('.sound-clips');
const canvas = document.querySelector('.visualizer');
const mainSection = document.querySelector('.main-controls');

// disable stop button while not recording

stop.disabled = true;

// visualiser setup - create web audio api context and canvas

let audioCtx;


//main block for doing the audio recording

if (navigator.mediaDevices.getUserMedia) {
  console.log('getUserMedia supported.');

  const constraints = { video: true, audio: true };
  let chunks = [];

  let onSuccess = function(stream) {
    const mediaRecorder = new MediaRecorder(stream);

    //visualize(stream);

    record.onclick = function() {
      mediaRecorder.start();
      new Notify ({
        status: 'success',      
        text: 'Recording has started!',
        effect: 'fade',
        speed: 300,
        customClass: null,
        customIcon: null,
        showIcon: true,
        showCloseButton: true,
        autoclose: true,
        autotimeout: 3000,
        gap: 20,
        distance: 20,
        type: 3,
        position: 'right top'
      })
      console.log(mediaRecorder.state);
      console.log("recorder started");
      record.style.background = "red";
      record.style.borderStyle="hidden";

      stop.disabled = false;
      record.disabled = true;
    }

    stop.onclick = function() {
      mediaRecorder.stop();
      new Notify ({
        status: 'success',      
        text: 'Recording stopped!',
        effect: 'fade',
        speed: 300,
        customClass: null,
        customIcon: null,
        showIcon: true,
        showCloseButton: true,
        autoclose: true,
        autotimeout: 3000,
        gap: 20,
        distance: 20,
        type: 3,
        position: 'right top'
      })
      console.log(mediaRecorder.state);
      console.log("recorder stopped");
      record.style.background = "";
      record.style.color = "";
      record.style.borderStyle="hidden";

      // mediaRecorder.requestData();

      stop.disabled = true;
      record.disabled = false;
    }

    mediaRecorder.onstop = function(e) {
      console.log("data available after MediaRecorder.stop() called.");

      const clipName = prompt('Enter a name for your sound clip?','My clip');

      const clipContainer = document.createElement('article');
      const clipLabel = document.createElement('p');
      const audio = document.createElement('audio');
      const deleteButton = document.createElement('button');

      clipContainer.classList.add('clip');
      audio.setAttribute('controls', '');
      deleteButton.innerHTML = '<i class="fa fa-trash-o"></i>';
      deleteButton.style.borderStyle="hidden";
      deleteButton.className = 'options options__right options__button sound-clips ';
      
      clipContainer.appendChild(audio);
      clipContainer.appendChild(clipLabel);
      clipContainer.appendChild(deleteButton);
      soundClips.appendChild(clipContainer);

      audio.controls = true;
      const blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
      chunks = [];
      const audioURL = window.URL.createObjectURL(blob);
      audio.src = audioURL;
      console.log("recorder stopped");
      //saveAs(clipName);

      deleteButton.onclick = function(e) {
        Swal.fire({
          title: 'Are you sure?',
          text: "You won't be able to revert this!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
          if (result.isConfirmed) {
            let evtTgt = e.target;
            evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
            console.log("deleted");
            Swal.fire(
              'Deleted!',
              'Your audio clip has been deleted.',
              'success'
            )
          }
          else
          {
            Swal.fire(
              'Cancelled',
              'Your audio clip is safe :)',
              'error'
            )
          }
        })
        /*
        let evtTgt = e.target;
        evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
        toastr.success('Audio recording has been deleted!');
        console.log("deleted");*/
      }

      clipLabel.onclick = function() {
        const existingName = clipLabel.textContent;
        
        const newClipName = prompt('Enter a new name for your sound clip?');
        if(newClipName === null) {
          clipLabel.textContent = existingName;
        } else {
          clipLabel.textContent = newClipName;
        }
      }
    }

    mediaRecorder.ondataavailable = function(e) {
      chunks.push(e.data);
    }
  }

  let onError = function(err) {
    toastr.error('An error occured!');
    console.log('The following error occured: ' + err);
  }

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

} else {
  toastr.error('getUserMedia not supported on your browser!');
   console.log('getUserMedia not supported on your browser!');
}

document.querySelectorAll('.feedback li').forEach(entry => entry.addEventListener('click', e => {
  if(!entry.classList.contains('active')) {
      document.querySelector('.feedback li.active').classList.remove('active');
      entry.classList.add('active');
  }
  e.preventDefault();
}));


