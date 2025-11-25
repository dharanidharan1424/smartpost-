import { NextResponse } from "next/server";
import axios from "axios";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request) {
  try {
    const { caption, imageUrl, userId } = await request.json();

    await connectDB();
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Post to LinkedIn
    const postData = {
      author: `urn:li:person:${user.linkedinId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: caption,
          },
          shareMediaCategory: imageUrl ? "IMAGE" : "NONE",
          ...(imageUrl && {
            media: [
              {
                status: "READY",
                originalUrl: imageUrl,
              },
            ],
          }),
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    const response = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      postData,
      {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    return NextResponse.json({
      success: true,
      postId: response.data.id,
    });
  } catch (error) {
    console.error("LinkedIn post error:", error);
    return NextResponse.json(
      { error: "Failed to post to LinkedIn", details: error.message },
      { status: 500 }
    );
  }
}
