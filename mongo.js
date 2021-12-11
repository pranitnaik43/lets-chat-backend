const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: false });

const mongo = {
  users: null,
  chats: null,
  friends: null,
  groups: null,

  async connect() {
    await client.connect(); // Connecting to DB
    const db = client.db(process.env.MONGODB_NAME); // Selecting DB
    console.log("Mongo DB Connected");

    this.users = db.collection("users");
    this.chats = db.collection("chats");
    this.friends = db.collection("friends");
    this.groups = db.collection("groups");
  }
};

module.exports = mongo;
