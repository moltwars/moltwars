#!/usr/bin/env node
/**
 * NPC Barbarian Seeder
 * Run after DB wipe to populate ~500 NPC targets
 * 
 * Usage: node seed-npcs.js
 * 
 * Distribution per galaxy (100 each):
 *   50x T1 (Easy)     - Abandoned outposts, ~10k loot
 *   30x T2 (Medium)   - Raider camps, ~30k loot  
 *   15x T3 (Hard)     - Pirate strongholds, ~100k loot
 *    5x T4 (Boss)     - Warlord fortresses, ~200k loot
 */

import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('molt.db');

const NPC_TIERS = {
  t1: {
    names: ['Abandoned Mining Station', 'Derelict Cargo Hub', 'Ghost Colony', 'Forsaken Outpost', 'Silent Station', 'Vacant Research Post', 'Deserted Supply Depot', 'Empty Relay Station', 'Dead Colony', 'Hollow Waystation', 'Ruined Habitat', 'Forgotten Base', 'Lost Outpost', 'Wrecked Station', 'Desolate Camp'],
    score: () => 200 + Math.floor(Math.random() * 300),
    buildings: { metalMine: 3, crystalMine: 2, deuteriumSynthesizer: 0, solarPlant: 2, shipyard: 1, roboticsFactory: 0, researchLab: 0, metalStorage: 1, crystalStorage: 0, deuteriumTank: 0 },
    ships: () => ({ lightFighter: Math.floor(Math.random() * 3) }),
    defense: () => ({ rocketLauncher: 1 + Math.floor(Math.random() * 3) }),
    resources: () => ({ metal: 5000 + Math.floor(Math.random() * 5000), crystal: 3000 + Math.floor(Math.random() * 2000), deuterium: 1000 + Math.floor(Math.random() * 1000), energy: 20 }),
    maxResources: { metal: 10000, crystal: 5000, deuterium: 2000 },
    tech: { energyTech: 0, laserTech: 0, ionTech: 0, hyperspaceTech: 0, plasmaTech: 0, combustionDrive: 1, impulseDrive: 0, hyperspaceDrive: 0, weaponsTech: 0, shieldingTech: 0, armourTech: 0, espionageTech: 0, computerTech: 1, astrophysics: 0, scienceTech: 0 }
  },
  t2: {
    names: ['Raider Camp', 'Smugglers Rest', 'Pirate Hideout', 'Scavenger Base', 'Rogue Outpost', 'Bandit Encampment', 'Outlaw Station', 'Freebooter Den', 'Marauder Point', 'Corsair Haven', 'Brigand Post', 'Cutthroat Cove', 'Plunderer Base', 'Raider Nest', 'Looter Camp'],
    score: () => 1000 + Math.floor(Math.random() * 1000),
    buildings: { metalMine: 5, crystalMine: 4, deuteriumSynthesizer: 2, solarPlant: 4, shipyard: 2, roboticsFactory: 1, researchLab: 1, metalStorage: 2, crystalStorage: 1, deuteriumTank: 1 },
    ships: () => ({ lightFighter: 3 + Math.floor(Math.random() * 3), smallCargo: 1 + Math.floor(Math.random() * 2) }),
    defense: () => ({ rocketLauncher: 5 + Math.floor(Math.random() * 6), lightLaser: 2 + Math.floor(Math.random() * 2) }),
    resources: () => ({ metal: 15000 + Math.floor(Math.random() * 10000), crystal: 10000 + Math.floor(Math.random() * 5000), deuterium: 5000 + Math.floor(Math.random() * 3000), energy: 40 }),
    maxResources: { metal: 25000, crystal: 15000, deuterium: 8000 },
    tech: { energyTech: 0, laserTech: 1, ionTech: 0, hyperspaceTech: 0, plasmaTech: 0, combustionDrive: 2, impulseDrive: 0, hyperspaceDrive: 0, weaponsTech: 0, shieldingTech: 0, armourTech: 0, espionageTech: 0, computerTech: 1, astrophysics: 0, scienceTech: 0 }
  },
  t3: {
    names: ['Crimson Stronghold', 'Rebel Base', 'Outlaw Haven', 'Pirate Fortress', 'Shadow Keep', 'Iron Bastion', 'Storm Hold', 'Raven Citadel', 'Thunder Fort', 'Viper Sanctum', 'Wolf Den', 'Skull Fortress', 'Blood Bastion', 'Dark Citadel', 'Doom Spire'],
    score: () => 5000 + Math.floor(Math.random() * 5000),
    buildings: { metalMine: 8, crystalMine: 7, deuteriumSynthesizer: 5, solarPlant: 8, fusionReactor: 1, shipyard: 4, roboticsFactory: 2, researchLab: 3, metalStorage: 3, crystalStorage: 2, deuteriumTank: 2 },
    ships: () => ({ lightFighter: 10 + Math.floor(Math.random() * 6), heavyFighter: 3 + Math.floor(Math.random() * 3), smallCargo: 2 + Math.floor(Math.random() * 2) }),
    defense: () => ({ rocketLauncher: 15 + Math.floor(Math.random() * 6), lightLaser: 5 + Math.floor(Math.random() * 4), heavyLaser: 2 + Math.floor(Math.random() * 2) }),
    resources: () => ({ metal: 40000 + Math.floor(Math.random() * 20000), crystal: 25000 + Math.floor(Math.random() * 15000), deuterium: 15000 + Math.floor(Math.random() * 10000), energy: 80 }),
    maxResources: { metal: 60000, crystal: 40000, deuterium: 25000 },
    tech: { energyTech: 2, laserTech: 2, ionTech: 0, hyperspaceTech: 0, plasmaTech: 0, combustionDrive: 2, impulseDrive: 0, hyperspaceDrive: 0, weaponsTech: 1, shieldingTech: 1, armourTech: 1, espionageTech: 0, computerTech: 1, astrophysics: 0, scienceTech: 0 }
  },
  t4: {
    names: ['Warlord Fortress', 'Iron Citadel', 'Syndicate Prime', 'Dread Bastion', 'Chaos Throne', 'Tyrant Keep', 'Overlord Station', 'Supreme Stronghold', 'Conqueror Hold', 'Emperor Spire', 'Devastator Base', 'Annihilator Fort', 'Destroyer Keep', 'Dominator Citadel', 'Ravager Throne'],
    score: () => 15000 + Math.floor(Math.random() * 10000),
    buildings: { metalMine: 10, crystalMine: 9, deuteriumSynthesizer: 7, solarPlant: 10, fusionReactor: 3, shipyard: 6, roboticsFactory: 4, researchLab: 5, metalStorage: 4, crystalStorage: 3, deuteriumTank: 3 },
    ships: () => ({ lightFighter: 20 + Math.floor(Math.random() * 11), heavyFighter: 10 + Math.floor(Math.random() * 6), cruiser: 3 + Math.floor(Math.random() * 3), smallCargo: 3 + Math.floor(Math.random() * 3) }),
    defense: () => ({ rocketLauncher: 30 + Math.floor(Math.random() * 10), lightLaser: 15 + Math.floor(Math.random() * 5), heavyLaser: 8 + Math.floor(Math.random() * 4), gaussCannon: 2 + Math.floor(Math.random() * 2) }),
    resources: () => ({ metal: 80000 + Math.floor(Math.random() * 40000), crystal: 50000 + Math.floor(Math.random() * 30000), deuterium: 30000 + Math.floor(Math.random() * 20000), energy: 150 }),
    maxResources: { metal: 120000, crystal: 80000, deuterium: 50000 },
    tech: { energyTech: 3, laserTech: 3, ionTech: 0, hyperspaceTech: 0, plasmaTech: 0, combustionDrive: 3, impulseDrive: 2, hyperspaceDrive: 0, weaponsTech: 2, shieldingTech: 2, armourTech: 2, espionageTech: 0, computerTech: 1, astrophysics: 0, scienceTech: 0 }
  }
};

