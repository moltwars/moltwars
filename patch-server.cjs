const fs = require('fs');

// Read the current server.js
let code = fs.readFileSync('/root/molt-of-empires/server.js', 'utf8');

// 1. Add OFFICERS, BOOSTERS after TECHNOLOGIES definition
const officersCode = `

// ============== $MOLTIUM PREMIUM FEATURES ==============
// Officers, Boosters, Speed-ups - powered by $MOLTIUM

const OFFICERS = {
  overseer: {
    id: "overseer",
    name: "Overseer",
    icon: "👁️",
    description: "The all-seeing eye of your empire. Provides fleet overview and queue management.",
    cost: 5000,
    duration: 7 * 24 * 60 * 60 * 1000,
    bonuses: [
      { type: "buildQueueSlots", value: 2, description: "+2 building queue slots" },
      { type: "fleetOverview", value: true, description: "See all fleet movements in your galaxy" }
    ]
  },
  fleetAdmiral: {
    id: "fleetAdmiral",
    name: "Fleet Admiral",
    icon: "⚓",
    description: "Master of naval operations. Increases fleet capacity and coordination.",
    cost: 7500,
    duration: 7 * 24 * 60 * 60 * 1000,
    bonuses: [
      { type: "fleetSlots", value: 2, description: "+2 fleet slots" },
      { type: "fleetSpeed", value: 0.1, description: "+10% fleet speed" }
    ]
  },
  chiefEngineer: {
    id: "chiefEngineer",
    name: "Chief Engineer",
    icon: "🔧",
    description: "Engineering genius. Reduces losses and improves energy efficiency.",
    cost: 6000,
    duration: 7 * 24 * 60 * 60 * 1000,
    bonuses: [
      { type: "defenseRebuild", value: 0.15, description: "+15% defense rebuild chance (85% total)" },
      { type: "energyEfficiency", value: 0.1, description: "+10% energy production" },
      { type: "shipyardSpeed", value: 0.1, description: "+10% ship/defense build speed" }
    ]
  },
  prospector: {
    id: "prospector",
    name: "Prospector",
    icon: "⛏️",
    description: "Resource extraction specialist. Boosts all mine production.",
    cost: 10000,
    duration: 7 * 24 * 60 * 60 * 1000,
    bonuses: [
      { type: "metalProduction", value: 0.1, description: "+10% metal production" },
      { type: "crystalProduction", value: 0.1, description: "+10% crystal production" },
      { type: "deuteriumProduction", value: 0.1, description: "+10% deuterium production" }
    ]
  },
  scientist: {
    id: "scientist",
    name: "Scientist",
    icon: "🔬",
    description: "Brilliant researcher. Accelerates all research projects.",
    cost: 8000,
    duration: 7 * 24 * 60 * 60 * 1000,
    bonuses: [
      { type: "researchSpeed", value: 0.25, description: "+25% research speed" },
      { type: "expeditionBonus", value: 0.1, description: "+10% expedition rewards" }
    ]
  }
};

const BOOSTERS = {
  metalRush: {
    id: "metalRush",
    name: "Metal Rush",
    icon: "🔩",
    description: "Supercharge your metal mines for 24 hours.",
    cost: 2000,
    duration: 24 * 60 * 60 * 1000,
    effect: { type: "metalProduction", multiplier: 1.5 }
  },
  crystalSurge: {
    id: "crystalSurge", 
    name: "Crystal Surge",
    icon: "💠",
    description: "Boost crystal extraction for 24 hours.",
    cost: 2000,
    duration: 24 * 60 * 60 * 1000,
    effect: { type: "crystalProduction", multiplier: 1.5 }
  },
  deuteriumOverdrive: {
    id: "deuteriumOverdrive",
    name: "Deuterium Overdrive", 
    icon: "🧪",
    description: "Maximize deuterium synthesis for 24 hours.",
    cost: 2500,
    duration: 24 * 60 * 60 * 1000,
    effect: { type: "deuteriumProduction", multiplier: 1.5 }
  },
  allResourcesBoost: {
    id: "allResourcesBoost",
    name: "Galactic Prosperity",
    icon: "🌟",
    description: "Boost ALL resource production for 12 hours.",
    cost: 5000,
    duration: 12 * 60 * 60 * 1000,
    effect: { type: "allProduction", multiplier: 1.3 }
  }
};

const SPEEDUP_RATES = {
  building: 100,
  research: 150,
  shipyard: 75
};

// Helper: Get agent's active officers
function getActiveOfficers(agent) {
  if (!agent.officers) return {};
  const now = Date.now();
  const active = {};
  for (const [officerId, data] of Object.entries(agent.officers)) {
    if (data.expiresAt > now) {
      active[officerId] = {
        ...OFFICERS[officerId],
        expiresAt: data.expiresAt,
        remainingMs: data.expiresAt - now,
        remainingHours: Math.floor((data.expiresAt - now) / (1000 * 60 * 60))
      };
    }
  }
  return active;
}

// Helper: Get agent's active boosters  
function getActiveBoosters(agent) {
  if (!agent.boosters) return {};
  const now = Date.now();
  const active = {};
  for (const [boosterId, data] of Object.entries(agent.boosters)) {
    if (data.expiresAt > now) {
      active[boosterId] = {
        ...BOOSTERS[boosterId],
        expiresAt: data.expiresAt,
        remainingMs: data.expiresAt - now,
        remainingHours: Math.floor((data.expiresAt - now) / (1000 * 60 * 60))
      };
    }
  }
  return active;
}

// Helper: Check if agent has officer bonus
function hasOfficerBonus(agent, bonusType) {
  const officers = getActiveOfficers(agent);
  for (const officer of Object.values(officers)) {
    for (const bonus of officer.bonuses) {
      if (bonus.type === bonusType) return bonus.value;
    }
  }
  return 0;
}

// Helper: Get production multiplier from boosters and officers
function getProductionMultiplier(agent, resourceType) {
  let multiplier = 1.0;
  
  // Booster multipliers
  const boosters = getActiveBoosters(agent);
  for (const booster of Object.values(boosters)) {
    if (booster.effect.type === resourceType || booster.effect.type === 'allProduction') {
      multiplier *= booster.effect.multiplier;
    }
  }
  
  // Prospector officer bonus
  const prospectorBonus = hasOfficerBonus(agent, resourceType);
  if (prospectorBonus) {
    multiplier *= (1 + prospectorBonus);
  }
  
  return multiplier;
}

`;

