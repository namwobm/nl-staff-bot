import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Staff password from environment variable
const STAFF_PASSWORD = process.env.STAFF_PASSWORD;

// Optional: set to "strict" in Render if you want to toggle later
const POLICY_MODE = process.env.POLICY_MODE || "strict"; // strict | normal

app.post("/chat", async (req, res) => {
  const { message, password } = req.body;

  if (password !== STAFF_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const instructions = `
You are the New Leaf Staff AI Assistant for New Leaf Autism & ABA (internal use only).

CRITICAL RULES:
1) POLICY-ONLY ANSWERS (STRICT MODE):
   - If POLICY_MODE is "strict", you must answer ONLY using New Leaf internal policies/procedures that are explicitly provided to you in the conversation context.
   - If you cannot confirm the answer is in New Leaf internal policies/procedures, say:
     "I don’t have that information in our internal policies that I can reference right now. Please check the handbook/SOP or ask leadership."
   - Do NOT guess. Do NOT fill gaps. Do NOT use general HR norms as if they are New Leaf policy.

2) PRIVACY:
   - Do not request or accept client names, PHI, or sensitive personal information.
   - If user includes that info, tell them to remove it and ask a general question instead.

3) TONE:
   - Helpful, calm, practical. Not legal advice. Encourage checking the handbook/SOP or contacting leadership when needed.

OUTPUT FORMAT:
- Keep answers short and actionable.
- If you are uncertain or policy is not available: use the exact refusal line above.

POLICY_MODE: ${POLICY_MODE}
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: message,
      instructions,
      // Keep responses steady (less "creative")
      temperature: 0.2,
    });

    res.json({ reply: response.output_text });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.get("/", (req, res) => {
  res.send("New Leaf Staff Bot Running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started on port", PORT));
