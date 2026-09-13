const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const adminController = require("./admin.controller");

const router = express.Router();

// Every route below requires ADMIN
router.use(authenticate);
router.use(authorize("ADMIN"));

// Dashboard
router.get("/dashboard", adminController.getDashboard);

// Users
router.get("/users", adminController.getUsers);
router.get("/users/:id", adminController.getUserById);
router.post("/users", adminController.createUser);
router.patch("/users/:id/role", adminController.updateUserRole);

// Stores
router.get("/stores", adminController.getStores);
router.post("/stores", adminController.createStore);

module.exports = router;