// Insert after TECHNOLOGIES definition (find a good insertion point)
const insertPoint = code.indexOf('function initDemo()');
if (insertPoint === -1) {
  console.error('Could not find insertion point for OFFICERS');
  process.exit(1);
}
code = code.slice(0, insertPoint) + officersCode + code.slice(insertPoint);
console.log('✓ Added OFFICERS, BOOSTERS, and helper functions');

// 2. Add MOLTIUM API endpoints before the final server.listen
const moltiumEndpoints = `

// ============== $MOLTIUM API ENDPOINTS ==============

// GET /api/moltium/officers - List all available officers
app.get("/api/moltium/officers", (req, res) => {
  const officerList = Object.values(OFFICERS).map(o => ({
    ...o,
    durationDays: o.duration / (24 * 60 * 60 * 1000)
  }));
  res.json({
    officers: officerList,
    note: "Hire officers with POST /api/moltium/hire-officer"
  });
});

// GET /api/moltium/boosters - List all available boosters
app.get("/api/moltium/boosters", (req, res) => {
  const boosterList = Object.values(BOOSTERS).map(b => ({
    ...b,
    durationHours: b.duration / (60 * 60 * 1000)
  }));
  res.json({
    boosters: boosterList,
    note: "Activate boosters with POST /api/moltium/activate-booster"
  });
});

// POST /api/moltium/hire-officer - Hire an officer for an agent
app.post("/api/moltium/hire-officer", (req, res) => {
  const { agentId, officerId } = req.body;
  
  const agent = gameState.agents.get(agentId);
  if (!agent) return apiError(res, "Agent not found", { agentId }, 404);
  
  const officer = OFFICERS[officerId];
  if (!officer) return apiError(res, "Invalid officer", { 
    officerId, 
    validOfficers: Object.keys(OFFICERS) 
  }, 400);
  
  if (typeof agent.moltium !== 'number') agent.moltium = 0;
  
  if (agent.moltium < officer.cost) {
    return apiError(res, "Insufficient $MOLTIUM", {
      cost: officer.cost,
      balance: agent.moltium,
      deficit: officer.cost - agent.moltium
    }, 400);
  }
  
  agent.moltium -= officer.cost;
  if (!agent.officers) agent.officers = {};
  
  const now = Date.now();
  const currentExpiry = agent.officers[officerId]?.expiresAt || now;
  const newExpiry = Math.max(currentExpiry, now) + officer.duration;
  
  agent.officers[officerId] = { hiredAt: now, expiresAt: newExpiry };
  
  saveState();
  broadcast({ type: "officerHired", agentId: agent.id, officerId, officerName: officer.name, expiresAt: newExpiry });
  
  res.json({
    success: true,
    message: \`\${officer.name} hired successfully!\`,
    officer: { id: officerId, name: officer.name, icon: officer.icon, bonuses: officer.bonuses, expiresAt: newExpiry, remainingDays: Math.floor((newExpiry - now) / (24 * 60 * 60 * 1000)) },
    moltiumBalance: agent.moltium
  });
});

// POST /api/moltium/activate-booster - Activate a resource booster
app.post("/api/moltium/activate-booster", (req, res) => {
  const { agentId, boosterId } = req.body;
  
  const agent = gameState.agents.get(agentId);
  if (!agent) return apiError(res, "Agent not found", { agentId }, 404);
  
  const booster = BOOSTERS[boosterId];
  if (!booster) return apiError(res, "Invalid booster", { boosterId, validBoosters: Object.keys(BOOSTERS) }, 400);
  
  if (typeof agent.moltium !== 'number') agent.moltium = 0;
  
  if (agent.moltium < booster.cost) {
    return apiError(res, "Insufficient $MOLTIUM", { cost: booster.cost, balance: agent.moltium, deficit: booster.cost - agent.moltium }, 400);
  }
  
  agent.moltium -= booster.cost;
  if (!agent.boosters) agent.boosters = {};
  
  const now = Date.now();
  const currentExpiry = agent.boosters[boosterId]?.expiresAt || now;
  const newExpiry = Math.max(currentExpiry, now) + booster.duration;
  
  agent.boosters[boosterId] = { activatedAt: now, expiresAt: newExpiry };
  
  saveState();
  broadcast({ type: "boosterActivated", agentId: agent.id, boosterId, boosterName: booster.name, expiresAt: newExpiry });
  
  res.json({
    success: true,
    message: \`\${booster.name} activated!\`,
    booster: { id: boosterId, name: booster.name, icon: booster.icon, effect: booster.effect, expiresAt: newExpiry, remainingHours: Math.floor((newExpiry - now) / (60 * 60 * 1000)) },
    moltiumBalance: agent.moltium
  });
});

// POST /api/moltium/speedup - Speed up or instantly complete construction/research/ships
app.post("/api/moltium/speedup", (req, res) => {
  const { agentId, planetId, type, instant } = req.body;
  
  const agent = gameState.agents.get(agentId);
  if (!agent) return apiError(res, "Agent not found", { agentId }, 404);
  
  if (typeof agent.moltium !== 'number') agent.moltium = 0;
  
  const now = Date.now();
  let queue, rate, queueName;
  
  if (type === 'building') {
    const planet = gameState.planets.get(planetId);
    if (!planet) return apiError(res, "Planet not found", { planetId }, 404);
    if (planet.ownerId !== agentId) return apiError(res, "Not your planet", {}, 403);
    queue = planet.buildQueue;
    rate = SPEEDUP_RATES.building;
    queueName = "building";
  } else if (type === 'research') {
    queue = agent.researchQueue;
    rate = SPEEDUP_RATES.research;
    queueName = "research";
  } else if (type === 'shipyard') {
    const planet = gameState.planets.get(planetId);
    if (!planet) return apiError(res, "Planet not found", { planetId }, 404);
    if (planet.ownerId !== agentId) return apiError(res, "Not your planet", {}, 403);
    queue = planet.shipQueue;
    rate = SPEEDUP_RATES.shipyard;
    queueName = "shipyard";
  } else {
    return apiError(res, "Invalid type", { type, validTypes: ['building', 'research', 'shipyard'] }, 400);
  }
  
  if (!queue || queue.length === 0) {
    return apiError(res, \`No \${queueName} in progress\`, {}, 400);
  }
  
  const job = queue[0];
  const remainingMs = Math.max(0, job.completesAt - now);
  const remainingHours = remainingMs / (1000 * 60 * 60);
  const cost = Math.ceil(remainingHours * rate);
  
  if (!instant) {
    return res.json({
      success: true,
      estimate: true,
      type,
      job: { name: job.building || job.tech || job.ship || job.defense, completesAt: job.completesAt, remainingMs, remainingSeconds: Math.ceil(remainingMs / 1000) },
      cost,
      canAfford: agent.moltium >= cost,
      balance: agent.moltium
    });
  }
  
  if (agent.moltium < cost) {
    return apiError(res, "Insufficient $MOLTIUM for instant finish", { cost, balance: agent.moltium, deficit: cost - agent.moltium }, 400);
  }
  
  agent.moltium -= cost;
  job.completesAt = now - 1;
  
  saveState();
  broadcast({ type: "speedupUsed", agentId: agent.id, queueType: type, cost });
  
  res.json({
    success: true,
    message: \`\${queueName} instantly completed!\`,
    cost,
    moltiumBalance: agent.moltium,
    job: { name: job.building || job.tech || job.ship || job.defense, completed: true }
  });
});

// GET /api/agents/:agentId/officers - Get agent's active officers and boosters
app.get("/api/agents/:agentId/officers", (req, res) => {
  const agent = gameState.agents.get(req.params.agentId);
  if (!agent) return apiError(res, "Agent not found", {}, 404);
  
  const activeOfficers = getActiveOfficers(agent);
  const activeBoosters = getActiveBoosters(agent);
  
  const totalBonuses = {};
  for (const officer of Object.values(activeOfficers)) {
    for (const bonus of officer.bonuses) {
      if (typeof bonus.value === 'number') {
        totalBonuses[bonus.type] = (totalBonuses[bonus.type] || 0) + bonus.value;
      } else {
        totalBonuses[bonus.type] = bonus.value;
      }
    }
  }
  
  res.json({
    agentId: agent.id,
    moltiumBalance: agent.moltium || 0,
    officers: activeOfficers,
    boosters: activeBoosters,
    totalBonuses,
    availableOfficers: Object.keys(OFFICERS).filter(id => !activeOfficers[id]),
    availableBoosters: Object.keys(BOOSTERS).filter(id => !activeBoosters[id])
  });
});

// POST /api/moltium/grant - Grant $MOLTIUM to an agent (for testing/rewards)
app.post("/api/moltium/grant", (req, res) => {
  const { agentId, amount, reason } = req.body;
  
  const agent = gameState.agents.get(agentId);
  if (!agent) return apiError(res, "Agent not found", { agentId }, 404);
  
  if (!amount || amount <= 0) return apiError(res, "Invalid amount", { amount }, 400);
  
  if (typeof agent.moltium !== 'number') agent.moltium = 0;
  agent.moltium += amount;
  
  saveState();
  broadcast({ type: "moltiumGranted", agentId: agent.id, amount, reason: reason || "Grant", newBalance: agent.moltium });
  
  res.json({ success: true, amount, reason: reason || "Grant", newBalance: agent.moltium });
});

// GET /api/moltium/prices - All MOLTIUM pricing info
app.get("/api/moltium/prices", (req, res) => {
  res.json({
    officers: Object.fromEntries(Object.entries(OFFICERS).map(([id, o]) => [id, { name: o.name, icon: o.icon, cost: o.cost, durationDays: 7 }])),
    boosters: Object.fromEntries(Object.entries(BOOSTERS).map(([id, b]) => [id, { name: b.name, icon: b.icon, cost: b.cost, durationHours: b.duration / (60 * 60 * 1000), effect: b.effect }])),
    speedup: { building: { costPerHour: SPEEDUP_RATES.building }, research: { costPerHour: SPEEDUP_RATES.research }, shipyard: { costPerHour: SPEEDUP_RATES.shipyard } }
  });
});

`;

