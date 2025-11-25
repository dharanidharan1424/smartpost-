import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import User from "@/models/User";

export async function GET(request) {
  try {
    console.log("\n[API /posts/today] === Fetching Today's Posts ===");

    await connectDB();
    console.log("[API /posts/today] ✓ Database connected");

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log("[API /posts/today] Date range:", {
      from: today.toISOString(),
      to: tomorrow.toISOString(),
    });

    // Get userId from cookie (AWAIT cookies() for Next.js 15+)
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    console.log("[API /posts/today] Cookie userId:", userId);

    if (!userId) {
      console.log("[API /posts/today] ✗ No userId, returning empty array");
      return NextResponse.json({ posts: [] });
    }

    const user = await User.findById(userId);

    if (!user) {
      console.log("[API /posts/today] ✗ User not found, returning empty array");
      return NextResponse.json({ posts: [] });
    }

    const posts = await Post.find({
      userId: user._id,
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    }).sort({ createdAt: -1 });

    console.log("[API /posts/today] ✓ Posts found:", posts.length);
    posts.forEach((post, idx) => {
      console.log(`[API /posts/today] Post ${idx + 1}:`, {
        occasion: post.occasion,
        status: post.status,
        time: post.createdAt.toLocaleTimeString(),
      });
    });

    console.log("[API /posts/today] === Fetch Complete ===\n");

    return NextResponse.json({
      posts: posts.map((post) => ({
        id: post._id,
        occasion: post.occasion,
        caption: post.caption,
        imageUrl: post.imageUrl,
        status: post.status,
        time: post.createdAt.toLocaleTimeString(),
        postedAt: post.postedAt,
      })),
    });
  } catch (error) {
    console.error("[API /posts/today] ✗ Error:", error);
    return NextResponse.json(
      { posts: [], error: error.message },
      { status: 500 }
    );
  }
}
