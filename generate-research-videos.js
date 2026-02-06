import fetch from "node-fetch";
import fs from "fs";

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error('GOOGLE_API_KEY environment variable is required');
  process.exit(1);
}
const OUTPUT_DIR = "public/videos/tech";

// Research techs with cinematic prompts matching the Design Bible
const techs = [
  {
    name: "energy_tech",
    prompt: "Glowing plasma containment sphere with swirling blue and cyan energy, futuristic power core technology, dramatic rim lighting, particles floating, sci-fi research facility, cinematic wide shot, 4k"
  },
  {
    name: "laser_tech",
    prompt: "Red coherent laser beam cutting through darkness, advanced weapons research lab, beam refracting through crystal prisms, futuristic targeting systems, dramatic lighting, cinematic, 4k"
  },
  {
    name: "ion_tech",
    prompt: "Blue particle stream with electrical arcing, ion cannon charging sequence, plasma discharge effects, futuristic weapons lab with holographic displays, cinematic wide shot, 4k"
  },
  {
    name: "hyperspace_tech",
    prompt: "Purple reality distortion vortex opening, hyperspace tunnel effect with swirling stars, futuristic research station, impossible geometry, alien technology, cinematic, 4k"
  },
  {
    name: "plasma_tech",
    prompt: "Superheated purple-pink plasma blob contained in magnetic field, explosive energy potential, futuristic weapons research, dramatic orange and purple lighting, cinematic, 4k"
  },
  {
    name: "combustion_drive",
    prompt: "Orange flame exhaust from chemical rocket engine, spacecraft thruster test firing, intense heat shimmer, industrial space facility, dramatic lighting, cinematic wide shot, 4k"
  },
  {
    name: "impulse_drive",
    prompt: "Blue-white plasma stream from fusion torch engine, spacecraft propulsion test, brilliant engine glow, space dock facility, dramatic rim lighting, cinematic, 4k"
  },
  {
    name: "hyperspace_drive",
    prompt: "Purple vortex forming around spacecraft engine, reality warping effect, hyperspace jump preparation, alien technology integration, dramatic violet lighting, cinematic, 4k"
  },
  {
    name: "weapons_tech",
    prompt: "Multiple weapon systems targeting display, holographic crosshairs and ballistic calculations, red tactical overlays, military command center, dramatic lighting, cinematic, 4k"
  },
  {
    name: "shielding_tech",
    prompt: "Blue-cyan energy shield bubble with hexagonal pattern, shield absorbing impact ripples, defensive technology test, futuristic research facility, dramatic lighting, cinematic, 4k"
  },
  {
    name: "armour_tech",
    prompt: "Layered armor plates with ablative coating being tested, damage absorption visualization, metallic surfaces gleaming, military research facility, dramatic lighting, cinematic, 4k"
  },
  {
    name: "espionage_tech",
    prompt: "Surveillance satellite eye motif, radar dish scanning in shadows, data streams flowing, covert operations center, dark dramatic lighting with red accents, cinematic, 4k"
  },
  {
    name: "computer_tech",
    prompt: "Holographic data streams flowing through circuit patterns, AI core processing, blue digital matrix visualization, advanced computer laboratory, dramatic cyan lighting, cinematic, 4k"
  },
  {
    name: "astrophysics",
    prompt: "Rotating galaxy spiral hologram with colonized planets highlighted, star map with travel routes, cosmic observatory, dramatic purple and blue lighting, cinematic wide shot, 4k"
  },
  {
    name: "science_tech",
    prompt: "Multiple holographic research displays showing molecular structures and equations, scientist silhouette, breakthrough discovery moment, futuristic lab, dramatic blue lighting, cinematic, 4k"
  }
];

async function generateVideo(tech) {
  console.log(`🎬 Starting ${tech.name}...`);
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: tech.prompt }],
        parameters: { aspectRatio: "9:16", durationSeconds: 5 }
      })
    }
  );
  
  const data = await response.json();
  
  if (data.error) {
    console.log(`❌ Failed to start ${tech.name}:`, data.error.message);
    return null;
  }
  
  console.log(`⏳ Operation: ${data.name}`);
  return { tech, operationName: data.name };
}

async function pollOperation(operationName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${API_KEY}`;
  
  while (true) {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.done) {
      return data;
    }
    
    process.stdout.write(".");
    await new Promise(r => setTimeout(r, 5000)); // Poll every 5s
  }
}

async function downloadVideo(uri, outputPath) {
  const url = `${uri}&key=${API_KEY}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }
  
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  return buffer.length;
}

async function saveVideo(tech, result) {
  const samples = result.response?.generateVideoResponse?.generatedSamples;
  
  if (samples && samples.length > 0 && samples[0].video?.uri) {
    const uri = samples[0].video.uri;
    const path = `${OUTPUT_DIR}/${tech.name}.mp4`;
    
    console.log(`\n📥 Downloading ${tech.name}...`);
    const size = await downloadVideo(uri, path);
    console.log(`✅ Saved ${path} (${(size/1024/1024).toFixed(1)}MB)`);
    return true;
  }
  
  console.log(`\n⚠️ No video for ${tech.name}:`, JSON.stringify(result).slice(0, 300));
  return false;
}

async function main() {
  // Create output dir
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  console.log(`\n🚀 Generating ${techs.length} research tech videos...\n`);
  
  // Start all jobs (with rate limiting)
  const jobs = [];
  for (const tech of techs) {
    const job = await generateVideo(tech);
    if (job) jobs.push(job);
    await new Promise(r => setTimeout(r, 3000)); // Rate limit 3s between starts
  }
  
  console.log(`\n📊 Started ${jobs.length} jobs, polling...\n`);
  
  // Poll and save each
  let success = 0;
  for (const job of jobs) {
    process.stdout.write(`🔄 ${job.tech.name}`);
    const result = await pollOperation(job.operationName);
    if (await saveVideo(job.tech, result)) success++;
  }
  
  console.log(`\n✨ Done! ${success}/${jobs.length} videos generated`);
}

main().catch(console.error);