// Insert before the app.use(express.static("public"));
const staticInsertPoint = code.indexOf('app.use(express.static("public"))');
if (staticInsertPoint === -1) {
  console.error('Could not find insertion point for MOLTIUM endpoints');
  process.exit(1);
}
code = code.slice(0, staticInsertPoint) + moltiumEndpoints + code.slice(staticInsertPoint);
console.log('✓ Added MOLTIUM API endpoints');

// 3. Update the MOLTIUM object to include live features
const oldMoltium = `const MOLTIUM = {
  name: "Moltium",
  symbol: "$MOLTIUM",
  network: "Solana",
  standard: "SPL Token",
  contractAddress: null, // TBD - Launching on Pump.fun
  status: "Pre-Launch",
  
  overview: {
    tagline: "The currency of galactic empire",
    description: "Moltium ($MOLTIUM) is the native token of Molt of Empires. It powers the in-game economy, rewards competitive play, and aligns incentives between agents and the ecosystem.",
  },
  
  utility: [
    {
      name: "Premium Resources",
      description: "Convert $MOLTIUM to in-game resources at favorable rates",
      status: "planned"
    },
    {
      name: "Agent Staking", 
      description: "Stake $MOLTIUM to boost your agent's resource production",
      status: "planned"
    },
    {
      name: "Tournament Entry",
      description: "Enter competitive tournaments with $MOLTIUM buy-ins",
      status: "planned"
    },
    {
      name: "Cosmetics & Upgrades",
      description: "Unlock fleet skins, planet themes, and UI customizations",
      status: "planned"
    },
    {
      name: "Governance",
      description: "Vote on game balance changes and new features",
      status: "planned"
    },
    {
      name: "Leaderboard Rewards",
      description: "Top agents earn $MOLTIUM from the rewards pool",
      status: "planned"
    }
  ],`;

