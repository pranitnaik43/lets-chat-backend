const { ObjectId } = require("mongodb");
const Joi = require("joi");

const db = require("../mongo");

const freindRequestStatus = {
  PENDING: "pending",
  REJECTED: "rejected",
  ACCEPTED: "accepted"
}

const service = {
  async getUserDataFromEmail(email) {
    let user = await db.users.findOne({email});
    if(!user) {
      return null;
    }
    //don't send password
    let dataWithoutPassword = {};
    Object.keys(user).forEach(key => {
      if(key!=="password") {
        dataWithoutPassword[key] = user[key];
      }
    });
    return dataWithoutPassword;
  },
  async getAllFriends(req, res) {
    //get all friends
    try {
      let userEmail = req.userEmail;  //current user email

      //get friends' records
      var friendList1 = await db.friends.find({ user1: userEmail, status: freindRequestStatus.ACCEPTED }).toArray();
      var friendList2 = await db.friends.find({ user2: userEmail, status: freindRequestStatus.ACCEPTED }).toArray();
      let friendsRecords = [...friendList1, ...friendList2];
      //get friends' data
      let friendsData = await Promise.all(friendsRecords.map(async (friendRecord) => {

        let friendMail = (friendRecord.user1!==userEmail) ? (friendRecord.user1) : (friendRecord.user2);
        let friend = await service.getUserDataFromEmail(friendMail);
        if(friend) {
          friendRecord.friendsData = friend;
          return friendRecord;
        }
        return null;
      }));
      //remove null data
      friendsData = friendsData.filter(data => (data!==null));
      res.send(friendsData);
    } catch (err) {
      console.log(err);
      res.send({ error: { message: "Operation failed" } });
    }
  },
  async findByEmail(req, res) {
    //get friend by email
    try {
      let userEmail = req.userEmail;
      let friendEmail = req.params.email;

      //get user from email
      let friend = await db.users.findOne({ user1: userEmail, user2: friendEmail, status: freindRequestStatus.ACCEPTED});
      if(!friend) {
        //if user1-user2 pair does not exist, check for user2-user1 pair
        friend = await db.users.findOne({ user1: friendEmail, user2: userEmail, status: freindRequestStatus.ACCEPTED});
      }

      //if no friend found
      if (!friend) {
        return res.send({ error: { message: "No user found" } });
      }

      //send friend's data without password
      const responseData = {};
      Object.keys(friend).forEach(key => {
        if(key!=="password") {
          responseData[key] = friend[key];
        }
      });
      res.send({ ...responseData });

    } catch (err) {
      console.log(err);
      res.send({ error: { message: "Operation failed" } });
    }
  },
  async updateFriendRequest(req, res) {
    //send friend request or accept friend request
    try {
      let userEmail = req.userEmail;
      let friendEmail = req.body.email;
      let status = req.body.status;

      //check if user1-user2 pair already exists in database
      let friend = await db.friends.findOne({ user1: userEmail, user2: friendEmail });
      if(!friend) {
        //check for user2-user1 pair
        friend = await db.friends.findOne({ user1: friendEmail, user2: userEmail });
      }
      console.log(friend)

      if(friend) {
        if(friend.status===freindRequestStatus.ACCEPTED)
          return res.send({ error: { message: "Already your friend" } });
        else {
          await db.friends.updateOne({_id: new ObjectId(friend._id)}, { $set: { ...friend, status: status } });
        }
      } else {
        await db.friends.insertOne({ user1: userEmail, user2: friendEmail, status: status });
      }
      res.send({ success: { message: "Friend Request Sent" } });

    } catch (err) {
      console.log(err);
      res.send({ error: { message: "Operation failed" } });
    }
  }
};

module.exports = service;
