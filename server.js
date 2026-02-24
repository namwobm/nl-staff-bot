import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

// 🔒 Allowed website origins (your staff portal)
const allowedOrigins = [
  "https://newleafnorth.com",
  "https://www.newleafnorth.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS blocked"), false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const STAFF_PASSWORD = process.env.STAFF_PASSWORD;

// Health check
app.get("/", (req, res) => {
  res.send("New Leaf Staff Bot Running");
});

// Chat endpoint
app.post("/chat", async (req, res) => {
  const { message, password } = req.body;

  if (!STAFF_PASSWORD) {
    return res.status(500).json({ error: "Server missing STAFF_PASSWORD" });
  }

  if (password !== STAFF_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: message,
      tools: [
        {
          type: "file_search",
          vector_store_ids: [
            "vs_699d1be108048191984c02f4fb985c56"
          ],
        },
      ],
      instructions: `
You are the New Leaf Staff AI Assistant.

Answer strictly using the New Leaf Employee Handbook and HR SOP manual.

If the information is not found in those documents, say:
"I don’t see that in our current handbook/SOP. Please check with leadership."

Do not request or accept personal health information.
Keep responses clear, practical, and workplace appropriate.
      `.trim(),
    });

    res.json({ reply: response.output_text });
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started on port", PORT));
