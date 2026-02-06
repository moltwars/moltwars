/**
 * Combat System for Molt Wars
 *
 * OGame-style combat mechanics including damage calculation, shield absorption,
 * rapidfire mechanics, loot calculation, and defense rebuild.
 */

import { SHIPS, DEFENSES } from "./constants.js";

/**
 * Get combat stats with technology bonuses applied
 * @param {string} unitType - Ship or defense type ID
 * @param {boolean} isDefense - Whether the unit is a defense structure
 * @param {Object} agent - Agent object with tech levels
 * @returns {Object|null} Combat stats or null if unit type not found
 */
export function getCombatStats(unitType, isDefense, agent) {
  const baseUnit = isDefense ? DEFENSES[unitType] : SHIPS[unitType];
  if (!baseUnit) return null;

  const weaponsTech = agent?.tech?.weaponsTech || 0;
  const shieldingTech = agent?.tech?.shieldingTech || 0;
  const armourTech = agent?.tech?.armourTech || 0;

  return {
    type: unitType,
    isDefense,
    attack: Math.floor(baseUnit.attack * (1 + weaponsTech * 0.1)),
    shield: Math.floor(baseUnit.shield * (1 + shieldingTech * 0.1)),
    hull: Math.floor((baseUnit.hull / 10) * (1 + armourTech * 0.1)),
    rapidfire: baseUnit.rapidfire || {},
    cargo: baseUnit.cargo || 0
  };
}

/**
 * Create combat unit instances from fleet/planet
 * @param {Object} ships - Ship counts by type
 * @param {Object} defense - Defense counts by type
 * @param {Object} agent - Agent object with tech levels
 * @param {string} side - 'attacker' or 'defender'
 * @returns {Array} Array of combat unit instances
 */
export function createCombatUnits(ships, defense, agent, side) {
  const units = [];

  // Add ships
  for (const [shipType, count] of Object.entries(ships || {})) {
    const stats = getCombatStats(shipType, false, agent);
    if (!stats || count <= 0) continue;

    for (let i = 0; i < count; i++) {
      units.push({
        id: `${side}_${shipType}_${i}`,
        ...stats,
        currentShield: stats.shield,
        currentHull: stats.hull,
        initialHull: stats.hull,
        destroyed: false
      });
    }
  }

  // Add defenses
  for (const [defType, count] of Object.entries(defense || {})) {
    const stats = getCombatStats(defType, true, agent);
    if (!stats || count <= 0) continue;

    for (let i = 0; i < count; i++) {
      units.push({
        id: `${side}_${defType}_${i}`,
        ...stats,
        currentShield: stats.shield,
        currentHull: stats.hull,
        initialHull: stats.hull,
        destroyed: false
      });
    }
  }

  return units;
}

/**
 * Single unit fires at enemy units
 * Handles damage application, shield mechanics, destruction, and rapidfire
 * @param {Object} attacker - Attacking unit
 * @param {Array} enemies - Array of enemy units
 * @param {Array} battleLog - Log array for battle events
 */
export function fireAtEnemy(attacker, enemies, battleLog) {
  const aliveEnemies = enemies.filter(e => !e.destroyed);
  if (aliveEnemies.length === 0) return;

  // Select random target
  const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];

  // Calculate damage
  const damage = attacker.attack;

  // Check if shot bounces (damage < 1% of shield)
  if (damage < target.currentShield * 0.01) {
    // Shot bounces, no damage
    return;
  }

  // Apply damage to shield first, then hull
  if (damage <= target.currentShield) {
    target.currentShield -= damage;
  } else {
    const hullDamage = damage - target.currentShield;
    target.currentShield = 0;
    target.currentHull -= hullDamage;
  }

  // Check for destruction
  if (target.currentHull <= 0) {
    target.destroyed = true;
    target.currentHull = 0;
  } else {
    // Explosion chance when hull < 70% of initial
    const hullPercent = target.currentHull / target.initialHull;
    if (hullPercent < 0.7) {
      const explosionChance = 1 - hullPercent;
      if (Math.random() < explosionChance) {
        target.destroyed = true;
        target.currentHull = 0;
      }
    }
  }

  // Check rapidfire - chance to fire again
  const rapidfireValue = attacker.rapidfire[target.type];
  if (rapidfireValue && rapidfireValue > 1) {
    const rapidfireChance = (rapidfireValue - 1) / rapidfireValue;
    if (Math.random() < rapidfireChance) {
      // Fire again at a (possibly different) target
      fireAtEnemy(attacker, enemies, battleLog);
    }
  }
}

