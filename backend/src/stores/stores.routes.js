const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const validate = require("../middleware/validation.middleware");

const {
  ratingValidation,
} = require("./stores.validation");

const storesController = require("./stores.controller");

const router = express.Router();

// Store listing
// USER authentication allows us to return their own rating.
router.get(
  "/",
  authenticate,
  authorize("USER", "STORE_OWNER", "ADMIN"),
  storesController.getStores
);

// Single store
router.get(
  "/:id",
  authenticate,
  authorize("USER", "STORE_OWNER", "ADMIN"),
  storesController.getStoreById
);

// Submit rating
router.post(
  "/:id/rating",
  authenticate,
  authorize("USER"),
  ratingValidation,
  validate,
  storesController.submitRating
);

// Modify rating
router.patch(
  "/:id/rating",
  authenticate,
  authorize("USER"),
  ratingValidation,
  validate,
  storesController.updateRating
);

module.exports = router;