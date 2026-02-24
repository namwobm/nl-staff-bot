import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Staff password from environment variable
const STAFF_PASSWORD = process.env.STAFF_PASSWORD;

app.post("/chat", async (req, res) => {
  const { message, password } = req.body;

  if (password !== STAFF_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: message,
      instructions: `
        You are the New Leaf Staff AI Assistant.
        Answer using internal policies and procedures.
        Do not request or accept personal health information.
        If unsure, direct staff to leadership.
      `,
    });

    res.json({ reply: response.output_text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.get("/", (req, res) => {
  res.send("New Leaf Staff Bot Running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started"));
