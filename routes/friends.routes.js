const router = require("express").Router();

const service = require("../services/friends.services");

router.get("/", service.getAllFriends);
router.get("/:email", service.findByEmail);

router.post("/add-friend", service.updateFriendRequest);

module.exports = router;
