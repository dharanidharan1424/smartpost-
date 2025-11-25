import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import axios from "axios";

export async function GET(request) {
  try {
    console.log("\n[TEST] === Testing LinkedIn API ===");

    await connectDB();

    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Please connect your LinkedIn account first",
        },
        { status: 401 }
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    console.log("[TEST] → Testing LinkedIn API with access token...");

    // Test getting user profile
    const profileResponse = await axios.get(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      }
    );

    console.log("[TEST] ✓ LinkedIn API working!");
    console.log("[TEST] Profile:", profileResponse.data);

    return NextResponse.json({
      success: true,
      profile: profileResponse.data,
      message: "LinkedIn API is working correctly!",
      tokenExpiry: user.tokenExpiry,
    });
  } catch (error) {
    console.error(
      "[TEST] ✗ LinkedIn API Error:",
      error.response?.data || error.message
    );

    return NextResponse.json(
      {
        success: false,
        error: error.response?.data || error.message,
        message:
          "LinkedIn API test failed. Token might be expired or permissions missing.",
      },
      { status: 500 }
    );
  }
}