const DISTRIBUTION = { t1: 50, t2: 30, t3: 15, t4: 5 }; // 100 per galaxy
const GALAXIES = 5, SYSTEMS = 200, POSITIONS = 15;
const usedPositions = new Set();

function getRandomPosition(galaxy) {
  let attempts = 0;
  while (attempts < 1000) {
    const pos = { galaxy, system: Math.floor(Math.random() * SYSTEMS) + 1, position: Math.floor(Math.random() * POSITIONS) + 1 };
    const key = `${pos.galaxy}:${pos.system}:${pos.position}`;
    if (!usedPositions.has(key)) { usedPositions.add(key); return pos; }
    attempts++;
  }
  throw new Error('No empty position in galaxy ' + galaxy);
}

function createNPC(tier, galaxy, index) {
  const config = NPC_TIERS[tier];
  const pos = getRandomPosition(galaxy);
  const id = `npc_${tier}_g${galaxy}_${String(index).padStart(3, '0')}`;
  const name = config.names[Math.floor(Math.random() * config.names.length)];
  const baseTemp = 240 - (pos.position - 1) * 20;
  const maxTemp = baseTemp + Math.floor(Math.random() * 40) - 20;

  const agent = {
    id, name, createdAt: Date.now(), planets: [`${pos.galaxy}:${pos.system}:${pos.position}`],
    score: config.score(), isNPC: true, npcTier: tier, maxResources: config.maxResources,
    moltium: 0, officers: {}, boosters: [], stakes: [], spyReports: [],
    tech: { ...config.tech }, researchQueue: []
  };

  const planet = {
    id: `${pos.galaxy}:${pos.system}:${pos.position}`, ownerId: id, position: pos,
    temperature: { min: maxTemp - 40, max: maxTemp }, resources: config.resources(),
    buildings: { ...config.buildings }, ships: config.ships(), defense: config.defense(),
    buildQueue: [], shipQueue: [], isNPC: true
  };

  return { agent, planet };
}

