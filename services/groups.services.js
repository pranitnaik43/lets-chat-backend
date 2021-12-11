const { ObjectId } = require("mongodb");
const Joi = require("joi");

const db = require("../mongo");
const authService = require("./auth.services");

const groupBody = Joi.object({
  name: Joi.string().required(),
  members: Joi.array().required(),
});

const service = {
  async getGroupData(req, res) {
    //get group data from id
    try {
      let groupId = req.params.id;
      let group = await db.users.findOne({ groupId });
      if (!group) {
        return res.send({ error: { message: "Invalid ID" } });
      }
      group.members = group.members.map(memberEmail => {
        let member = authService.getUserDataWithoutPassword(memberEmail);
        return member;
      });
      res.send(group);
    } catch (err) {
      console.log(err);
      res.send({ error: { message: "Operation failed" } });
    }
  },
  async getAllGroups(req, res) {
    //get all groups for the user
    try {
      let userEmail = req.userEmail;  //current user email

      let allGroups = await db.channels.find({}).toArray();
      let reqGroups = [];

      allGroups.forEach(group => {
        if (group.members.includes(userEmail)) {
          reqGroups.push(group);
        }
      })

      res.send(reqGroups);
    } catch (err) {
      console.log(err);
      res.send({ error: { message: "Operation failed" } });
    }
  },
  createGroup(req, res) {
    try {
      //validate request body
      const { error } = await groupBody.validate(req.body);
      if (error) return res.send({ error: { message: error.details[0].message } });

      await db.groups.insertOne({ ...req.body });
      res.send({ success: { message: "Group created successfully" } });
    } catch (err) {
      console.log(err);
      res.send({ error: { message: "Operation failed" } });
    }
  },
  addUsersToGroup(req, res) {
    let userEmail = req.userEmail;
    let groupId = req.params.id;
    let members = req.body.members;

    //check if group exists
    let group = await db.groups.findOne({ _id: new ObjectId(groupId) });
    if (!group) return res.send({ error: { message: "Invalid Group id" } });

    //check if the requesting user exists in group
    if (!group.members.includes(userEmail)) {
      return res.send({ error: { message: "User doesn't have access to this group" } });
    }

    members.forEach(memberEmail => {
      //check if member exists
      let user = await authService.findByEmail(memberEmail);
      if (user && !group.members.includes(user)) {
        group.members.push(memberEmail);
      }
    });

    //update group
    await db.groups.updateOne(
      { _id: new ObjectId(groupId) },
      { $set: { ...group } });
  },
  removeUserFromGroup(req, res) {
    let userEmail = req.userEmail;
    let groupId = req.params.id;
    let userToBeRemoved = req.body.user;

    //check if group exists
    let group = await db.groups.findOne({ _id: new ObjectId(groupId) });
    if (!group) return res.send({ error: { message: "Invalid Group id" } });

    //check if the requesting user exists in group
    if (!group.members.includes(userEmail)) {
      return res.send({ error: { message: "User doesn't have access to this group" } });
    }

    //remve the user from group
    group.members = group.members.filter(memberEmail => ( userToBeRemoved!==memberEmail));
    
    //update group
    await db.groups.updateOne(
      { _id: new ObjectId(groupId) },
      { $set: { ...group } });
  },
};

module.exports = service;
