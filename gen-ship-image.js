import fetch from "node-fetch";
import fs from "fs";

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error('GOOGLE_API_KEY environment variable is required');
  process.exit(1);
}

const prompt = process.argv[2];
const outputPath = process.argv[3] || "output.png";

if (!prompt) {
  console.log("Usage: node gen-ship-image.js \"prompt\" output.png");
  process.exit(1);
}

async function main() {
  console.log("🎨 Generating image with Imagen 4.0...");
  console.log("Prompt:", prompt.substring(0, 100) + "...");
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { 
          aspectRatio: "16:9",
          sampleCount: 1
        }
      })
    }
  );
  
  const data = await response.json();
  
  if (data.error) {
    console.log("❌ Error:", data.error.message);
    process.exit(1);
  }
  
  const b64 = data.predictions?.[0]?.bytesBase64Encoded;
  if (b64) {
    fs.writeFileSync(outputPath, Buffer.from(b64, "base64"));
    console.log("✅ Saved:", outputPath);
  } else {
    console.log("❌ No image in response");
    console.log(JSON.stringify(data, null, 2));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
