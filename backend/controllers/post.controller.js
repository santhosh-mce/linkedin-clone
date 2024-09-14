import cloudinary from "../lib/cloudinary.js";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";
import { sendCommentNotificationEmail } from "../emails/emailHandlers.js";
import fs from "fs";
export const getFeedPosts = async (req, res) => {
	try {
		const posts = await Post.find({ author: { $in: [...req.user.connections, req.user._id] } })
			.populate("author", "name username profilePicture headline")
			.populate("comments.user", "name profilePicture")
			.sort({ createdAt: -1 });

		res.status(200).json(posts);
	} catch (error) {
		console.error("Error in getFeedPosts controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const createPost = async (req, res) => {
	try {
		const { content, image } = req.body;
		let newPost;
		let imagePublicId = null;

		if (image) {
			const imgResult = await cloudinary.uploader.upload(image);
			imagePublicId = imgResult.public_id;
			newPost = new Post({
				author: req.user._id,
				content,
				image: imgResult.secure_url,
				imagePublicId // Store the public_id
			});
		} else {
			newPost = new Post({
				author: req.user._id,
				content,
			});
		}

		await newPost.save();
		res.status(201).json(newPost);
	} catch (error) {
		console.error("Error in createPost controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};


export const deletePost = async (req, res) => {
	try {
		const postId = req.params.id;
		const userId = req.user._id;

		// Find the post by ID
		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ message: "Post not found" });
		}

		// Check if the current user is the author of the post
		if (post.author.toString() !== userId.toString()) {
			return res.status(403).json({ message: "You are not authorized to delete this post" });
		}

		// Delete the image from Cloudinary if it exists
		if (post.imagePublicId) {
			try {
				await cloudinary.uploader.destroy(post.imagePublicId, { resource_type: 'image' });
			} catch (error) {
				console.error("Error deleting image from Cloudinary:", error);
				return res.status(500).json({ message: "Failed to delete image from Cloudinary" });
			}
		}

		// If using local file storage, delete the file from the server
		if (post.imagePublicId) {
			const localFilePath = `uploads/${post.imagePublicId}`; // Adjust path based on your file storage structure
			fs.unlink(localFilePath, (err) => {
				if (err) {
					console.error("Error deleting image from server:", err);
					return res.status(500).json({ message: "Failed to delete image from server" });
				}
			});
		}

		// Delete the post from MongoDB
		await Post.findByIdAndDelete(postId);

		res.status(200).json({ message: "Post deleted successfully" });
	} catch (error) {
		console.error("Error in deletePost controller:", error.message);
		res.status(500).json({ message: "Server error" });
	}
};

export const editPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user._id;
        const { content } = req.body;
        const image = req.file; // Multer will parse the image file

        // Find the post by ID
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if the current user is the author of the post
        if (post.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to edit this post" });
        }

        // Update the content if provided
        if (content) {
            post.content = content;
        }

        // Handle image update
        if (image) {
            // Delete the old image from Cloudinary if it exists
            if (post.imagePublicId) {
                try {
                    await cloudinary.uploader.destroy(post.imagePublicId, { resource_type: 'image' });
                } catch (error) {
                    console.error("Error deleting old image from Cloudinary:", error);
                }
            }

            // Upload the new image to Cloudinary
            let imgResult;
            try {
                imgResult = await cloudinary.uploader.upload(image.path);
                post.image = imgResult.secure_url;
                post.imagePublicId = imgResult.public_id; // Store the new public_id
            } catch (error) {
                console.error("Error uploading new image to Cloudinary:", error);
                return res.status(500).json({ message: "Failed to upload new image" });
            }
        }

        // Save the updated post
        const updatedPost = await post.save();
        res.status(200).json(updatedPost);
    } catch (error) {
        console.error("Error in editPost controller:", error);
        res.status(500).json({ message: "Server error" });
    }
};


export const getPostById = async (req, res) => {
	try {
		const postId = req.params.id;
		const post = await Post.findById(postId)
			.populate("author", "name username profilePicture headline")
			.populate("comments.user", "name profilePicture username headline");

		res.status(200).json(post);
	} catch (error) {
		console.error("Error in getPostById controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const createComment = async (req, res) => {
	try {
		const postId = req.params.id;
		const { content } = req.body;

		const post = await Post.findByIdAndUpdate(
			postId,
			{
				$push: { comments: { user: req.user._id, content } },
			},
			{ new: true }
		).populate("author", "name email username headline profilePicture");

		// create a notification if the comment owner is not the post owner
		if (post.author._id.toString() !== req.user._id.toString()) {
			const newNotification = new Notification({
				recipient: post.author,
				type: "comment",
				relatedUser: req.user._id,
				relatedPost: postId,
			});

			await newNotification.save();

			try {
				const postUrl = process.env.CLIENT_URL + "/post/" + postId;
				await sendCommentNotificationEmail(
					post.author.email,
					post.author.name,
					req.user.name,
					postUrl,
					content
				);
			} catch (error) {
				console.log("Error in sending comment notification email:", error);
			}
		}

		res.status(200).json(post);
	} catch (error) {
		console.error("Error in createComment controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const likePost = async (req, res) => {
	try {
		const postId = req.params.id;
		const post = await Post.findById(postId);
		const userId = req.user._id;

		if (post.likes.includes(userId)) {
			// unlike the post
			post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
		} else {
			// like the post
			post.likes.push(userId);
			// create a notification if the post owner is not the user who liked
			if (post.author.toString() !== userId.toString()) {
				const newNotification = new Notification({
					recipient: post.author,
					type: "like",
					relatedUser: userId,
					relatedPost: postId,
				});

				await newNotification.save();
			}
		}

		await post.save();

		res.status(200).json(post);
	} catch (error) {
		console.error("Error in likePost controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};








