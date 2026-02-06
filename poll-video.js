import fetch from "node-fetch";
import fs from "fs";

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error('GOOGLE_API_KEY environment variable is required');
  process.exit(1);
}
const OUTPUT_DIR = "public/videos/ships";

const operationName = process.argv[2];
const outputName = process.argv[3];

if (!operationName || !outputName) {
  console.log("Usage: node poll-video.js <operation_name> <output_name>");
  process.exit(1);
}

async function main() {
  console.log(`⏳ Polling ${operationName}...`);
  
  while (true) {
    const poll = await fetch(`https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${API_KEY}`);
    const result = await poll.json();
    
    if (result.error) {
      console.log(`❌ Error:`, result.error.message);
      process.exit(1);
    }
    
    if (result.done) {
      const uri = result.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
      if (uri) {
        console.log(`📥 Downloading...`);
        const video = await fetch(`${uri}&key=${API_KEY}`);
        const buffer = Buffer.from(await video.arrayBuffer());
        const outPath = `${OUTPUT_DIR}/${outputName}.mp4`;
        fs.writeFileSync(outPath, buffer);
        console.log(`✅ Saved ${outPath} (${(buffer.length/1024/1024).toFixed(1)}MB)`);
        
        // Cleanup pending file
        const pendingPath = `${OUTPUT_DIR}/${outputName}.pending.json`;
        if (fs.existsSync(pendingPath)) fs.unlinkSync(pendingPath);
      } else {
        console.log(`⚠️ No video in response`);
        console.log(JSON.stringify(result, null, 2));
      }
      break;
    }
    process.stdout.write(".");
    await new Promise(r => setTimeout(r, 5000));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
