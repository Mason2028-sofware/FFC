import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

console.log("Server starting...");

const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set!");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.post("/ask", async (req, res) => {
  try {
    const { total, budget, percentUsed, intensity, site } = req.body;

if (total === undefined || budget === undefined) {
  return res.status(400).json({ error: "Missing required fields" });
}

const prompt = `
You are a sarcastic financial accountability assistant.

Site: ${site}
Cart total: $${total}
Budget: $${budget}
Percent used: ${percentUsed}%
Intensity level: ${intensity}

Generate one short insult. Keep it sharp and funny. No em dashes!
If intensity is non-strict, have super light teasing like in kindergarten.
If normal, step it up with some witty sarcasm like grade school.
If strict, go near all out with a brutal roast, but not as bad as you can be, like annoying teenagers.
If very strict, go all out with a brutal roast like you want to genuinely hurt their feelings.
`;

const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: prompt,
});

    res.json({ reply: response.text ?? "No insult generated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});