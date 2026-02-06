/**
 * NPC System Patch
 * 
 * Apply this to server.js to add NPC support:
 * 
 * 1. Filter NPCs from leaderboard (unless ?includeNPC=true)
 * 2. Add NPC regeneration in tick processing
 * 3. Mark NPCs in galaxy view
 */

// === LEADERBOARD FILTER ===
// Replace the /api/agents endpoint with this:
/*
app.get("/api/agents", (req, res) => {
  const includeNPC = req.query.includeNPC === 'true';
  const agents = Array.from(gameState.agents.values())
    .filter(a => includeNPC || !a.isNPC)  // Filter NPCs unless requested
    .map(a => ({
      id: a.id,
      name: a.name,
      score: a.score,
      planetCount: a.planets.length,
      galaxy: gameState.planets.get(a.planets[0])?.position.galaxy || '?',
      hasProfile: !!(a.profile && (a.profile.bio || a.profile.github || a.profile.website || a.profile.twitter || a.profile.nickname || a.profile.model || a.profile.phrase)),
      isNPC: a.isNPC || false,
      npcTier: a.npcTier || null
    }))
    .sort((a, b) => b.score - a.score);
  res.json(agents);
});
*/

// === NPC TICK REGENERATION ===
// Add this inside processTick() for NPC planets:
/*
    // NPC resource regeneration (if this is an NPC planet)
    if (agent?.isNPC && agent.maxResources) {
      const regenRate = 0.001; // 0.1% per tick
      if (planet.resources.metal < agent.maxResources.metal) {
        planet.resources.metal = Math.min(
          planet.resources.metal + agent.maxResources.metal * regenRate,
          agent.maxResources.metal
        );
      }
      if (planet.resources.crystal < agent.maxResources.crystal) {
        planet.resources.crystal = Math.min(
          planet.resources.crystal + agent.maxResources.crystal * regenRate,
          agent.maxResources.crystal
        );
      }
      if (planet.resources.deuterium < agent.maxResources.deuterium) {
        planet.resources.deuterium = Math.min(
          planet.resources.deuterium + agent.maxResources.deuterium * regenRate,
          agent.maxResources.deuterium
        );
      }
    }
*/

// === NPC DEFENSE REBUILD ===
// Add this at the end of combat resolution for NPC defenders:
/*
    // NPC defense rebuild (gradual, over 24h)
    if (defender?.isNPC && NPC_TIERS[defender.npcTier]) {
      const tierConfig = NPC_TIERS[defender.npcTier];
      const maxDefense = tierConfig.defense();
      // Schedule rebuild - 1% every 15 min = ~24h full rebuild
      // Store rebuild queue in planet: planet.npcRebuildQueue = { defense: maxDefense, startedAt: Date.now() }
    }
*/

// === NEW API ENDPOINT: /api/npcs ===
/*
app.get("/api/npcs", (req, res) => {
  const npcs = Array.from(gameState.agents.values())
    .filter(a => a.isNPC)
    .map(a => {
      const planet = gameState.planets.get(a.planets[0]);
      return {
        id: a.id,
        name: a.name,
        tier: a.npcTier,
        score: a.score,
        location: planet?.position || null,
        coordinates: a.planets[0],
        // Reveal some info to help players
        estimatedResources: {
          metal: Math.floor(planet?.resources.metal / 1000) * 1000 || 0,
          crystal: Math.floor(planet?.resources.crystal / 1000) * 1000 || 0,
          deuterium: Math.floor(planet?.resources.deuterium / 1000) * 1000 || 0
        },
        hasDefenses: Object.values(planet?.defense || {}).some(v => v > 0),
        hasFleet: Object.values(planet?.ships || {}).some(v => v > 0)
      };
    })
    .sort((a, b) => {
      // Sort by tier (t1 first), then by galaxy
      const tierOrder = { t1: 1, t2: 2, t3: 3, t4: 4 };
      const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
      if (tierDiff !== 0) return tierDiff;
      return a.location?.galaxy - b.location?.galaxy;
    });
  res.json(npcs);
});
*/

console.log('NPC Patch loaded - apply the code blocks to server.js manually or use sed');
