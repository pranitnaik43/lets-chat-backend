const { ObjectId } = require("mongodb");
const Joi = require("joi");

const db = require("../mongo");

messageBody = Joi.object({
  connectionId: Joi.string().hex().length(24),
  message: Joi.object({
    from: Joi.string().required(),
    to: Joi.string().required(),
    message: Joi.string().required(),
    timestamp: Joi.string().required()
  })
});

const service = {
  async findChatsById(req, res) {
    try {
      let connectionId = req.params.id;
      const connection = await db.chats.findOne({ connectionId });
      
      //if group is not found
      if (!connection || !connection.chats) {
        return res.send({ error: { message: "No chats found" } });
      }
      res.send([ ...connection.chats ]);

    } catch (err) {
      console.log(err);
      res.send({ error: { message: "Operation failed" } });
    }
  },
  async isFriendOrGroup(connectionId) {
    let id;
    //isFriend
    id = db.friends.findOne({_id: new ObjectId(connectionId)});
    if(id) return "group";
    //isGroup
    id = db.groups.findOne({_id: new ObjectId(connectionId)});
    if(id) return "friend";
    return null;
  },
  async sendMessage(req, res) {
    try {
      let connectionId = req.body.connectionId;
      if(!service.isFriendOrGroup(connectionId)) {
        return res.send({ error: { message: "Invalid ID" } });
      }

      let message = req.body.message;
      // Validate message 
      const { error } = await messageBody.validate(req.body);
      if (error) return res.send({ error: { message: error.details[0].message } });

      let connection = await db.chats.findOne({ connectionId });
      
      if (connection) {
        if(!connection.chats) {
          connection.chats = [];
        }
        connection.chats.push(message);
  
        await db.chats.updateOne(
          { connectionId: connectionId }, 
          { $set: { ...connection } }
        );
      }
      else {
        connection = {
          connectionId,
          chats: [message]
        }

        await db.chats.insertOne({ ...connection });
      }

      
      res.send({ success: { message: "message stored" } });
    } catch (err) {
      console.log(err);
      res.send({ error: { message: "Operation failed" } });
    }
  }
};

module.exports = service;
