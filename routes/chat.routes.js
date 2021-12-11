const router = require("express").Router();

const service = require("../services/chat.services");

router.get("/:id", service.findChatsById);
router.post("/", service.sendMessage);

module.exports = router;
