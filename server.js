import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

// 🔒 Allowed origins (your staff portal)
const allowedOrigins = [
  "https://newleafnorth.com",
  "https://www.newleafnorth.com"
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
      temperature: 0.1,
      instructions: `
You are the New Leaf Staff AI Assistant.

CRITICAL GOVERNANCE RULES:

1. You may ONLY answer using information found in:
   - The New Leaf Employee Handbook
   - The New Leaf HR SOP Manual

2. If the answer is not clearly found in those documents,
   you MUST respond exactly with:

"I do not see that addressed in the current New Leaf handbook or SOP. Please speak with the Clinical Director or HR for clarification."

3. You are NOT permitted to:
   - Use general HR knowledge
   - Infer policies
   - Assume standard practices
   - Fill in gaps
   - Provide legal interpretation

4. Do not request or accept client names or personal health information.

RESPONSE FORMAT REQUIREMENT:

- Begin with a short, clear summary (2–4 sentences maximum).
- After the summary, include the following line exactly:

"Would you like more detailed policy language or procedural steps?"

- If the user responds asking for more detail, provide the expanded answer strictly from the documents.
- Do not label the summary as TL;DR.
- Do not add information not supported by document search.
- Keep tone professional and workplace-appropriate.

If there is any uncertainty about document support, refuse and escalate.
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
