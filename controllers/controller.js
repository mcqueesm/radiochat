//const passport = require('passport');
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { check, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");
var jwt = require("jsonwebtoken");

//Use express-validator to find errors on registration form
exports.check_errors = [
  check("first", "First name between 1 and 20 characters")
    .isLength({
      min: 1,
      max: 20
    })
    .escape(),
  check("last", "Last name between 1 and 20 characters")
    .isLength({
      min: 1,
      max: 20
    })
    .escape(),
  check("email", "Invalid email address")
    .isEmail()
    .escape(),
  check("password", "Password must contain at least 8 characters")
    .isLength({
      min: 8
    })
    .escape()
];

exports.register_user = function(req, res, next) {
  const errors = validationResult(req);
  let errorArray = errors.array();
  const { email, first, last, password } = req.body;

  //Handle errors
  if (!errors.isEmpty()) {
    return res.status(400).json(errorArray);
  }
  //Look for user in database
  User.findOne({ email }).then(user => {
    //User already exists
    if (user) return res.status(400).json([{ msg: "User already exists" }]);

    //Create new user
    const newUser = new User({
      email,
      first,
      last,
      password
    });

    //Salt and hash
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) throw err;
        newUser.password = hash;
        newUser.save().then(user => {
          jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: 86400 },
            (err, token) => {
              res.json({
                token: token,
                user: {
                  id: user.id,
                  email: user.email,
                  first: user.first,
                  last: user.last
                }
              });
            }
          );
        });
      });
    });
  });
};
exports.sanitize_login = [
  sanitizeBody("email").escape(),
  sanitizeBody("password").escape()
];

exports.authorize_user = function(req, res, next) {
  const { email, password } = req.body;
  check("email");
  //Check that fields aren't empty
  if (!email || !password) {
    res.status(400).json([{ msg: "All fields must be filled" }]);
  }
  //Look for user in database
  User.findOne({ email }).then(user => {
    //User already exists
    if (!user) return res.status(400).json([{ msg: "User does not exist" }]);

    bcrypt.compare(password, user.password).then(match => {
      if (!match) return res.status(400).json([{ msg: "Invalid Password" }]);

      jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: 86400 },
        (err, token) => {
          res.cookie("token", token, { httpOnly: true }).sendStatus(200);
        }
      );
    });
  });
};

exports.withAuth = function(req, res, next) {
  const token =
    req.body.token ||
    req.query.token ||
    req.headers["x-access-token"] ||
    req.cookies.token;

  if (!token) {
    res.status(401).send("Unauthorized: No token provided");
  } else {
    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
      if (err) {
        res.status(401).send("Unauthorized: Invalid token");
      } else {
        req.email = decoded.email;
        next();
      }
    });
  }
};

exports.success = function(req, res, next) {
  res.sendStatus(200);
};

exports.logout = function(req, res, next) {
  res.clearCookie("token");
  return res.sendStatus(200);
};
