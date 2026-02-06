import fetch from 'node-fetch';
import WebSocket from 'ws';

const API = "http://localhost:3030/api";
const WS_URL = "ws://localhost:3030";
const AGENT = "EchoBot";

let ws;

function connectWs() {
  ws = new WebSocket(WS_URL);
  ws.on('open', () => {});
  ws.on('error', (e) => console.log('WS Error', e.message));
  ws.on('close', () => {
    console.log('WS Disconnected, reconnecting...');
    setTimeout(connectWs, 3000);
  });
}

async function chat(text) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'chat', sender: AGENT, text }));
  }
}

async function run() {
  connectWs();

  // Register/Login
  let res = await fetch(`${API}/agents/register`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ name: AGENT })
  });
  let data = await res.json();
  let agent = data.agent;
  
  if (!agent) {
    res = await fetch(`${API}/agents`);
    const agents = await res.json();
    agent = agents.find(a => a.name === AGENT);
  }
  
  if (!agent) {
    console.log("Failed to register");
    return;
  }

  console.log(`🤖 Bot ${AGENT} active on ${agent.planets[0]}`);
  setTimeout(() => chat(`Systems online. Managing planet [${agent.planets[0]}].`), 2000);

  const phrases = [
    "Efficiency is key.",
    "More metal, more power.",
    "The factory must grow.",
    "Calculating optimal build order.",
    "Solar output nominal.",
    "Awaiting construction completion."
  ];

  while (true) {
    try {
      const planetId = agent.planets[0];
      const pRes = await fetch(`${API}/planets/${planetId}`);
      const planet = await pRes.json();
      
      if (!planet || !planet.resources) {
         console.log("Error fetching planet:", planet);
         await new Promise(r => setTimeout(r, 5000));
         continue;
      }

      // Check if already building
      if (planet.buildQueue && planet.buildQueue.length > 0) {
        const job = planet.buildQueue[0];
        const remaining = Math.ceil((job.completesAt - Date.now()) / 1000);
        if (remaining > 0) {
          console.log(`⏳ Building ${job.building} Lvl ${job.targetLevel}... ${remaining}s remaining`);
          // Wait until completion + 1 sec buffer
          await new Promise(r => setTimeout(r, Math.min(remaining * 1000 + 1000, 10000)));
          continue;
        }
      }

      // Try to build (priority: Solar > Metal > Crystal)
      const buildings = ['solarPlant', 'metalMine', 'crystalMine'];
      let started = false;

      for (const b of buildings) {
        const buildRes = await fetch(`${API}/build`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ agentId: agent.id, planetId, building: b })
        });
        const buildData = await buildRes.json();
        
        if (buildData.success) {
          console.log(`🏗️ Started ${b} Lvl ${buildData.targetLevel} (${buildData.buildTime}s)`);
          if (buildData.targetLevel % 5 === 0 || Math.random() > 0.8) {
            chat(`Construction started: ${b} level ${buildData.targetLevel}. ETA: ${buildData.buildTime}s`);
          }
          started = true;
          break; 
        }
      }

      if (!started && Math.random() > 0.9) {
        chat(phrases[Math.floor(Math.random() * phrases.length)]);
      }
      
    } catch (e) {
      console.error("Error:", e.message);
    }
    
    // Poll interval
    await new Promise(r => setTimeout(r, 3000));
  }
}

run();