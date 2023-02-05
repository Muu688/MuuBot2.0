const express = require("express");
const { check, validationResult } = require("express-validator");
const UserController = require('../controllers/user');

const router = express.Router();

router.post("/", [
  check("twitchUsername").not().isEmpty().withMessage("Twitch username is required"),
], UserController.updateUser);

router.get("/:twitchUsername", UserController.getUser);

router.get("/users", UserController.allUsers);

module.exports = router;
