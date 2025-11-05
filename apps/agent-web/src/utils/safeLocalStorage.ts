// Safe wrapper for localStorage operations with error handling
const safeLocalStorage = {
  setItem: (key: string, value: string) => {
    try {
      // For chat messages, implement compression and size limits
      if (key.startsWith("chat_messages_") && typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          // Limit to last 50 messages to prevent storage bloat
          if (Array.isArray(parsed) && parsed.length > 50) {
            console.warn(`Truncating chat history for ${key} from ${parsed.length} to 50 messages`);
            const truncated = parsed.slice(-50);
            value = JSON.stringify(truncated);
          }
        } catch (parseError) {
          console.warn("Could not parse chat messages for truncation:", parseError);
        }
      }

      localStorage.setItem(key, value);
    } catch (error) {
      if (error.name === "QuotaExceededError") {
        console.warn("localStorage quota exceeded, clearing old data");
        // Clear old chat messages to free up space
        const keys = Object.keys(localStorage);
        const chatKeys = keys.filter((k) => k.startsWith("chat_messages_")).sort();

        // Remove oldest chat data first, keeping only the 3 most recent projects
        if (chatKeys.length > 3) {
          chatKeys.slice(0, chatKeys.length - 3).forEach((k) => {
            localStorage.removeItem(k);
            console.log(`Removed old chat data: ${k}`);
          });
        }

        // If still failing, clear draft inputs too
        const draftKeys = keys.filter((k) => k.startsWith("draft_input_"));
        draftKeys.forEach((k) => {
          localStorage.removeItem(k);
        });

        // Try again with reduced data
        try {
          localStorage.setItem(key, value);
        } catch (retryError) {
          console.error("Failed to save to localStorage even after cleanup:", retryError);
          // Last resort: Try to save just the last 10 messages
          if (key.startsWith("chat_messages_") && typeof value === "string") {
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed) && parsed.length > 10) {
                const minimal = parsed.slice(-10);
                localStorage.setItem(key, JSON.stringify(minimal));
                console.warn("Saved only last 10 messages due to quota constraints");
              }
            } catch (finalError) {
              console.error("Final save attempt failed:", finalError);
            }
          }
        }
      } else {
        console.error("localStorage error:", error);
      }
    }
  },
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error("localStorage getItem error:", error);
      return null;
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("localStorage removeItem error:", error);
    }
  },
};

export default safeLocalStorage;
