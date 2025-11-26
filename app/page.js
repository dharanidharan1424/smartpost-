"use client";
import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Settings,
  CreditCard,
  Image,
  CheckCircle,
  AlertCircle,
  LogOut,
  RefreshCw,
} from "lucide-react";

const App = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [schedule, setSchedule] = useState({
    time: "09:00",
    enabled: true,
    timezone: "UTC",
  });
  const [todaysPosts, setTodaysPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Check connection status and load user data
  const checkConnection = async () => {
    try {
      console.log("[Frontend] Checking LinkedIn connection status...");
      const res = await fetch("/api/linkedin/status");
      const data = await res.json();
      console.log("[Frontend] Connection status:", data);

      setIsLinkedInConnected(data.connected);
      if (data.user) {
        setUser(data.user);
        setSchedule(data.schedule || schedule);
      }
    } catch (err) {
      console.error("[Frontend] Error checking connection:", err);
    }
  };

  // Fetch today's posts
  const fetchPosts = async () => {
    try {
      console.log("[Frontend] Fetching today's posts...");
      const res = await fetch("/api/posts/today");
      const data = await res.json();
      console.log("[Frontend] Posts received:", data);
      setTodaysPosts(data.posts || []);
    } catch (err) {
      console.error("[Frontend] Error fetching posts:", err);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (isLinkedInConnected) {
      fetchPosts();
      // Refresh posts every 30 seconds
      const interval = setInterval(fetchPosts, 30000);
      return () => clearInterval(interval);
    }
  }, [isLinkedInConnected]);

  const handleLinkedInConnect = () => {
    console.log("[Frontend] Redirecting to LinkedIn OAuth...");
    setLoading(true);
    window.location.href = "/api/linkedin/auth";
  };

  const handleLinkedInDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect LinkedIn?")) return;

    try {
      console.log("[Frontend] Disconnecting LinkedIn...");
      const res = await fetch("/api/linkedin/disconnect", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setIsLinkedInConnected(false);
        setUser(null);
        setTodaysPosts([]);
        setMessage("LinkedIn disconnected successfully");
      }
    } catch (err) {
      console.error("[Frontend] Error disconnecting:", err);
      setMessage("Failed to disconnect LinkedIn");
    }
  };

  const handleScheduleUpdate = async () => {
    setSaving(true);
    setMessage("");

    try {
      console.log("[Frontend] Updating schedule:", schedule);
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });

      const data = await res.json();
      console.log("[Frontend] Schedule update response:", data);

      if (data.success) {
        setMessage("Schedule updated successfully!");
        setSchedule(data.schedule);
      } else {
        setMessage("Failed to update schedule");
      }
    } catch (err) {
      console.error("[Frontend] Error updating schedule:", err);
      setMessage("Failed to update schedule");
    }

    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleTestPost = async () => {
    if (!confirm("This will generate and post immediately. Continue?")) return;

    setLoading(true);
    setMessage("Generating post...");

    try {
      console.log("[Frontend] Triggering test post generation...");
      const res = await fetch("/api/cron/generate-post");
      const data = await res.json();
      console.log("[Frontend] Test post response:", data);

      if (data.success) {
        setMessage("Post generated successfully! Check your LinkedIn.");
        fetchPosts();
      } else {
        setMessage(
          "Failed to generate post: " + (data.error || "Unknown error")
        );
      }
    } catch (err) {
      console.error("[Frontend] Error generating test post:", err);
      setMessage("Failed to generate post");
    }

    setLoading(false);
  };

  const Sidebar = () => (
    <div className="w-64 bg-gray-900 text-white h-screen fixed left-0 top-0 p-6">
      <h1 className="text-2xl font-bold mb-2">PostAI</h1>
      {user && (
        <div className="text-xs text-gray-400 mb-6 truncate">{user.name}</div>
      )}
      <nav className="space-y-2">
        <button
          onClick={() => setCurrentPage("dashboard")}
          className={`w-full flex items-center space-x-3 p-3 rounded-lg transition ${
            currentPage === "dashboard" ? "bg-blue-600" : "hover:bg-gray-800"
          }`}
        >
          <Calendar size={20} />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => setCurrentPage("settings")}
          className={`w-full flex items-center space-x-3 p-3 rounded-lg transition ${
            currentPage === "settings" ? "bg-blue-600" : "hover:bg-gray-800"
          }`}
        >
          <Settings size={20} />
          <span>Settings</span>
        </button>
        <button
          onClick={() => setCurrentPage("pricing")}
          className={`w-full flex items-center space-x-3 p-3 rounded-lg transition ${
            currentPage === "pricing" ? "bg-blue-600" : "hover:bg-gray-800"
          }`}
        >
          <CreditCard size={20} />
          <span>Pricing</span>
        </button>
      </nav>
    </div>
  );

  const Dashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Dashboard</h2>
        {isLinkedInConnected && (
          <button
            onClick={fetchPosts}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {message && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          {message}
        </div>
      )}

      {/* LinkedIn Connection Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">LinkedIn Connection</h3>
        {isLinkedInConnected ? (
          <div>
            <div className="flex items-center text-green-600 mb-4">
              <CheckCircle size={24} className="mr-2" />
              <span>Connected to LinkedIn</span>
            </div>
            {user && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            )}
            <button
              onClick={handleLinkedInDisconnect}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              <LogOut size={16} />
              <span>Disconnect</span>
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center text-orange-600 mb-4">
              <AlertCircle size={24} className="mr-2" />
              <span>Not connected to LinkedIn</span>
            </div>
            <button
              onClick={handleLinkedInConnect}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? "Connecting..." : "Connect LinkedIn"}
            </button>
          </div>
        )}
      </div>

      {/* Current Schedule */}
      {isLinkedInConnected && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Schedule & Testing</h3>
          <div className="flex items-center space-x-2 mb-4">
            <Clock size={20} className="text-gray-600" />
            <span className="text-lg">
              Daily posts at <strong>{schedule.time}</strong>{" "}
              {schedule.timezone}
            </span>
          </div>
          <div className="mb-4">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm ${
                schedule.enabled
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {schedule.enabled ? "Active" : "Paused"}
            </span>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-purple-900 mb-3">
              <strong>🧪 Test Post Generation:</strong> Click below to generate
              and post to LinkedIn immediately. This will create a post with
              AI-generated content about today's date/occasion.
            </p>
            <button
              onClick={handleTestPost}
              disabled={loading}
              className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 font-semibold"
            >
              {loading
                ? "⏳ Generating & Posting..."
                : "🚀 Generate Test Post Now"}
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              ℹ️ <strong>Note:</strong> Automatic posting will happen daily at
              your scheduled time. The button above is for testing only.
            </p>
          </div>
        </div>
      )}

      {/* Today's Posts */}
      {isLinkedInConnected && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">
            Today's Generated Posts
          </h3>
          {todaysPosts.length === 0 ? (
            <p className="text-gray-600">
              No posts generated yet today. Click "Generate Test Post Now" to
              create one!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todaysPosts.map((post, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Image size={16} className="mr-2 text-blue-600" />
                      <span className="text-sm text-gray-600">{post.time}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        post.status === "posted"
                          ? "bg-green-100 text-green-800"
                          : post.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt="Generated post"
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                  )}
                  <p className="text-sm font-semibold mb-1">{post.occasion}</p>
                  <p className="text-sm text-gray-800">{post.caption}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const SettingsPage = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Settings</h2>

      {message && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Posting Schedule</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Post Time (24-hour format)
            </label>
            <input
              type="time"
              value={schedule.time}
              onChange={(e) =>
                setSchedule({ ...schedule, time: e.target.value })
              }
              className="border rounded-lg px-4 py-2 w-full max-w-xs"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Timezone</label>
            <select
              value={schedule.timezone}
              onChange={(e) =>
                setSchedule({ ...schedule, timezone: e.target.value })
              }
              className="border rounded-lg px-4 py-2 w-full max-w-xs"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Asia/Kolkata">India (IST)</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={schedule.enabled}
              onChange={(e) =>
                setSchedule({ ...schedule, enabled: e.target.checked })
              }
              className="w-5 h-5 mr-2"
            />
            <label className="text-sm font-medium">
              Enable automatic posting
            </label>
          </div>

          <button
            onClick={handleScheduleUpdate}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {saving ? "Saving..." : "Save Schedule"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">LinkedIn Account</h3>
        {isLinkedInConnected ? (
          <div>
            {user && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            )}
            <button
              onClick={handleLinkedInDisconnect}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
            >
              Disconnect LinkedIn
            </button>
          </div>
        ) : (
          <button
            onClick={handleLinkedInConnect}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Connect LinkedIn
          </button>
        )}
      </div>
    </div>
  );

  const PricingPage = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Pricing</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-200">
          <h3 className="text-xl font-bold mb-2">Free</h3>
          <p className="text-3xl font-bold mb-4">
            $0<span className="text-sm text-gray-600">/mo</span>
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-start">
              <CheckCircle
                size={20}
                className="text-green-600 mr-2 flex-shrink-0"
              />
              <span className="text-sm">1 post per day</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={20}
                className="text-green-600 mr-2 flex-shrink-0"
              />
              <span className="text-sm">Basic AI images</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={20}
                className="text-green-600 mr-2 flex-shrink-0"
              />
              <span className="text-sm">1 LinkedIn account</span>
            </li>
          </ul>
          <button className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition">
            Current Plan is
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-600">
          <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-2">
            POPULAR
          </div>
          <h3 className="text-xl font-bold mb-2">Pro</h3>
          <p className="text-3xl font-bold mb-4">
            $19<span className="text-sm text-gray-600">/mo</span>
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-start">
              <CheckCircle
                size={20}
                className="text-green-600 mr-2 flex-shrink-0"
              />
              <span className="text-sm">3 posts per day</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={20}
                className="text-green-600 mr-2 flex-shrink-0"
              />
              <span className="text-sm">Premium AI images</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={20}
                className="text-green-600 mr-2 flex-shrink-0"
              />
              <span className="text-sm">3 LinkedIn accounts</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={20}
                className="text-green-600 mr-2 flex-shrink-0"
              />
              <span className="text-sm">Custom scheduling</span>
            </li>
          </ul>
          <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
            Upgrade to Pro
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-200">
          <h3 className="text-xl font-bold mb-2">Enterprise</h3>
          <p className="text-3xl font-bold mb-4">
            $49<span className="text-sm text-gray-600">/mo</span>
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-start">
              <CheckCircle
                size={20}
                className="text-green-600 mr-2 flex-shrink-0"
              />
              <span className="text-sm">Unlimited posts</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={20}
                className="text-green-600 mr-2 flex-shrink-0"
              />
              <span className="text-sm">Premium AI images</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={20}
                className="text-green-600 mr-2 flex-shrink-0"
              />
              <span className="text-sm">10 LinkedIn accounts</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={20}
                className="text-green-600 mr-2 flex-shrink-0"
              />
              <span className="text-sm">Priority support</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={20}
                className="text-green-600 mr-2 flex-shrink-0"
              />
              <span className="text-sm">Analytics dashboard</span>
            </li>
          </ul>
          <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
            Upgrade to Enterprise
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="ml-64 flex-1 p-8">
        {currentPage === "dashboard" && <Dashboard />}
        {currentPage === "settings" && <SettingsPage />}
        {currentPage === "pricing" && <PricingPage />}
      </div>
    </div>
  );
};

export default App;
