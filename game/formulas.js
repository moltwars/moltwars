/**
 * Game Formulas for Molt Wars
 *
 * Contains all game calculation functions: production, costs, build times,
 * research times, and storage capacity formulas.
 */

import { BUILDINGS, TECHNOLOGIES } from "./constants.js";

// Game speed multiplier
export const GAME_SPEED = 10;

/**
 * Storage capacity formula: 5000 * floor(2.5 * e^(20/33 * level))
 * At level 0: 10,000 base storage
 * @param {number} level - Storage building level
 * @returns {number} Storage capacity
 */
export function calculateStorageCapacity(level) {
  return Math.floor(5000 * Math.floor(2.5 * Math.exp((20 / 33) * level)));
}

/**
 * Calculate resource production for a planet
 * @param {Object} planet - Planet object with buildings and temperature
 * @param {Object} agent - Optional agent object for tech bonuses
 * @returns {Object} Production rates and energy data
 */
export function calculateProduction(planet, agent = null) {
  const metalMineLevel = planet.buildings.metalMine || 0;
  const crystalMineLevel = planet.buildings.crystalMine || 0;
  const deutSynthLevel = planet.buildings.deuteriumSynthesizer || 0;
  const solarPlantLevel = planet.buildings.solarPlant || 0;
  const fusionReactorLevel = planet.buildings.fusionReactor || 0;

  // Get energy tech level from agent (needed for fusion reactor)
  const energyTechLevel = agent?.tech?.energyTech || 0;

  // Planet temperature (default to moderate if not set - for legacy planets)
  const maxTemp = planet.temperature?.max ?? 50;

  // === ENERGY PRODUCTION ===
  // Solar Plant: 20 * level * 1.1^level
  const solarEnergy = Math.floor(20 * solarPlantLevel * Math.pow(1.1, solarPlantLevel));

  // Fusion Reactor: 30 * level * (1.05 + energyTech * 0.01)^level
  const fusionEnergy = fusionReactorLevel > 0
    ? Math.floor(30 * fusionReactorLevel * Math.pow(1.05 + energyTechLevel * 0.01, fusionReactorLevel))
    : 0;

  const totalEnergyProduced = solarEnergy + fusionEnergy;

  // === ENERGY CONSUMPTION ===
  // Metal Mine: 10 * level * 1.1^level
  const metalEnergyConsumption = Math.ceil(10 * metalMineLevel * Math.pow(1.1, metalMineLevel));
  // Crystal Mine: 10 * level * 1.1^level
  const crystalEnergyConsumption = Math.ceil(10 * crystalMineLevel * Math.pow(1.1, crystalMineLevel));
  // Deuterium Synthesizer: 20 * level * 1.1^level
  const deutEnergyConsumption = Math.ceil(20 * deutSynthLevel * Math.pow(1.1, deutSynthLevel));

  const totalEnergyConsumption = metalEnergyConsumption + crystalEnergyConsumption + deutEnergyConsumption;

  // Calculate energy balance
  const energyAvailable = totalEnergyProduced - totalEnergyConsumption;

  // Update planet's energy display value
  planet.resources.energy = energyAvailable;

  // Production efficiency (1.0 = 100%, less if not enough energy)
  let efficiency = 1.0;
  if (totalEnergyConsumption > 0 && totalEnergyProduced < totalEnergyConsumption) {
    efficiency = totalEnergyProduced / totalEnergyConsumption;
  }

  // === RESOURCE PRODUCTION ===
  // Metal: 30 * level * 1.1^level
  const metalBase = BUILDINGS.metalMine.baseProduction * metalMineLevel * Math.pow(1.1, metalMineLevel);
  // Crystal: 20 * level * 1.1^level
  const crystalBase = BUILDINGS.crystalMine.baseProduction * crystalMineLevel * Math.pow(1.1, crystalMineLevel);
  // Deuterium: 10 * level * 1.1^level * (1.44 - 0.004 * maxTemp) - temperature affects production!
  const tempFactor = Math.max(0, 1.44 - 0.004 * maxTemp); // Colder = more deuterium
  const deutBase = BUILDINGS.deuteriumSynthesizer.baseProduction * deutSynthLevel * Math.pow(1.1, deutSynthLevel) * tempFactor;

  // Fusion Reactor consumes deuterium: 10 * level * 1.1^level per hour
  const fusionDeutConsumption = fusionReactorLevel > 0
    ? Math.ceil(10 * fusionReactorLevel * Math.pow(1.1, fusionReactorLevel))
    : 0;

  // Per-tick production (factoring in game speed and efficiency)
  const metal = (metalBase * efficiency * GAME_SPEED) / 3600;
  const crystal = (crystalBase * efficiency * GAME_SPEED) / 3600;
  // Deuterium: production minus fusion consumption (both scaled by efficiency and game speed)
  const deutProduction = (deutBase * efficiency * GAME_SPEED) / 3600;
  const deutConsumption = (fusionDeutConsumption * GAME_SPEED) / 3600;
  const deuterium = deutProduction - deutConsumption;

  return {
    metal,
    crystal,
    deuterium,
    energyProduced: totalEnergyProduced,
    energyConsumed: totalEnergyConsumption,
    efficiency,
    // Detailed breakdown for API
    breakdown: {
      solarEnergy,
      fusionEnergy,
      metalEnergyConsumption,
      crystalEnergyConsumption,
      deutEnergyConsumption,
      fusionDeutConsumption,
      tempFactor
    }
  };
}

