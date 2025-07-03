import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Clerk user ID
  text: { type: String, required: true },
  media: [{ type: String }], // Array of Cloudinary URLs (images/videos)
  createdAt: { type: Date, default: Date.now },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null }, // For replies
  retweetOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null }, // For retweets
});

const Post = mongoose.model('Post', postSchema);

export default Post;