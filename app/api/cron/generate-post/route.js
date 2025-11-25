import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";
import { generatePostContent, generateImagePrompt } from "@/lib/gemini";
import axios from "axios";

// Get special occasion for today
function getTodayOccasion() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const occasions = {
    "1-1": "New Year's Day 2025",
    "2-14": "Valentine's Day",
    "3-8": "International Women's Day",
    "4-22": "Earth Day",
    "5-1": "Labour Day",
    "7-4": "Independence Day (USA)",
    "10-31": "Halloween",
    "11-27": "Thanksgiving 2025",
    "12-25": "Christmas",
  };

  const key = `${month}-${day}`;
  return (
    occasions[key] ||
    `${today.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })}`
  );
}

export async function GET(request) {
  try {
    console.log(
      "\n[API /cron/generate-post] ===================================="
    );
    console.log("[API /cron/generate-post] === STARTING POST GENERATION ===");
    console.log(
      "[API /cron/generate-post] ====================================\n"
    );

    await connectDB();
    console.log("[API /cron/generate-post] ✓ Database connected");

    // Get userId from cookie (AWAIT cookies() for Next.js 15+)
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    let users;
    if (userId) {
      // Manual trigger - generate for current user only
      console.log("[API /cron/generate-post] Manual trigger for user:", userId);
      users = await User.find({ _id: userId, "schedule.enabled": true });
    } else {
      // Cron trigger - generate for all enabled users
      console.log(
        "[API /cron/generate-post] Cron trigger - checking all users"
      );
      users = await User.find({ "schedule.enabled": true });
    }

    console.log("[API /cron/generate-post] Users to process:", users.length);

    if (users.length === 0) {
      console.log(
        "[API /cron/generate-post] ⚠ No users with enabled schedules found"
      );
      return NextResponse.json({
        success: true,
        message: "No users to process",
        results: [],
      });
    }

    const results = [];
    const occasion = getTodayOccasion();
    console.log("[API /cron/generate-post] Today's occasion:", occasion);

    for (const user of users) {
      console.log(
        "\n[API /cron/generate-post] --- Processing user:",
        user.profile.name,
        "---"
      );
      console.log("[API /cron/generate-post] User ID:", user._id);
      console.log("[API /cron/generate-post] Schedule:", user.schedule);

      try {
        // Generate post content
        console.log(
          "[API /cron/generate-post] → Generating caption with Gemini AI..."
        );
        const caption = await generatePostContent(occasion);
        console.log(
          "[API /cron/generate-post] ✓ Caption generated:",
          caption.substring(0, 100) + "..."
        );

        // Generate image prompt
        console.log("[API /cron/generate-post] → Generating image prompt...");
        const imagePrompt = await generateImagePrompt(occasion);
        console.log("[API /cron/generate-post] ✓ Image prompt:", imagePrompt);

        // For now, use a placeholder image
        const imageUrl = `https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=${encodeURIComponent(
          occasion
        )}`;
        console.log("[API /cron/generate-post] ✓ Image URL:", imageUrl);

        // Save post to database
        console.log("[API /cron/generate-post] → Saving post to database...");
        const post = await Post.create({
          userId: user._id,
          occasion,
          caption,
          imageUrl,
          imagePrompt,
          status: "generated",
          scheduledFor: new Date(),
        });
        console.log(
          "[API /cron/generate-post] ✓ Post saved with ID:",
          post._id
        );

        // Post to LinkedIn
        console.log("[API /cron/generate-post] → Posting to LinkedIn...");
        try {
          const linkedinData = {
            author: `urn:li:person:${user.linkedinId}`,
            lifecycleState: "PUBLISHED",
            specificContent: {
              "com.linkedin.ugc.ShareContent": {
                shareCommentary: {
                  text: caption,
                },
                shareMediaCategory: "NONE", // Set to NONE for text-only, or IMAGE if you have image upload
              },
            },
            visibility: {
              "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
            },
          };

          console.log("[API /cron/generate-post] LinkedIn post data prepared");

          const linkedinResponse = await axios.post(
            "https://api.linkedin.com/v2/ugcPosts",
            linkedinData,
            {
              headers: {
                Authorization: `Bearer ${user.accessToken}`,
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
              },
            }
          );

          console.log(
            "[API /cron/generate-post] ✓ Posted to LinkedIn successfully"
          );
          console.log(
            "[API /cron/generate-post] LinkedIn Post ID:",
            linkedinResponse.data.id
          );

          post.status = "posted";
          post.linkedinPostId = linkedinResponse.data.id;
          post.postedAt = new Date();
        } catch (linkedinError) {
          console.error(
            "[API /cron/generate-post] ✗ LinkedIn posting failed:",
            linkedinError.response?.data || linkedinError.message
          );
          post.status = "failed";
          post.error =
            linkedinError.response?.data?.message || linkedinError.message;
        }

        await post.save();
        console.log(
          "[API /cron/generate-post] ✓ Post status updated:",
          post.status
        );

        results.push({
          userId: user._id,
          userName: user.profile.name,
          success: post.status === "posted",
          postId: post._id,
          status: post.status,
        });

        console.log("[API /cron/generate-post] ✓ User processing complete");
      } catch (error) {
        console.error(
          `[API /cron/generate-post] ✗ Error for user ${user._id}:`,
          error.message
        );
        results.push({
          userId: user._id,
          userName: user.profile.name,
          success: false,
          error: error.message,
        });
      }
    }

    console.log(
      "\n[API /cron/generate-post] ===================================="
    );
    console.log("[API /cron/generate-post] === POST GENERATION COMPLETE ===");
    console.log("[API /cron/generate-post] Total processed:", users.length);
    console.log(
      "[API /cron/generate-post] Successful:",
      results.filter((r) => r.success).length
    );
    console.log(
      "[API /cron/generate-post] Failed:",
      results.filter((r) => !r.success).length
    );
    console.log(
      "[API /cron/generate-post] ====================================\n"
    );

    return NextResponse.json({
      success: true,
      occasion,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API /cron/generate-post] ✗ CRITICAL ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Cron job failed", details: error.message },
      { status: 500 }
    );
  }
}
