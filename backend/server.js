import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// === Summarize route ===
app.post("/summarize", async (req, res) => {
  try {
    const { text, prompt } = req.body;
    const instruction = prompt || "Summarize in short bullet points.";

    const response = await client.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful meeting summarizer." },
        { role: "user", content: `${instruction}\n\nTranscript:\n${text}` }
      ],
      model: "llama3-8b-8192",
    });

    res.json({ summary: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to summarize" });
  }
});

// === Email route ===
app.post("/send-email", async (req, res) => {
  const { email, summary } = req.body;

  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Meeting Summary",
      text: summary,
    });

    res.json({ message: "✅ Email sent successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});