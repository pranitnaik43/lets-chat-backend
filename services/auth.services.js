const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const { ObjectId } = require("mongodb");

const db = require("../mongo");

const regBody = Joi.object({
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginBody = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const service = {
  findByEmail(email) {
    return db.users.findOne({ email });
  },
  async getUserDataWithoutPassword(email) {
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
  async findById(req, res) {
    let userId = req.userId;
    let user = await db.users.findOne({ _id: new ObjectId(userId) });
    if (!user)
      return res.send({ error: { message: "User not found" } });
    res.send(user);
  },
  async signUp(req, res) {
    let body = req.body;

    // Validate Request Body
    const { error } = await regBody.validate(req.body);
    if (error) return res.send({ error: { message: error.details[0].message } });

    // Check User Already Exists
    const data = await this.findByEmail(body.email);
    if (data) return res.send({ error: { message: "Email already exists" } });

    // Encrypt Password
    const salt = await bcrypt.genSalt(10);
    body.password = await bcrypt.hash(body.password, salt);

    // Insert User to DB
    await db.users.insertOne({ ...body });

    res.send({ success: { message: "Registered successfully" } });
  },
  async signIn(req, res) {
    // Validate Request Body
    const { error } = await loginBody.validate(req.body);
    if (error) return res.send({ error: { message: error.details[0].message } });

    // Check User Already Exists
    const data = await this.findByEmail(req.body.email);
    if (!data)
      return res.send({ error: { message: "User doesn't exist. Please signup" } });

    // Check Password
    const valid = await bcrypt.compare(req.body.password, data.password);
    if (!valid) return res.send({ error: { message: "User credentials doesn't match" } });

    // Generate Token
    const token = await jwt.sign({ userId: data._id }, process.env.AUTH_SECRET);

    res.send({ success: { accessToken: token, isAdmin: data.isAdmin } });
  },
  async validateAccessToken(req, res, next) {
    try {
      const token = req.headers["access-token"];

      if (!token) {
        return res.send({ error: { message: "Access Denied" } });
      }

      // verify access token
      let data = await jwt.verify(token, process.env.AUTH_SECRET);
      let user = await db.users.findOne({ _id: new ObjectId(data.userId) });
      if (!user) {
        return res.send({ error: { message: "Access Denied" } });
      }

      req.userId = data.userId;
      req.userEmail = user.email;
      req.isAdmin = user.isAdmin;
      next();

    } catch (err) {
      res.send({ error: { message: "Access Denied" } });
    }
  },
  async isAdmin(req, res, next) {
    let userId = req.userId;
    let user = await db.users.findOne({ _id: new ObjectId(userId) });

    if (user) {
      (user.isAdmin) ? (
        next()
      ) : (
        res.send({ error: { message: "User doesn't have access" } })
      );

    } else {
      res.send({ error: { message: "User doesn't have access" } });
    }
  }
};

module.exports = service;