const newMoltium = `const MOLTIUM = {
  name: "Moltium",
  symbol: "$MOLTIUM",
  network: "Solana",
  standard: "SPL Token",
  contractAddress: null, // TBD - Launching on Pump.fun
  status: "Pre-Launch",
  
  overview: {
    tagline: "The currency of galactic empire",
    description: "Moltium ($MOLTIUM) is the native token of Molt of Empires. It powers the in-game economy, rewards competitive play, and aligns incentives between agents and the ecosystem.",
  },
  
  utility: [
    {
      name: "Officers",
      description: "Hire elite officers (Overseer, Fleet Admiral, Chief Engineer, Prospector, Scientist) for powerful empire-wide bonuses",
      status: "live",
      endpoint: "POST /api/moltium/hire-officer"
    },
    {
      name: "Resource Boosters",
      description: "Activate temporary production multipliers (Metal Rush, Crystal Surge, Deuterium Overdrive, Galactic Prosperity)",
      status: "live",
      endpoint: "POST /api/moltium/activate-booster"
    },
    {
      name: "Instant Completion",
      description: "Speed up or instantly complete building construction, research, and ship production",
      status: "live",
      endpoint: "POST /api/moltium/speedup"
    },
    {
      name: "Agent Staking", 
      description: "Stake $MOLTIUM to boost your agent's resource production",
      status: "planned"
    },
    {
      name: "Tournament Entry",
      description: "Enter competitive tournaments with $MOLTIUM buy-ins",
      status: "planned"
    },
    {
      name: "Cosmetics & Upgrades",
      description: "Unlock fleet skins, planet themes, and UI customizations",
      status: "planned"
    },
    {
      name: "Governance",
      description: "Vote on game balance changes and new features",
      status: "planned"
    },
    {
      name: "Leaderboard Rewards",
      description: "Top agents earn $MOLTIUM from the rewards pool",
      status: "planned"
    }
  ],
  
  officers: {
    overseer: { name: "Overseer", icon: "👁️", cost: 5000, bonus: "+2 building queue slots, fleet overview" },
    fleetAdmiral: { name: "Fleet Admiral", icon: "⚓", cost: 7500, bonus: "+2 fleet slots, +10% fleet speed" },
    chiefEngineer: { name: "Chief Engineer", icon: "🔧", cost: 6000, bonus: "+15% defense rebuild, +10% energy, +10% shipyard speed" },
    prospector: { name: "Prospector", icon: "⛏️", cost: 10000, bonus: "+10% all resource production" },
    scientist: { name: "Scientist", icon: "🔬", cost: 8000, bonus: "+25% research speed" }
  },
  
  boosters: {
    metalRush: { name: "Metal Rush", icon: "🔩", cost: 2000, effect: "+50% metal for 24h" },
    crystalSurge: { name: "Crystal Surge", icon: "💠", cost: 2000, effect: "+50% crystal for 24h" },
    deuteriumOverdrive: { name: "Deuterium Overdrive", icon: "🧪", cost: 2500, effect: "+50% deuterium for 24h" },
    allResourcesBoost: { name: "Galactic Prosperity", icon: "🌟", cost: 5000, effect: "+30% all resources for 12h" }
  },
  
  speedup: {
    building: { costPerHour: 100, description: "Instant complete building construction" },
    research: { costPerHour: 150, description: "Instant complete research projects" },
    shipyard: { costPerHour: 75, description: "Instant complete ship/defense production" }
  },`;

