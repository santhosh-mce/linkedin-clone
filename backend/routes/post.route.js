import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import {
	createPost,
	getFeedPosts,
	deletePost,
	getPostById,
	createComment,
	likePost,
	editPost,
} from "../controllers/post.controller.js";

const router = express.Router();

router.get("/", protectRoute, getFeedPosts);
router.post("/create", protectRoute, upload.single('image'), createPost);
router.delete("/delete/:id", protectRoute, deletePost);
router.get("/:id", protectRoute, getPostById);
router.post("/:id/comment", protectRoute, createComment);
router.post("/:id/like", protectRoute, likePost);
router.put("/edit/:id", protectRoute, upload.single('image'), editPost);

export default router;
