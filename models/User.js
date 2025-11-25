import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  linkedinId: {
    type: String,
    required: true,
    unique: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: String,
  tokenExpiry: Date,
  profile: {
    name: String,
    email: String,
    picture: String,
  },
  schedule: {
    time: {
      type: String,
      default: "09:00",
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  subscription: {
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    postsPerDay: {
      type: Number,
      default: 1,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
