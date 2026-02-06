import fetch from "node-fetch";
import fs from "fs";

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error('GOOGLE_API_KEY environment variable is required');
  process.exit(1);
}

const buildings = [
  {
    name: "deuterium_synthesizer",
    prompt: "Futuristic deuterium synthesizer building on alien planet, heavy water extraction facility with blue glowing pipes and storage tanks, sci-fi industrial architecture, OGame style game art, dramatic lighting, detailed digital painting, 4k"
  },
  {
    name: "fusion_reactor", 
    prompt: "Futuristic fusion reactor power plant on alien planet, massive glowing reactor core with plasma containment rings, sci-fi energy facility, OGame style game art, dramatic orange and blue lighting, detailed digital painting, 4k"
  },
  {
    name: "nanite_factory",
    prompt: "Futuristic nanite factory on alien planet, high-tech molecular assembly facility with green glowing chambers, microscopic robot production, sci-fi architecture, OGame style game art, dramatic lighting, detailed digital painting, 4k"
  }
];

async function generateImage(building) {
  console.log(`Generating ${building.name}...`);
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: building.prompt }],
        parameters: { sampleCount: 1, aspectRatio: "1:1" }
      })
    }
  );
  
  const data = await response.json();
  
  if (data.predictions && data.predictions[0]) {
    const imageData = data.predictions[0].bytesBase64Encoded;
    const buffer = Buffer.from(imageData, "base64");
    fs.writeFileSync(`public/assets/buildings/${building.name}.png`, buffer);
    console.log(`✅ Saved ${building.name}.png`);
  } else {
    console.log(`❌ Failed ${building.name}:`, JSON.stringify(data).slice(0, 200));
  }
}

async function main() {
  for (const b of buildings) {
    await generateImage(b);
    await new Promise(r => setTimeout(r, 2000)); // Rate limit
  }
}

main();