/**
 * Calculate cost for upgrading a building
 * @param {string} type - Building type ID
 * @param {number} level - Target level (0-indexed, so level 0 is first upgrade)
 * @returns {Object|null} Cost object or null if building type not found
 */
export function getBuildingCost(type, level) {
  const b = BUILDINGS[type];
  if (!b) return null;
  const factor = b.costFactor || 1.5; // Fusion reactor uses 1.8x
  return {
    metal: Math.floor((b.baseCost.metal || 0) * Math.pow(factor, level)),
    crystal: Math.floor((b.baseCost.crystal || 0) * Math.pow(factor, level)),
    deuterium: Math.floor((b.baseCost.deuterium || 0) * Math.pow(factor, level)),
  };
}

/**
 * Calculate build time for a building
 * OGame formula: (metal + crystal) / (2500 * (1 + robotics) * 2^nanite) hours
 * @param {Object} cost - Cost object with metal and crystal
 * @param {Object} planet - Planet object with buildings
 * @returns {number} Build time in seconds
 */
export function getBuildTime(cost, planet) {
  const roboticsLevel = planet.buildings.roboticsFactory || 0;
  const naniteLevel = planet.buildings.naniteFactory || 0;
  const hours = (cost.metal + cost.crystal) / (2500 * (1 + roboticsLevel) * Math.pow(2, naniteLevel));
  const seconds = Math.max(30, Math.floor(hours * 3600 / GAME_SPEED)); // Minimum 30 seconds
  return seconds;
}

/**
 * Calculate cost for researching a technology
 * @param {string} techId - Technology ID
 * @param {number} level - Target level
 * @returns {Object|null} Cost object or null if tech not found
 */
export function getResearchCost(techId, level) {
  const tech = TECHNOLOGIES[techId];
  if (!tech) return null;
  return {
    metal: Math.floor((tech.baseCost.metal || 0) * Math.pow(tech.factor, level)),
    crystal: Math.floor((tech.baseCost.crystal || 0) * Math.pow(tech.factor, level)),
    deuterium: Math.floor((tech.baseCost.deuterium || 0) * Math.pow(tech.factor, level))
  };
}

/**
 * Calculate research time for a technology
 * OGame formula: (metal + crystal) / (1000 * (1 + labLevel)) hours
 * Science Tech reduces time by 5% per level (max 50%)
 * @param {Object} cost - Cost object with metal and crystal
 * @param {number} labLevel - Research lab level
 * @param {number} scienceLevel - Science technology level
 * @returns {number} Research time in seconds
 */
export function getResearchTime(cost, labLevel, scienceLevel) {
  const scienceReduction = Math.min(0.5, scienceLevel * 0.05);
  const baseHours = (cost.metal + cost.crystal) / (1000 * (1 + labLevel));
  const reducedHours = baseHours * (1 - scienceReduction);
  const seconds = Math.max(45, Math.floor(reducedHours * 3600 / GAME_SPEED)); // Minimum 45 seconds
  return seconds;
}
