require("dotenv").config();
const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.get("/hello", (req, res) => {
  res.send("hello world!");
  });
app.use("/peerjs", peerServer);

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  //console.log("incoming connection");
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    //console.log(roomId);
    socket.to(roomId).emit("user-connected", userId);
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });
    socket.on("user-disconnected", () => {
      console.log("disconnected");
      socket.to(roomId).emit("user-disconnected",userId);
    });
    
  });
});

server.listen(process.env.PORT || 3030);
