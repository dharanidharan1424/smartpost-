import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generatePostContent(occasion) {
  try {
    console.log("[Gemini] → Generating post content for:", occasion);

    // Use the updated model name: gemini-1.5-flash (faster and free tier friendly)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Create a professional and engaging LinkedIn post for "${occasion}". 

Requirements:
- Make it inspiring and professional
- Include relevant emojis (2-3 maximum)
- Keep it between 100-150 words
- Add 3-5 relevant hashtags at the end
- Make it suitable for a business audience
- Focus on positive messaging

Return only the post text without any additional formatting or explanations.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("[Gemini] ✓ Post content generated successfully");
    return text;
  } catch (error) {
    console.error("[Gemini] ✗ Error generating post content:", error.message);

    // Fallback content if Gemini fails
    return `🎉 Happy ${occasion}! 

Wishing everyone a wonderful day filled with opportunities and success. Let's make today count!

What are you working on today? Share in the comments! 👇

#MondayMotivation #Success #Growth #LinkedIn #Professional`;
  }
}

export async function generateImagePrompt(occasion) {
  try {
    console.log("[Gemini] → Generating image prompt for:", occasion);

    // Use the updated model name
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Create a brief, detailed image generation prompt for "${occasion}". 

Requirements:
- Describe a professional, celebratory image suitable for LinkedIn
- Include colors, mood, and visual elements
- Keep it under 150 characters
- Make it professional and business-appropriate
- Focus on positive, uplifting imagery

Return only the image prompt without any additional text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("[Gemini] ✓ Image prompt generated successfully");
    return text;
  } catch (error) {
    console.error("[Gemini] ✗ Error generating image prompt:", error.message);

    // Fallback prompt if Gemini fails
    return `Professional celebration image with blue and gold tones, modern office setting, inspiring atmosphere`;
  }
}

// Note: Gemini doesn't directly generate images
// This function creates a placeholder or can be integrated with an image generation API
export async function generateImage(prompt) {
  console.log("[Image] Creating placeholder image for prompt:", prompt);

  // Option 1: Use a placeholder service
  const encodedText = encodeURIComponent(prompt.substring(0, 50));
  const placeholderUrl = `https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=${encodedText}`;

  console.log("[Image] ✓ Placeholder image URL created");
  return placeholderUrl;

  // Option 2: Integrate with a real image generation API
  // Uncomment and configure if you want to use DALL-E, Stable Diffusion, etc.
  /*
  try {
    // Example with DALL-E (requires OpenAI API key)
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });
    return response.data[0].url;
  } catch (error) {
    console.error('[Image] Error generating image:', error);
    return placeholderUrl;
  }
  */
}

export default genAI;
