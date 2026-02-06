import fetch from "node-fetch";
import fs from "fs";

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error('GOOGLE_API_KEY environment variable is required');
  process.exit(1);
}
const OUTPUT_DIR = "public/videos/ships";

const imagePath = process.argv[2];
const outputName = process.argv[3];
const motionPrompt = process.argv[4] || "Slow cinematic drift through space, subtle engine glow pulsing, stars moving in background";

if (!imagePath || !outputName) {
  console.log("Usage: node gen-ship-video.js <image_path> <output_name> [motion_prompt]");
  process.exit(1);
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString("base64");
  
  console.log(`🎬 Generating video for ${outputName}...`);
  console.log(`Motion: ${motionPrompt}`);
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{
          prompt: motionPrompt,
          image: { 
            bytesBase64Encoded: base64Image,
            mimeType: "image/png"
          }
        }],
        parameters: { aspectRatio: "16:9", durationSeconds: 5 }
      })
    }
  );
  
  const data = await response.json();
  if (data.error) {
    console.log(`❌ Error:`, data.error.message);
    process.exit(1);
  }
  
  console.log(`⏳ Operation started: ${data.name}`);
  console.log(`Poll with: node poll-video.js "${data.name}" "${outputName}"`);
  
  fs.writeFileSync(`${OUTPUT_DIR}/${outputName}.pending.json`, JSON.stringify({
    operation: data.name,
    outputName,
    startedAt: new Date().toISOString()
  }, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
