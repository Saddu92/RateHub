const express = require("express");

const authController = require("./auth.controller");

const validate = require("../middleware/validation.middleware");

const authenticate = require("../middleware/auth.middleware");

const {
  registerValidation,
  loginValidation,
  changePasswordValidation,
} = require("./auth.validation");

const router = express.Router();

router.post(
  "/register",
  registerValidation,
  validate,
  authController.register
);

router.get(
  "/me",
  authenticate,
  authController.getMe
);

router.post(
  "/login",
  loginValidation,
  validate,
  authController.login
);

router.patch(
  "/change-password",
  authenticate,
  changePasswordValidation,
  validate,
  authController.changePassword
);

module.exports = router;