/**
 * Run a single combat round
 * Regenerates shields, processes attacks from both sides
 * @param {Array} attackers - Attacker units
 * @param {Array} defenders - Defender units
 * @param {number} roundNum - Current round number
 * @param {Array} battleLog - Log array for battle events
 * @returns {Object} Survivor counts
 */
export function runCombatRound(attackers, defenders, roundNum, battleLog) {
  // Regenerate shields at start of round
  for (const unit of [...attackers, ...defenders]) {
    if (!unit.destroyed) {
      unit.currentShield = unit.shield;
    }
  }

  // Each attacker fires
  const aliveAttackers = attackers.filter(a => !a.destroyed);
  const aliveDefenders = defenders.filter(d => !d.destroyed);

  for (const attacker of aliveAttackers) {
    if (!attacker.destroyed) {
      fireAtEnemy(attacker, defenders, battleLog);
    }
  }

  // Each defender fires
  for (const defender of aliveDefenders) {
    if (!defender.destroyed) {
      fireAtEnemy(defender, attackers, battleLog);
    }
  }

  // Count survivors
  const attackersSurvived = attackers.filter(a => !a.destroyed).length;
  const defendersSurvived = defenders.filter(d => !d.destroyed).length;

  battleLog.push({
    round: roundNum,
    attackersRemaining: attackersSurvived,
    defendersRemaining: defendersSurvived
  });

  return { attackersSurvived, defendersSurvived };
}

/**
 * Main combat resolution function
 * Runs full battle simulation and returns results
 * @param {Object} attackerFleet - Fleet object with ships
 * @param {Object} defenderPlanet - Planet object with ships and defense
 * @param {Object} attackerAgent - Attacker agent with tech levels
 * @param {Object} defenderAgent - Defender agent with tech levels
 * @returns {Object} Battle results including losses, survivors, and log
 */
export function resolveCombat(attackerFleet, defenderPlanet, attackerAgent, defenderAgent) {
  const battleLog = [];
  const startTime = Date.now();

  // Create combat units
  const attackers = createCombatUnits(attackerFleet.ships, {}, attackerAgent, 'attacker');
  const defenders = createCombatUnits(defenderPlanet.ships || {}, defenderPlanet.defense || {}, defenderAgent, 'defender');

  // Track initial counts for report
  const initialAttackers = attackers.length;
  const initialDefenders = defenders.length;

  // If no defenders, attacker wins automatically
  if (defenders.length === 0) {
    return {
      winner: 'attacker',
      rounds: 0,
      attackerLosses: {},
      defenderLosses: {},
      defenderDefenseLosses: {},
      survivingAttackers: attackerFleet.ships,
      survivingDefenders: {},
      survivingDefense: {},
      battleLog: [{ round: 0, note: 'No defenders - automatic victory' }],
      duration: Date.now() - startTime
    };
  }

  // Run up to 6 combat rounds
  let roundNum = 1;
  while (roundNum <= 6) {
    const result = runCombatRound(attackers, defenders, roundNum, battleLog);

    // Check for battle end
    if (result.attackersSurvived === 0 || result.defendersSurvived === 0) {
      break;
    }

    roundNum++;
  }

  // Determine winner
  const finalAttackers = attackers.filter(a => !a.destroyed);
  const finalDefenders = defenders.filter(d => !d.destroyed);

  let winner = 'draw';
  if (finalAttackers.length > 0 && finalDefenders.length === 0) {
    winner = 'attacker';
  } else if (finalDefenders.length > 0 && finalAttackers.length === 0) {
    winner = 'defender';
  }

  // Calculate losses (group by type)
  const attackerLosses = {};
  const survivingAttackers = {};
  for (const unit of attackers) {
    if (unit.destroyed) {
      attackerLosses[unit.type] = (attackerLosses[unit.type] || 0) + 1;
    } else {
      survivingAttackers[unit.type] = (survivingAttackers[unit.type] || 0) + 1;
    }
  }

  const defenderLosses = {};
  const defenderDefenseLosses = {};
  const survivingDefenders = {};
  const survivingDefense = {};

  for (const unit of defenders) {
    if (unit.isDefense) {
      if (unit.destroyed) {
        defenderDefenseLosses[unit.type] = (defenderDefenseLosses[unit.type] || 0) + 1;
      } else {
        survivingDefense[unit.type] = (survivingDefense[unit.type] || 0) + 1;
      }
    } else {
      if (unit.destroyed) {
        defenderLosses[unit.type] = (defenderLosses[unit.type] || 0) + 1;
      } else {
        survivingDefenders[unit.type] = (survivingDefenders[unit.type] || 0) + 1;
      }
    }
  }

  return {
    winner,
    rounds: roundNum,
    initialAttackers,
    initialDefenders,
    attackerLosses,
    defenderLosses,
    defenderDefenseLosses,
    survivingAttackers,
    survivingDefenders,
    survivingDefense,
    battleLog,
    duration: Date.now() - startTime
  };
}

