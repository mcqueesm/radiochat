var express = require("express");
var router = express.Router();

var controller = require("../controllers/controller");

var User = require("../models/User");
//@route POST api/register
//@desc Register a new users
//@access Public
router.post("/register", controller.check_errors, controller.register_user);

//@route POST api/auth
//@desc Authenticate user
//@access Public
router.post("/login", controller.authorize_user);

//@route GET api/verifyToken
//@desc Middleware to check for verifyToken
//@access Public
router.get("/verifyToken", controller.withAuth, controller.success);

module.exports = router;
