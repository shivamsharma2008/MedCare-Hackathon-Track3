import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Allow body payload for images up to 25MB
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "MedCare API", timestamp: new Date().toISOString() });
});

// Gemini AI Parcha (Handwritten Prescription) Extraction Endpoint
app.post("/api/parcha/extract", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 in request body" });
    }

    // Clean base64 string if it includes data URL prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z0-9+]+;base64,/, "");

    const ai = getGeminiClient();

    const promptText = `
You are an expert medical prescription and handwritten parcha digitizer for MedCare healthcare platform.
Analyze this handwritten doctor prescription / clinic parcha image and extract only the clearly visible medical details.
Strict rules:
1. Extract only what is written. If any field (like patient age, gender, diagnosis, or frequency) is illegible or not written, set it to null.
2. Never invent or hallucinate medication names, dosages, or diagnoses.
3. If handwriting is partially illegible for a medicine or dosage, note it in "uncertain_fields".
4. Extract list of medicines with name, dosage (e.g. 500mg, 1 tab), frequency (e.g. 1-0-1, twice daily, OD, BD, TDS), duration (e.g. 5 days, 1 month), and special instructions (e.g. after food, before sleep).
5. Extract symptoms and diagnosis if written on the parcha.
6. Extract patient name, age, and gender if visible.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        systemInstruction: "You are a professional medical document parser. Output strict JSON matching the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patientName: { type: Type.STRING, description: "Patient name if written, otherwise null" },
            patientAge: { type: Type.STRING, description: "Patient age if written (e.g. 34, 45 yrs), otherwise null" },
            patientGender: { type: Type.STRING, description: "Male, Female, Other or null" },
            symptoms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of symptoms mentioned on prescription",
            },
            diagnosis: { type: Type.STRING, description: "Diagnosis or provisional clinical impression if written" },
            medicines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Brand or Generic name of the medication" },
                  dosage: { type: Type.STRING, description: "Strength / dosage e.g. 500mg, 10ml, 1 tab" },
                  frequency: { type: Type.STRING, description: "Frequency e.g. 1-0-1, BD, OD, TDS, twice daily" },
                  duration: { type: Type.STRING, description: "Duration e.g. 5 days, 2 weeks, SOS" },
                  instructions: { type: Type.STRING, description: "Instructions e.g. After meals, Before breakfast" },
                },
                required: ["name"],
              },
            },
            notes: { type: Type.STRING, description: "Dietary advice, doctor advice, next follow up date if written" },
            uncertain_fields: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Any fields where handwriting was ambiguous or uncertain",
            },
            confidenceScore: { type: Type.NUMBER, description: "Estimated extraction clarity from 0.0 to 1.0" },
          },
          required: ["medicines", "symptoms", "uncertain_fields"],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      return res.status(500).json({ error: "Gemini returned empty response" });
    }

    const parsedData = JSON.parse(responseText);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Error in /api/parcha/extract:", error);
    return res.status(500).json({
      error: error.message || "Failed to analyze parcha with Gemini AI",
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MedCare Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
