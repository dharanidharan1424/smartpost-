import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request) {
  try {
    console.log(
      "\n[API /linkedin/status] === Checking LinkedIn connection status ==="
    );

    await connectDB();
    console.log("[API /linkedin/status] ✓ Database connected");

    // Get userId from cookie (AWAIT cookies() for Next.js 15+)
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    console.log("[API /linkedin/status] Cookie userId:", userId);

    if (!userId) {
      console.log("[API /linkedin/status] ✗ No userId cookie found");
      return NextResponse.json({ connected: false });
    }

    const user = await User.findById(userId);
    console.log("[API /linkedin/status] User found:", user ? "✓" : "✗");

    if (!user) {
      console.log("[API /linkedin/status] ✗ User not found in database");
      return NextResponse.json({ connected: false });
    }

    console.log("[API /linkedin/status] ✓ User authenticated:", {
      name: user.profile.name,
      email: user.profile.email,
      schedule: user.schedule,
    });

    return NextResponse.json({
      connected: true,
      user: {
        name: user.profile.name,
        email: user.profile.email,
        picture: user.profile.picture,
      },
      schedule: user.schedule,
    });
  } catch (error) {
    console.error("[API /linkedin/status] ✗ Error:", error);
    return NextResponse.json(
      { connected: false, error: error.message },
      { status: 500 }
    );
  }
}
