import fetch from "node-fetch";
import fs from "fs";

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error('GOOGLE_API_KEY environment variable is required');
  process.exit(1);
}
const OUTPUT_DIR = "public/videos/tech";

const TECHS = {
  laser_tech: "Red coherent laser beam cutting through darkness, advanced weapons research lab, beam refracting through crystal prisms, futuristic targeting systems, dramatic lighting, cinematic, 4k",
  ion_tech: "Blue particle stream with electrical arcing, ion cannon charging sequence, plasma discharge effects, futuristic weapons lab with holographic displays, cinematic wide shot, 4k",
  hyperspace_tech: "Purple reality distortion vortex opening, hyperspace tunnel effect with swirling stars, futuristic research station, impossible geometry, alien technology, cinematic, 4k",
  plasma_tech: "Superheated purple-pink plasma blob contained in magnetic field, explosive energy potential, futuristic weapons research, dramatic orange and purple lighting, cinematic, 4k",
  combustion_drive: "Orange flame exhaust from chemical rocket engine, spacecraft thruster test firing, intense heat shimmer, industrial space facility, dramatic lighting, cinematic wide shot, 4k",
  impulse_drive: "Blue-white plasma stream from fusion torch engine, spacecraft propulsion test, brilliant engine glow, space dock facility, dramatic rim lighting, cinematic, 4k",
  weapons_tech: "Multiple weapon systems targeting display, holographic crosshairs and ballistic calculations, red tactical overlays, military command center, dramatic lighting, cinematic, 4k",
  shielding_tech: "Blue-cyan energy shield bubble with hexagonal pattern, shield absorbing impact ripples, defensive technology test, futuristic research facility, dramatic lighting, cinematic, 4k",
  armour_tech: "Layered armor plates with ablative coating being tested, damage absorption visualization, metallic surfaces gleaming, military research facility, dramatic lighting, cinematic, 4k",
  espionage_tech: "Surveillance satellite eye motif, radar dish scanning in shadows, data streams flowing, covert operations center, dark dramatic lighting with red accents, cinematic, 4k",
  computer_tech: "Holographic data streams flowing through circuit patterns, AI core processing, blue digital matrix visualization, advanced computer laboratory, dramatic cyan lighting, cinematic, 4k",
  astrophysics: "Rotating galaxy spiral hologram with colonized planets highlighted, star map with travel routes, cosmic observatory, dramatic purple and blue lighting, cinematic wide shot, 4k",
  science_tech: "Multiple holographic research displays showing molecular structures and equations, scientist silhouette, breakthrough discovery moment, futuristic lab, dramatic blue lighting, cinematic, 4k"
};

const name = process.argv[2];
if (!name) {
  console.log("Usage: node gen-one-video.js <tech_name>");
  console.log("\nRemaining techs:", Object.keys(TECHS).join(", "));
  process.exit(1);
}

if (!TECHS[name]) {
  console.log(`Unknown tech: ${name}`);
  console.log("Available:", Object.keys(TECHS).join(", "));
  process.exit(1);
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`🎬 Generating ${name}...`);
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: TECHS[name] }],
        parameters: { aspectRatio: "9:16", durationSeconds: 5 }
      })
    }
  );
  
  const data = await response.json();
  if (data.error) {
    console.log(`❌ Error:`, data.error.message);
    process.exit(1);
  }
  
  console.log(`⏳ Polling ${data.name}...`);
  
  while (true) {
    const poll = await fetch(`https://generativelanguage.googleapis.com/v1beta/${data.name}?key=${API_KEY}`);
    const result = await poll.json();
    
    if (result.done) {
      const uri = result.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
      if (uri) {
        console.log(`📥 Downloading...`);
        const video = await fetch(`${uri}&key=${API_KEY}`);
        const buffer = Buffer.from(await video.arrayBuffer());
        fs.writeFileSync(`${OUTPUT_DIR}/${name}.mp4`, buffer);
        console.log(`✅ Saved ${OUTPUT_DIR}/${name}.mp4 (${(buffer.length/1024/1024).toFixed(1)}MB)`);
      } else {
        console.log(`⚠️ No video in response`);
      }
      break;
    }
    process.stdout.write(".");
    await new Promise(r => setTimeout(r, 5000));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