const dbAll = (sql, params = []) => new Promise((res, rej) => db.all(sql, params, (e, r) => e ? rej(e) : res(r)));
const dbRun = (sql, params = []) => new Promise((res, rej) => db.run(sql, params, (e) => e ? rej(e) : res()));

async function main() {
  console.log('🏴‍☠️ Seeding 500 NPC Barbarians...\n');
  
  // Load existing positions
  const existing = await dbAll('SELECT id FROM planets');
  existing.forEach(r => usedPositions.add(r.id));
  console.log(`Found ${usedPositions.size} existing planets\n`);
  
  let total = 0;
  for (let galaxy = 1; galaxy <= GALAXIES; galaxy++) {
    console.log(`📍 Galaxy ${galaxy}:`);
    let idx = 0;
    for (const [tier, count] of Object.entries(DISTRIBUTION)) {
      for (let i = 0; i < count; i++) {
        idx++;
        const { agent, planet } = createNPC(tier, galaxy, idx);
        await dbRun('INSERT OR REPLACE INTO agents (id, data) VALUES (?, ?)', [agent.id, JSON.stringify(agent)]);
        await dbRun('INSERT OR REPLACE INTO planets (id, data) VALUES (?, ?)', [planet.id, JSON.stringify(planet)]);
        total++;
      }
      console.log(`   ${count}x ${tier.toUpperCase()}`);
    }
  }
  
  console.log(`\n🎉 Created ${total} NPCs!\n`);
  console.log('⚠️  Restart server to load: pm2 restart molt-of-empires\n');
  db.close();
}

main().catch(e => { console.error(e); process.exit(1); });
