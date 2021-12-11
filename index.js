const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Mongo
const mongo = require("./mongo");

// Routes
const authRoutes = require("./routes/auth.routes");
const chatRoutes = require("./routes/chat.routes");
const friendsRoutes = require("./routes/friends.routes");

//services
const authService = require("./services/auth.services");

const app = express();
const PORT = (process.env.PORT) ? (process.env.PORT) : 3001;

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
    app.use("/groups", friendsRoutes);
    
    app.listen(PORT, () =>
      console.log(`Server running at port ${PORT}`)
    );
  } catch (err) {
    console.log(err);
  }
})(); //imediately invoked function

