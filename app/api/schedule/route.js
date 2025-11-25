import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request) {
  try {
    const { time, timezone, enabled } = await request.json();

    console.log("\n[API /schedule] === Updating Schedule ===");
    console.log("[API /schedule] New schedule:", { time, timezone, enabled });

    await connectDB();
    console.log("[API /schedule] ✓ Database connected");

    // Get userId from cookie (AWAIT cookies() for Next.js 15+)
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    console.log("[API /schedule] Cookie userId:", userId);

    if (!userId) {
      console.log("[API /schedule] ✗ No userId cookie found");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await User.findById(userId);

    if (!user) {
      console.log("[API /schedule] ✗ User not found");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("[API /schedule] Previous schedule:", user.schedule);

    user.schedule = {
      time,
      timezone,
      enabled,
    };

    await user.save();

    console.log("[API /schedule] ✓ Schedule updated successfully");
    console.log("[API /schedule] New schedule saved:", user.schedule);
    console.log("[API /schedule] === Update Complete ===\n");

    return NextResponse.json({
      success: true,
      schedule: user.schedule,
    });
  } catch (error) {
    console.error("[API /schedule] ✗ Error:", error);
    return NextResponse.json(
      { error: "Failed to update schedule", details: error.message },
      { status: 500 }
    );
  }
}
