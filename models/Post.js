import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  occasion: {
    type: String,
    required: true,
  },
  caption: {
    type: String,
    required: true,
  },
  imageUrl: String,
  imagePrompt: String,
  linkedinPostId: String,
  status: {
    type: String,
    enum: ["generated", "posted", "failed"],
    default: "generated",
  },
  scheduledFor: Date,
  postedAt: Date,
  error: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