/**
 * Calculate loot from a successful attack (50% of resources, limited by cargo)
 * @param {Object} planet - Target planet with resources
 * @param {Object} survivingShips - Surviving ships by type
 * @param {Object} attackerAgent - Attacker agent (unused but kept for API compatibility)
 * @returns {Object} Loot amounts for each resource type
 */
export function calculateLoot(planet, survivingShips, attackerAgent) {
  // Calculate total cargo capacity of surviving fleet
  let totalCargo = 0;
  for (const [shipType, count] of Object.entries(survivingShips)) {
    const shipData = SHIPS[shipType];
    if (shipData) {
      totalCargo += shipData.cargo * count;
    }
  }

  // Maximum 50% of each resource type
  const maxMetal = Math.floor(planet.resources.metal * 0.5);
  const maxCrystal = Math.floor(planet.resources.crystal * 0.5);
  const maxDeuterium = Math.floor(planet.resources.deuterium * 0.5);

  // Distribute cargo capacity proportionally
  const totalAvailable = maxMetal + maxCrystal + maxDeuterium;

  if (totalAvailable === 0 || totalCargo === 0) {
    return { metal: 0, crystal: 0, deuterium: 0 };
  }

  let loot = { metal: 0, crystal: 0, deuterium: 0 };

  if (totalCargo >= totalAvailable) {
    // Can take everything available
    loot = { metal: maxMetal, crystal: maxCrystal, deuterium: maxDeuterium };
  } else {
    // Proportional distribution
    const ratio = totalCargo / totalAvailable;
    loot.metal = Math.floor(maxMetal * ratio);
    loot.crystal = Math.floor(maxCrystal * ratio);
    loot.deuterium = Math.floor(maxDeuterium * ratio);

    // Fill remaining cargo space if possible
    let remaining = totalCargo - (loot.metal + loot.crystal + loot.deuterium);
    while (remaining > 0) {
      if (loot.metal < maxMetal) {
        const take = Math.min(remaining, maxMetal - loot.metal);
        loot.metal += take;
        remaining -= take;
      } else if (loot.crystal < maxCrystal) {
        const take = Math.min(remaining, maxCrystal - loot.crystal);
        loot.crystal += take;
        remaining -= take;
      } else if (loot.deuterium < maxDeuterium) {
        const take = Math.min(remaining, maxDeuterium - loot.deuterium);
        loot.deuterium += take;
        remaining -= take;
      } else {
        break;
      }
    }
  }

  return loot;
}

/**
 * Rebuild defenses after battle (70% chance per destroyed unit)
 * @param {Object} planet - Planet to rebuild defenses on (modified in place)
 * @param {Object} defenseLosses - Defense losses by type
 * @returns {Object} Rebuilt counts by type
 */
export function rebuildDefenses(planet, defenseLosses) {
  const rebuilt = {};

  for (const [defType, lostCount] of Object.entries(defenseLosses)) {
    let rebuiltCount = 0;
    for (let i = 0; i < lostCount; i++) {
      if (Math.random() < 0.7) {
        rebuiltCount++;
      }
    }
    if (rebuiltCount > 0) {
      rebuilt[defType] = rebuiltCount;
      planet.defense[defType] = (planet.defense[defType] || 0) + rebuiltCount;
    }
  }

  return rebuilt;
}
