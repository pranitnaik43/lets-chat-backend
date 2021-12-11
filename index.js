const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: '*' } });

const PORT = (process.env.PORT) ? (process.env.PORT) : 3001;

// Mongo
const mongo = require("./mongo");

// Routes
const authRoutes = require("./routes/auth.routes");
const chatRoutes = require("./routes/chat.routes");
const friendsRoutes = require("./routes/friends.routes");

//services
const authService = require("./services/auth.services");
const chatServices = require("./services/chat.services");

(async function load() {
  try {
    await mongo.connect();

    app.use(express.json());    //body params -> json
    app.use(express.urlencoded({
      extended: true
    })); //required parsing of url-encoded form data

    app.use(cors());    // allow Cross-Origin Resource sharing

    app.use("/auth", authRoutes);

    app.use(authService.validateAccessToken);

    app.use("/chats", chatRoutes);
    app.use("/friends", friendsRoutes);

    io.on("connection", (socket) => {
      // console.log("new client connected");
      socket.emit('connection', null);
      socket.on("message", async (connectionId) => {
        //check if connection exists
        let exists = await chatServices.isFriendOrGroup(connectionId);
        console.log("message received", exists, connectionId);
        if (exists) {
          // socket.broadcast.emit(connectionId, null);
          io.sockets.emit(connectionId, null);
        }
      });
    });

    http.listen(PORT, () =>
      console.log(`Server running at port ${PORT}`)
    );
  } catch (err) {
    console.log(err);
  }
})(); //imediately invoked function


exports.http = http;