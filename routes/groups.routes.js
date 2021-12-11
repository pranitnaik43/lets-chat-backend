const router = require("express").Router();

const service = require("../services/groups.services");

router.get("/", service.getAllGroups);
router.get("/:id", service.getGroupData);
router.post("/", service.createGroup);
router.post("/add-users/:id", service.addUsersToGroup);
router.post("/remove-users/:id", service.removeUserFromGroup);

module.exports = router;
