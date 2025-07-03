import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    clerkId: { type: String, required: true, unique: true }, // Clerk user ID
    username: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    bio: { type: String, default: '' },
    profilePicture: { type: String, default: '' }, // Cloudinary URL
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

export default User;