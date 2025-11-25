import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    console.log("\n[API /linkedin/disconnect] === Disconnecting LinkedIn ===");

    const response = NextResponse.json({ success: true });

    // AWAIT cookies() for Next.js 15+
    const cookieStore = await cookies();
    response.cookies.delete("userId");

    console.log("[API /linkedin/disconnect] ✓ Cookie cleared");
    console.log("[API /linkedin/disconnect] === Disconnect Complete ===\n");

    return response;
  } catch (error) {
    console.error("[API /linkedin/disconnect] ✗ Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
