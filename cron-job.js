const cron = require("node-cron");
const axios = require("axios");

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Run every day at the scheduled time (you can adjust this)
// This runs at midnight and checks each user's schedule
cron.schedule("0 * * * *", async () => {
  console.log("Running cron job to generate posts...");

  try {
    const response = await axios.get(`${APP_URL}/api/cron/generate-post`);
    console.log("Cron job completed:", response.data);
  } catch (error) {
    console.error("Cron job failed:", error.message);
  }
});

console.log("Cron job scheduler started");
