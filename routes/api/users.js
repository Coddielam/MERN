const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const gravatar = require("gravatar");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("config");

const User = require("../../models/Users");
// @route   POST api/users
// @desc    Registering user
// @access  Public
router.post(
  "/",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Invalid email format").isEmail(),
    check("password", "Password must be longer than 5 letters").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    try {
      // Check if user already exits
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists." }] });
      }
      // Get user gravatar
      const avatar = await gravatar.url(email, {
        size: "200",
        rating: "pg",
        default: "retro",
      });

      // create a user object using the model
      user = new User({
        name,
        email,
        avatar,
        password,
      });

      // hash password
      const saltRound = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, saltRound);

      // saving to the database
      await user.save();

      // create and return to client JWT
      // in our case, we will return them their userid(auto-generated in MongoDB)
      // in MongoDB it's called _id, but mongoose changes it to id and allow us to access it that way
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        {
          expiresIn: "7d",
        },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error.");
    }
  }
);

module.exports = router;
