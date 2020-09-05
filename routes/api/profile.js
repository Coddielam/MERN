const express = require("express");
const router = express.Router();
const config = require("config");
const request = require("request");
const auth = require("../../middlewares/auth");
const User = require("../../models/Users");
const Profile = require("../../models/Profile");
const { check, validationResult } = require("express-validator");

// @route   GET api/profile/me
// @desc    Get current user profile
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(400).json({ msg: "There's no profile for this user." });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST api/profile/
// @desc    Create or update user profile
// @access  Private
router.post(
  "/",
  [
    auth,
    // only status and skills are required fields
    [
      check("status", "Status is required").not().isEmpty(),
      check("skills", "Must enter a skill.").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    // collect validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      // destructure req.body, these are fields in the Profile model
      const {
        company,
        website,
        location,
        status,
        skills, // array
        bio,
        githubusername,
        // need to be nested inside a social object in user
        youtube,
        twitter,
        facebook,
        Linkedin,
        instagram,
      } = req.body;

      // build profile object
      const profileFields = {};
      // setting user field to be user id
      profileFields.user = req.user.id;
      // check if the user added the field; only if yes than it gets added to profile
      if (company) profileFields.company = company;
      if (website) profileFields.website = website;
      if (location) profileFields.location = location;
      if (status) profileFields.status = status;
      if (bio) profileFields.bio = bio;
      if (githubusername) profileFields.githubusername = githubusername;
      // validation already made sure this exists
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
      // social object
      profileFields.social = {};
      if (youtube) profileFields.social.youtube = youtube;
      if (twitter) profileFields.social.twitter = twitter;
      if (facebook) profileFields.social.facebook = facebook;
      if (Linkedin) profileFields.social.Linkedin = Linkedin;
      if (instagram) profileFields.social.youtube = instagram;

      // profile completed -- update or create user profile
      try {
        // query db to check if there's already a profile for the user
        let profile = await Profile.findOne({ user: req.user.id });

        if (profile) {
          profile = await Profile.findOneAndUpdate(
            { user: req.user.id },
            { $set: profileFields },
            { new: true }
          );
          return res.json(profile);
        }

        // if profile not found -- create one
        profile = new Profile(profileFields);

        await profile.save();
        res.json(profile);
      } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error -- findOne.");
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error.");
    }
  }
);

// @route   GET api/profile
// @desc    Get all profiles
// @access  Public
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/profile/user/:user_id
// @desc    Get user profile with user id
// @access  Public
router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);

    if (!profile)
      return res.status(400).json({ msg: "Profile not found. -- no catch" });

    res.json(profile);
  } catch (err) {
    console.log(err.message);
    // invalid objectid will also trigger error
    if (err.kind == "ObjectId")
      return res.status(400).json({ msg: "Profile not found." });
    res.status(500).send("Server error.");
  }
});

// @route   DELETE api/profile
// @desc    Remove profile, user, posts
// @access  Private
router.delete("/", auth, async (req, res) => {
  try {
    // @todo remove posts

    // remove user profile
    await Profile.findOneAndRemove({ user: req.user.id });
    // remove user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: "User removed." });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error.");
  }
});

// @route  PUT /api/profile/experience
// @desc   Add profile experience
// @access Private
router.put("/experience", [
  auth,
  [
    check("title", "Title is required").not().isEmpty(),
    check("company", "Company is required").not().isEmpty(),
    check("from", "Please specify a start date.").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.json({ errors: errors.array() });

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    // build out experience object
    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };
    try {
      let profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newExp);

      await profile.save();
      res.json({ msg: "Experience added." });
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Server error.");
    }
  },
]);

// @route  DELETE /api/profile/experience/:exp_id
// @desc   Delete experience with experience id
// @access Private
router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });

    // get the index of the exp
    const expIndex = profile.experience
      .map((exp) => exp.id)
      .indexOf(req.params.exp_id);

    // remove from the experience array
    profile.experience.splice(expIndex, 1);

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error.");
  }
});

// @route  PUT /api/profile/education
// @desc   Add profile education
// @access Private
router.put("/education", [
  auth,
  [
    check("school", "School is required").not().isEmpty(),
    check("degree", "Degree is required").not().isEmpty(),
    check("fieldofstudy", "Field of study is required").not().isEmpty(),
    check("from", "Please specify a start date.").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.json({ errors: errors.array() });

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;

    // build out education object
    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };
    try {
      let profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(newEdu);

      await profile.save();
      res.json({ msg: "Education added." });
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Server error.");
    }
  },
]);

// @route  DELETE /api/profile/education/:edu_id
// @desc   Delete education with education id
// @access Private
router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });

    // get the index of the exp
    const eduIndex = profile.education
      .map((edu) => edu.id)
      .indexOf(req.params.edu_id);

    // remove from the education array
    profile.education.splice(eduIndex, 1);

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error.");
  }
});

// @route  GET /api/profile/github/:githubusername
// @desc   Get github repos from Gitub
// @access Public
router.get("/github/:githubusername", (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.githubusername
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        "githubClientId"
      )}&client_secret=${config.get("githubSecret")}`,
      method: "get",
      headers: { "user-agent": "node.js" },
    };

    request(options, (err, response, body) => {
      if (err) console.log(err);
      // make sure the response was 200 OKAY
      if (response.statusCode !== 200)
        return res.status(404).json({ msg: "Github user not found." });

      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
