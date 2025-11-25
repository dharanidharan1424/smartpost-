import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  console.log("\n[API /linkedin/callback] === OAuth Callback Received ===");
  console.log(
    "[API /linkedin/callback] Authorization code:",
    code ? "✓ Received" : "✗ Missing"
  );

  if (!code) {
    console.log("[API /linkedin/callback] ✗ No authorization code provided");
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?error=no_code`
    );
  }

  try {
    console.log(
      "[API /linkedin/callback] → Exchanging code for access token..."
    );

    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    console.log("[API /linkedin/callback] ✓ Access token received");
    console.log(
      "[API /linkedin/callback] Token expires in:",
      expires_in,
      "seconds"
    );

    // Get user profile
    console.log("[API /linkedin/callback] → Fetching user profile...");
    const profileResponse = await axios.get(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const profile = profileResponse.data;
    console.log("[API /linkedin/callback] ✓ Profile received:", {
      name: profile.name,
      email: profile.email,
      linkedinId: profile.sub,
    });

    // Save to database
    await connectDB();
    console.log("[API /linkedin/callback] ✓ Database connected");

    const tokenExpiry = new Date(Date.now() + expires_in * 1000);

    const user = await User.findOneAndUpdate(
      { linkedinId: profile.sub },
      {
        linkedinId: profile.sub,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiry,
        profile: {
          name: profile.name,
          email: profile.email,
          picture: profile.picture,
        },
      },
      { upsert: true, new: true }
    );

    console.log("[API /linkedin/callback] ✓ User saved to database:", user._id);
    console.log("[API /linkedin/callback] User schedule:", user.schedule);

    // Set cookie with userId using cookies() directly
    const cookieStore = await cookies();
    cookieStore.set("userId", user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    console.log("[API /linkedin/callback] ✓ Cookie set with userId:", user._id);
    console.log("[API /linkedin/callback] === OAuth Complete ===\n");

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?connected=true`
    );
  } catch (error) {
    console.error(
      "[API /linkedin/callback] ✗ OAuth error:",
      error.response?.data || error.message
    );
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?error=auth_failed`
    );
  }
}