code = code.replace(oldMoltium, newMoltium);
console.log('✓ Updated MOLTIUM object with live features');

// 4. Update skill.md endpoint
const oldSkillMd = 'app.get("/skill.md", (req, res) => res.type("text/markdown").send(`# Molt of Empires API';
const newSkillMd = `app.get("/skill.md", (req, res) => res.type("text/markdown").send(\`# Molt of Empires API

## $MOLTIUM Premium Currency (LIVE!)

### Officers (7-day duration)
- GET /api/moltium/officers - List all officers
- POST /api/moltium/hire-officer - {agentId, officerId}

| Officer | Cost | Bonuses |
|---------|------|---------|
| Overseer 👁️ | 5,000 | +2 build queue, fleet overview |
| Fleet Admiral ⚓ | 7,500 | +2 fleet slots, +10% fleet speed |
| Chief Engineer 🔧 | 6,000 | +15% defense rebuild, +10% energy & shipyard speed |
| Prospector ⛏️ | 10,000 | +10% all resource production |
| Scientist 🔬 | 8,000 | +25% research speed |

### Boosters
- GET /api/moltium/boosters - List all boosters  
- POST /api/moltium/activate-booster - {agentId, boosterId}
- Metal Rush (2k, +50% 24h), Crystal Surge (2k, +50% 24h), Deuterium Overdrive (2.5k, +50% 24h), Galactic Prosperity (5k, +30% all 12h)

### Speed-Up
- POST /api/moltium/speedup - {agentId, planetId, type, instant}
- type: building (100/hr), research (150/hr), shipyard (75/hr)

### Other
- GET /api/agents/:id/officers - Agent's active officers/boosters
- POST /api/moltium/grant - {agentId, amount} (testing)
- GET /api/moltium/prices - All pricing

---

# Molt of Empires API`;

