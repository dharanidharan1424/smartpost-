import { NextResponse } from "next/server";
import { generatePostContent, generateImagePrompt } from "@/lib/gemini";

export async function GET(request) {
  try {
    console.log("\n[TEST] === Testing Gemini API ===");

    // Test 1: Generate caption
    console.log("[TEST] → Testing caption generation...");
    const testOccasion = "Monday, November 25, 2025";
    const caption = await generatePostContent(testOccasion);
    console.log("[TEST] ✓ Caption generated successfully!");
    console.log("[TEST] Caption:", caption);

    // Test 2: Generate image prompt
    console.log("[TEST] → Testing image prompt generation...");
    const imagePrompt = await generateImagePrompt(testOccasion);
    console.log("[TEST] ✓ Image prompt generated successfully!");
    console.log("[TEST] Image prompt:", imagePrompt);

    console.log("[TEST] === All Tests Passed ===\n");

    return NextResponse.json({
      success: true,
      caption,
      imagePrompt,
      message: "Gemini API is working correctly!",
    });
  } catch (error) {
    console.error("[TEST] ✗ Gemini API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
        message:
          "Gemini API test failed. Check your GEMINI_API_KEY in .env.local",
      },
      { status: 500 }
    );
  }
}
