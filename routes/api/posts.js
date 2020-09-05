const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/auth");
const { check, validationResult } = require("express-validator");
const Post = require("../../models/Post");
const User = require("../../models/Users");

// @route   POST api/posts
// @desc    Add post
// @access  Private
router.post(
  "/",
  [auth, [check("texts", "Cannot post without text.").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array });
    // building post object
    try {
      const user = await User.findById(req.user.id).select("-password");
      let newPost = {
        user: req.user.id,
        texts: req.body.texts,
        name: user.name,
        avatar: user.avatar,
      };
      const post = new Post(newPost);
      await post.save();
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error.");
    }
  }
);

// @route   GET api/posts
// @desc    Get all posts
// @access  Private -- because the frontend made it you have to logged in to see the posts
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error.");
  }
});

// @route   GET api/posts/:post_id
// @desc    Get post by psot id
// @access  Private -- because the frontend made it you have to logged in to see the posts
router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ msg: "Post not found." });

    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId")
      return res.status(404).json({ msg: "Post not found." });
    res.status(500).send("Server error.");
  }
});

// @route   DELETE api/posts/:id
// @desc    Delete post
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // if post doesn't exist
    if (!post) return res.status(404).json({ msg: "Post not found." });

    // check if user is the user who owns the post
    if (post.user.toString() !== req.user.id) {
      return res.json({ msg: "Not authorized to remove post." });
    }

    post.remove();

    res.json({ msg: "Post has been removed." });
  } catch (err) {
    console.error(err);
    if (err.kind == "ObjectId")
      return res.status(404).json({ msg: "Post not found." });
    res.status(500).send("Server error.");
  }
});

// @route   PUT api/posts/like/:post_id
// @desc    Add like to post
// @access  Private
router.put("/like/:post_id", auth, async (req, res) => {
  try {
    // get the post
    const post = await Post.findById(req.params.post_id);
    // if invalid post id
    if (!post) return res.status(404).json({ msg: "Post not found." });

    // check if user already liked
    const alreadyLiked = post.likes
      .map((like) => like.user.toString())
      .includes(req.user.id);
    // if already liked, remove like
    if (alreadyLiked)
      return res.status(400).json({ msg: "Post already liked." });
    // if not, add like
    post.likes.unshift({ user: req.user.id });

    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error.");
  }
});

// @route   PUT api/posts/unlike/:post_id
// @desc    Unlike a post
// @access  Private
router.put("/unlike/:post_id", auth, async (req, res) => {
  try {
    // get the post
    const post = await Post.findById(req.params.post_id);
    // if invalid post id
    if (!post) return res.status(404).json({ msg: "Post not found." });

    // check if user already liked
    const alreadyLiked = post.likes
      .map((like) => like.user.toString())
      .includes(req.user.id);

    // if not already liked
    if (!alreadyLiked)
      return res.status(400).json({ msg: "Post has not yet been liked." });

    // if alreadyLiked, splice
    // find index
    const postIndex = post.likes
      .map((like) => like.toString())
      .indexOf(req.params.post_id);
    post.likes.splice(postIndex, 1);

    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error.");
  }
});

// @route   POST api/posts/comment/:post_id
// @desc    Add comment
// @access  Private
router.post(
  "/comment/:post_id",
  [auth, [check("text", "Cannot post comment without text.").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array });
    // building post object
    try {
      const user = await User.findById(req.user.id).select("-password");
      let newComment = {
        user: req.user.id,
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
      };
      const post = await Post.findById(req.params.post_id);
      post.comments.unshift(newComment);
      await post.save();
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error.");
    }
  }
);

// @route   POST api/posts/comment/:post_id/:comment_id
// @desc    Delete comment
// @access  Private
router.delete("/comment/:post_id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    // pull out the comment
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    // if no comment
    if (!comment) return res.status(404).json({ msg: "Comment not found." });

    // check to make sure the user is the one made the comment
    const isCommentOwner = comment.user.toString() === req.user.id;
    if (!isCommentOwner)
      return res.status(401).json({ msg: "Unauthorized to remove comment." });

    const commentIndex = post.comments
      .map((comment) => comment._id)
      .indexOf(req.params.comment_id);
    post.comments.splice(commentIndex, 1);

    await post.save();
    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error.");
  }
});

module.exports = router;