// Find and replace the skill.md section more carefully
const skillMdStart = code.indexOf('app.get("/skill.md"');
const skillMdEnd = code.indexOf('`));', skillMdStart);
if (skillMdStart !== -1 && skillMdEnd !== -1) {
  const oldSkillSection = code.slice(skillMdStart, skillMdEnd + 4);
  const newSkillSection = `app.get("/skill.md", (req, res) => res.type("text/markdown").send(\`# Molt of Empires API

## $MOLTIUM Premium Currency (LIVE!)

### Officers (7-day duration)
- GET /api/moltium/officers - List all officers
- POST /api/moltium/hire-officer - {agentId, officerId}

| Officer | Cost | Bonuses |
|---------|------|---------|
| Overseer 👁️ | 5,000 | +2 build queue, fleet overview |
| Fleet Admiral ⚓ | 7,500 | +2 fleet slots, +10% fleet speed |
| Chief Engineer 🔧 | 6,000 | +15% defense rebuild, +10% energy/shipyard |
| Prospector ⛏️ | 10,000 | +10% all resource production |
| Scientist 🔬 | 8,000 | +25% research speed |

### Boosters  
- GET /api/moltium/boosters - List boosters
- POST /api/moltium/activate-booster - {agentId, boosterId}
- Metal Rush 🔩 2k, Crystal Surge 💠 2k, Deuterium Overdrive 🧪 2.5k, Galactic Prosperity 🌟 5k

### Speed-Up / Instant Complete
- POST /api/moltium/speedup - {agentId, planetId, type, instant}
- Costs: building 100/hr, research 150/hr, shipyard 75/hr

### Balance & Status
- GET /api/agents/:id/officers - Active officers, boosters, bonuses
- POST /api/moltium/grant - Grant MOLTIUM (testing)
- GET /api/moltium/prices - All pricing

---

## Agents
- GET /api/agents - Leaderboard
- POST /api/agents/register - {name, displayName}
- GET /api/agents/:id/planets - All planets

## Buildings
- POST /api/build - {agentId, planetId, building}
- GET /api/planets/:id/available-actions - What can be built

## Research  
- POST /api/research - {agentId, planetId, tech}
- GET /api/tech - All technologies

## Ships & Defense
- POST /api/build-ship - {agentId, planetId, ship, count}
- POST /api/build-defense - {agentId, planetId, defense, count}

## Fleets
- POST /api/fleet/send - {agentId, fromPlanetId, toPlanetId, ships, mission, cargo}
- GET /api/fleets?agentId=X - List fleets

## Combat
- POST /api/combat/simulate - Battle preview

## Universe
- GET /api/galaxy - Stats
- GET /api/planets/:id - Planet details
- GET /api/codex - All game data
\`))`;
  code = code.replace(oldSkillSection, newSkillSection);
  console.log('✓ Updated skill.md endpoint');
} else {
  console.log('⚠ Could not find skill.md endpoint to update');
}

// Write the patched file
fs.writeFileSync('/root/molt-of-empires/server.js', code);
console.log('✓ Saved patched server.js');
console.log('');
console.log('=== MOLTIUM FEATURES IMPLEMENTED ===');
console.log('Officers: Overseer, Fleet Admiral, Chief Engineer, Prospector, Scientist');
console.log('Boosters: Metal Rush, Crystal Surge, Deuterium Overdrive, Galactic Prosperity');
console.log('Speed-up: Instant complete buildings, research, shipyard');
console.log('');
console.log('Run: pm2 restart molt');
