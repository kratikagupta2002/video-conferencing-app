const socket = io("/");                                             //create socket
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");

myVideo.muted = true;                                               //mute ourselves so that there is no feedback 

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

const currentPeer = [];                                             //array to store peer connections
var screen ="";

const peer_id = localStorage.getItem("user_id")
/*var peer = new Peer(undefined, {                                    //creating a peer element
  host: 'kratika-chit-chat-app.herokuapp.com',
  port: '443',
  secure: true

});*/

var peer = new Peer(undefined, { 
  path: 'peerjs' ,                                  //creating a peer element
  host: '/',
  port: '3030'
});
let peers={};
let myVideoStream;
//Access user's video and audio
navigator.mediaDevices            
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {    
    myVideoStream = stream;
    addVideoStream(myVideo, stream);                              //display our own video to ourselves
    socket.on("user-connected", (userId) => {                     //when a new user connects
      setTimeout (() => {
        connectToNewUser(userId, stream);  
      },3000)
      console.log("User Connected " + userId);   
      console.log(user + " joined")  
      
      
    }); 
//Incoming call when a new user joins the room
    peer.on("call", (call) => {
      call.answer(stream);                                        // answer the call with an audio + video stream
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);                   //append their video to our video-grid
        currentPeer.push(call.peerConnection);                    //add new user info to the array
        console.log(peers);
        
      });
      
    });
      
  });
socket.on('user-disconnected', userId => {
  if(peers[userId]) peers[userID].close()
  console.log("user-disconnected");
  alert(user + " disconnected")
  
}); 

//Join a room when we first open the app
peer.on("open", (id) => {                                       
  currentUserId = id;
  socket.emit("join-room", ROOM_ID, id, user);
  
});

//runs when a new user joins the room
const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);                         //call the new user who just joined
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    userVideoStream=stream;
    addVideoStream(video, userVideoStream);                       //add thier video stream
    currentPeer.push(call.peerConnection);
    console.log(user + "joined")

  })
    call.on('close', () => {                                     //remove their video from the grid if they leave
      video.remove();  
    })

    peers[userId] = call;
}

//adds videostream of the user to the video-grid
const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.setAttribute('disablepictureinpicture', '')
  video.addEventListener("loadedmetadata", () => {
    video.play();  
    
  });
  videoGrid.append(video);            
  
};

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");
//Two methods to send message - click on send button or enter
send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);                           //send message when user clicks send button
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);                           //send message when user presses enter
    text.value = "";
  }
});

socket.on("createMessage", (message, userName) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${
          userName === user ? "You" : userName                      //to display name of person who sends message
        }</span> </b>
        <span>${message}</span>
        <div style ="color: white;text-align: right;">
        ${new Date().toLocaleString('en-US', {                     //to display time of message
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

shareScreen.addEventListener("click", async ()=>{                             //share screen when its icon is clicked
  shareScreen.classList.toggle("background__red");
  shareScreen.disabled=true;
  const video = document.createElement("video");
  var captureStream = null;
  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia();           //capture user's screen who is sharing 
    var videoTrack = captureStream.getVideoTracks()[0];
    videoTrack.controls=true;
    videoTrack.onended = ()=>{                                                //triggered when stop sharing button is pressed
    stopScreenShare();
    }
    for( let i = 0; i<currentPeer.length; i++){                               //replace user's video with his screen for evryone in the room
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
  for(let i =0; i<currentPeer.length; i++){                                   //replace user's screen with his video for evryone in the room
    var sender =   currentPeer[i].getSenders().find((s)=>{
    return s.track.kind === videoTrack.kind;
    })
    sender.replaceTrack(videoTrack);
  } 
}


muteButton.addEventListener("click", () => {                                //mute user when clicked
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;                      //a notification is popped up saying "mic is off"
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
      status: 'warning',                                                      //a notification is popped up saying "mic is ofn"
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
    myVideoStream.getVideoTracks()[0].enabled = false;                           //turns off video
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;                            //turns on video
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

inviteButton.addEventListener("click", (e) => {
  var addr = window.location.href
  navigator.clipboard.writeText(addr);                                          //invite link is copied to clipboard
  new Notify ({
    status: 'success',      
    text: 'Link copied!',                                                       //a success notification saying "link copied!"
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
  window.location.href="../views/end.html";                                     //redirect user to end.html when end button is clicked
}
 

const record = document.querySelector('.record');
const stop = document.querySelector('.stop');
const soundClips = document.querySelector('.sound-clips');
const mainSection = document.querySelector('.main-controls');

stop.disabled = true;                                                           // disable stop button while not recording

//main block for doing the audio recording

if (navigator.mediaDevices.getUserMedia) {
  console.log('getUserMedia supported.');

  const constraints = { video: true, audio: true };
  let chunks = [];                                                            //create a buffer to store the incoming data

  let onSuccess = function(stream) {
    const mediaRecorder = new MediaRecorder(stream);                           //Instantiate media recorder

    record.onclick = function() {
      mediaRecorder.start();
      new Notify ({
        status: 'success',      
        text: 'Recording has started!',                                         //notification displaying "recording started!"
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
        text: 'Recording stopped!',                                               //notification displaying "recording stopped!"
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

      stop.disabled = true;
      record.disabled = false;
    }

    mediaRecorder.onstop = function(e) {                                          //when stop recording is called
      console.log("data available after MediaRecorder.stop() called.");

      const clipName = prompt('Enter a name for your audio clip','My clip');      
      
      //creating the audio clip container
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
      const blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });       // a blob combines all the audio chunks into a single quantity
      chunks = [];
      const audioURL = window.URL.createObjectURL(blob);                          //point to the blob created with a new URL
      audio.src = audioURL;
      console.log("recorder stopped");
      

      deleteButton.onclick = function(e) {                                         //when delete button is clicked      
        Swal.fire({
          title: 'Are you sure?',
          text: "You won't be able to revert this!",                               //delete confiramtion dialog box
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
          if (result.isConfirmed) {
            let evtTgt = e.target;
            evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);           //delete auddio clip when clciked on "yes"
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
    new Notify ({
      status: 'error',      
      text: 'An error occured!',                                               //notification displaying "error occured!" when reording isn't successful
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
    console.log('The following error occured: ' + err);
  }

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

} else {
  new Notify ({
    status: 'error',      
    text: 'getUserMedia not supported on your browser!',                                               
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
   console.log('getUserMedia not supported on your browser!');
}

document.querySelectorAll('.feedback li').forEach(entry => entry.addEventListener('click', e => {      //when an emoji is clicked for feedback 
  if(!entry.classList.contains('active')) {
      document.querySelector('.feedback li.active').classList.remove('active');                        //when feedback os changed from one emoji to other
      entry.classList.add('active');                                                                   //update the DB with new feedback
  }
  e.preventDefault();
}));


