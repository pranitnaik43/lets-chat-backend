const router = require("express").Router();

const service = require("../services/friends.services");

router.get("/", service.getAllFriends);
router.get("/requests", service.getFriendRequests);
router.post("/requests", service.updateFriendRequest);
router.get("/:email", service.findByEmail);

module.exports = router;
