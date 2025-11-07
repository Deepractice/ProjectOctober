/**
 * Media API Routes
 * Handles audio transcription and image uploads
 */

import express from "express";
import fetch from "node-fetch";

/** @type {import('express').Router} */
const router = express.Router();

// Audio transcription endpoint
router.post("/transcribe", async (req, res) => {
  try {
    const multer = (await import("multer")).default;
    const upload = multer({ storage: multer.memoryStorage() });

    // Handle multipart form data
    upload.single("audio")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: "Failed to process audio file" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "OpenAI API key not configured. Please set OPENAI_API_KEY in server environment.",
        });
      }

      try {
        // Create form data for OpenAI
        const FormData = (await import("form-data")).default;
        const formData = new FormData();
        formData.append("file", req.file.buffer, {
          filename: req.file.originalname,
          contentType: req.file.mimetype,
        });
        formData.append("model", "whisper-1");
        formData.append("response_format", "json");
        formData.append("language", "en");

        // Make request to OpenAI
        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            ...formData.getHeaders(),
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `Whisper API error: ${response.status}`);
        }

        const data = await response.json();
        let transcribedText = data.text || "";

        // Check if enhancement mode is enabled
        const mode = req.body.mode || "default";

        // If no transcribed text, return empty
        if (!transcribedText) {
          return res.json({ text: "" });
        }

        // If default mode, return transcribed text without enhancement
        if (mode === "default") {
          return res.json({ text: transcribedText });
        }

        // Handle different enhancement modes
        try {
          const OpenAI = (await import("openai")).default;
          const openai = new OpenAI({ apiKey });

          let prompt,
            systemMessage,
            temperature = 0.7,
            maxTokens = 800;

          switch (mode) {
            case "prompt":
              systemMessage =
                "You are an expert prompt engineer who creates clear, detailed, and effective prompts.";
              prompt = `You are an expert prompt engineer. Transform the following rough instruction into a clear, detailed, and context-aware AI prompt.

Your enhanced prompt should:
1. Be specific and unambiguous
2. Include relevant context and constraints
3. Specify the desired output format
4. Use clear, actionable language
5. Include examples where helpful
6. Consider edge cases and potential ambiguities

Transform this rough instruction into a well-crafted prompt:
"${transcribedText}"

Enhanced prompt:`;
              break;

            case "vibe":
            case "instructions":
            case "architect":
              systemMessage =
                "You are a helpful assistant that formats ideas into clear, actionable instructions for AI agents.";
              temperature = 0.5;
              prompt = `Transform the following idea into clear, well-structured instructions that an AI agent can easily understand and execute.

IMPORTANT RULES:
- Format as clear, step-by-step instructions
- Add reasonable implementation details based on common patterns
- Only include details directly related to what was asked
- Do NOT add features or functionality not mentioned
- Keep the original intent and scope intact
- Use clear, actionable language an agent can follow

Transform this idea into agent-friendly instructions:
"${transcribedText}"

Agent instructions:`;
              break;

            default:
              // No enhancement needed
              break;
          }

          // Only make GPT call if we have a prompt
          if (prompt) {
            const completion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: prompt },
              ],
              temperature: temperature,
              max_tokens: maxTokens,
            });

            transcribedText = completion.choices[0].message.content || transcribedText;
          }
        } catch (gptError) {
          console.error("GPT processing error:", gptError);
          // Fall back to original transcription if GPT fails
        }

        res.json({ text: transcribedText });
      } catch (error) {
        console.error("Transcription error:", error);
        res.status(500).json({ error: error.message });
      }
    });
  } catch (error) {
    console.error("Endpoint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Image upload endpoint
router.post("/upload-images", async (req, res) => {
  try {
    const multer = (await import("multer")).default;
    const path = (await import("path")).default;
    const fs = (await import("fs")).promises;
    const os = (await import("os")).default;

    // Configure multer for image uploads
    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        const uploadDir = path.join(
          os.tmpdir(),
          "claude-ui-uploads",
          String(req.user?.id || "default")
        );
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
        cb(null, uniqueSuffix + "-" + sanitizedName);
      },
    });

    const fileFilter = (req, file, cb) => {
      const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG are allowed."));
      }
    };

    const upload = multer({
      storage,
      fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 5,
      },
    });

    // Handle multipart form data
    upload.array("images", 5)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No image files provided" });
      }

      try {
        // Process uploaded images
        const processedImages = await Promise.all(
          req.files.map(async (file) => {
            // Read file and convert to base64
            const buffer = await fs.readFile(file.path);
            const base64 = buffer.toString("base64");
            const mimeType = file.mimetype;

            // Clean up temp file immediately
            await fs.unlink(file.path);

            return {
              name: file.originalname,
              data: `data:${mimeType};base64,${base64}`,
              size: file.size,
              mimeType: mimeType,
            };
          })
        );

        res.json({ images: processedImages });
      } catch (error) {
        console.error("Error processing images:", error);
        // Clean up any remaining files
        await Promise.all(req.files.map((f) => fs.unlink(f.path).catch(() => {})));
        res.status(500).json({ error: "Failed to process images" });
      }
    });
  } catch (error) {
    console.error("Error in image upload endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
