/**
 * Unit tests for resource production formulas
 * Tests metal, crystal, deuterium production and energy efficiency
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Replicate production formulas from server.js for testing
const GAME_SPEED = 10;

function calculateProduction(planet, agent = null) {
  const metalMineLevel = planet.buildings.metalMine || 0;
  const crystalMineLevel = planet.buildings.crystalMine || 0;
  const deutSynthLevel = planet.buildings.deuteriumSynthesizer || 0;
  const solarPlantLevel = planet.buildings.solarPlant || 0;
  const fusionReactorLevel = planet.buildings.fusionReactor || 0;

  const energyTechLevel = agent?.tech?.energyTech || 0;
  const maxTemp = planet.temperature?.max ?? 50;

  // Energy production
  const solarEnergy = Math.floor(20 * solarPlantLevel * Math.pow(1.1, solarPlantLevel));
  const fusionEnergy = fusionReactorLevel > 0
    ? Math.floor(30 * fusionReactorLevel * Math.pow(1.05 + energyTechLevel * 0.01, fusionReactorLevel))
    : 0;
  const energyProduced = solarEnergy + fusionEnergy;

  // Energy consumption
  const metalEnergyConsumption = Math.ceil(10 * metalMineLevel * Math.pow(1.1, metalMineLevel));
  const crystalEnergyConsumption = Math.ceil(10 * crystalMineLevel * Math.pow(1.1, crystalMineLevel));
  const deutEnergyConsumption = Math.ceil(20 * deutSynthLevel * Math.pow(1.1, deutSynthLevel));
  const energyConsumed = metalEnergyConsumption + crystalEnergyConsumption + deutEnergyConsumption;

  // Efficiency (capped at 100%)
  const efficiency = energyConsumed > 0
    ? Math.min(1, energyProduced / energyConsumed)
    : 1;

  // Base production (per second at GAME_SPEED)
  const metalBase = 30 * metalMineLevel * Math.pow(1.1, metalMineLevel);
  const crystalBase = 20 * crystalMineLevel * Math.pow(1.1, crystalMineLevel);

  // Deuterium: affected by temperature (colder = better)
  const avgTemp = (planet.temperature?.max + planet.temperature?.min) / 2 || 25;
  const tempFactor = 1.36 - 0.004 * avgTemp;
  const deutBase = 10 * deutSynthLevel * Math.pow(1.1, deutSynthLevel) * tempFactor;

  // Apply efficiency
  const metal = (metalBase * efficiency) / GAME_SPEED;
  const crystal = (crystalBase * efficiency) / GAME_SPEED;
  const deuterium = (deutBase * efficiency) / GAME_SPEED;

  // Fusion reactor fuel consumption
  const fusionConsumption = fusionReactorLevel > 0
    ? Math.floor(10 * fusionReactorLevel * Math.pow(1.1, fusionReactorLevel)) / GAME_SPEED
    : 0;

  return {
    metal,
    crystal,
    deuterium: deuterium - fusionConsumption,
    efficiency,
    energyProduced,
    energyConsumed
  };
}

describe('Production Formulas', () => {
  describe('Metal Mine Production', () => {
    it('should produce 0 at level 0', () => {
      const planet = { buildings: { metalMine: 0, solarPlant: 10 } };
      const result = calculateProduction(planet);
      assert.equal(result.metal, 0);
    });

    it('should produce correctly at level 1', () => {
      const planet = { buildings: { metalMine: 1, solarPlant: 10 } };
      const result = calculateProduction(planet);
      // 30 * 1 * 1.1^1 / 10 = 3.3
      assert.ok(result.metal > 3 && result.metal < 4);
    });

    it('should scale exponentially with level', () => {
      const level5 = calculateProduction({ buildings: { metalMine: 5, solarPlant: 10 } });
      const level10 = calculateProduction({ buildings: { metalMine: 10, solarPlant: 15 } });
      // Level 10 should produce significantly more than level 5
      assert.ok(level10.metal > level5.metal * 2);
    });
  });

  describe('Crystal Mine Production', () => {
    it('should produce 0 at level 0', () => {
      const planet = { buildings: { crystalMine: 0, solarPlant: 10 } };
      const result = calculateProduction(planet);
      assert.equal(result.crystal, 0);
    });

    it('should produce correctly at level 1', () => {
      const planet = { buildings: { crystalMine: 1, solarPlant: 10 } };
      const result = calculateProduction(planet);
      // 20 * 1 * 1.1^1 / 10 = 2.2
      assert.ok(result.crystal > 2 && result.crystal < 3);
    });
  });

  describe('Deuterium Synthesizer Production', () => {
    it('should produce more on colder planets', () => {
      const coldPlanet = { buildings: { deuteriumSynthesizer: 5, solarPlant: 10 }, temperature: { max: -50, min: -80 } };
      const hotPlanet = { buildings: { deuteriumSynthesizer: 5, solarPlant: 10 }, temperature: { max: 100, min: 70 } };

      const coldProd = calculateProduction(coldPlanet);
      const hotProd = calculateProduction(hotPlanet);

      assert.ok(coldProd.deuterium > hotProd.deuterium);
    });
  });

  describe('Energy Efficiency', () => {
    it('should be 100% when energy production exceeds consumption', () => {
      const planet = { buildings: { metalMine: 1, solarPlant: 10 } };
      const result = calculateProduction(planet);
      assert.equal(result.efficiency, 1);
    });

    it('should reduce production when energy is insufficient', () => {
      const planet = { buildings: { metalMine: 20, solarPlant: 1 } }; // High mine, low solar
      const result = calculateProduction(planet);
      assert.ok(result.efficiency < 1);
    });

    it('should cap efficiency at 100%', () => {
      const planet = { buildings: { metalMine: 1, solarPlant: 20 } }; // Way more energy than needed
      const result = calculateProduction(planet);
      assert.equal(result.efficiency, 1);
    });
  });

  describe('Solar Plant Energy', () => {
    it('should produce 0 energy at level 0', () => {
      const planet = { buildings: { solarPlant: 0 } };
      const result = calculateProduction(planet);
      assert.equal(result.energyProduced, 0);
    });

    it('should follow 20 * level * 1.1^level formula', () => {
      const planet = { buildings: { solarPlant: 5 } };
      const result = calculateProduction(planet);
      // 20 * 5 * 1.1^5 = 161.05
      assert.ok(result.energyProduced >= 161 && result.energyProduced <= 162);
    });
  });

  describe('Fusion Reactor', () => {
    it('should not produce energy at level 0', () => {
      const planet = { buildings: { fusionReactor: 0 } };
      const result = calculateProduction(planet);
      assert.equal(result.energyProduced, 0);
    });

    it('should benefit from energy tech', () => {
      const planet = { buildings: { fusionReactor: 5 } };
      const noTech = calculateProduction(planet, { tech: { energyTech: 0 } });
      const withTech = calculateProduction(planet, { tech: { energyTech: 10 } });

      assert.ok(withTech.energyProduced > noTech.energyProduced);
    });
  });
});
