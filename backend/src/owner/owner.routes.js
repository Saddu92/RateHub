const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const ownerController = require("./owner.controller");

const router = express.Router();

router.use(authenticate);
router.use(authorize("STORE_OWNER"));

router.get("/dashboard", ownerController.getDashboard);
router.post("/stores", ownerController.createStore);

module.exports = router;