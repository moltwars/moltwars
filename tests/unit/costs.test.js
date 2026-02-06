/**
 * Unit tests for building, ship, and tech cost calculations
 * Tests exponential scaling and cost factors
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Building definitions (subset for testing)
const BUILDINGS = {
  metalMine: { baseCost: { metal: 60, crystal: 15 } },
  crystalMine: { baseCost: { metal: 48, crystal: 24 } },
  deuteriumSynthesizer: { baseCost: { metal: 225, crystal: 75 } },
  fusionReactor: { baseCost: { metal: 900, crystal: 360, deuterium: 180 }, costFactor: 1.8 },
  metalStorage: { baseCost: { metal: 1000 }, costFactor: 2 },
};

// Technology definitions (subset for testing)
const TECHNOLOGIES = {
  energyTech: { baseCost: { metal: 0, crystal: 800, deuterium: 400 }, factor: 2 },
  laserTech: { baseCost: { metal: 200, crystal: 100 }, factor: 2 },
  weaponsTech: { baseCost: { metal: 800, crystal: 200 }, factor: 2 },
  espionageTech: { baseCost: { metal: 200, crystal: 1000, deuterium: 200 }, factor: 2 },
};

const GAME_SPEED = 10;

function getBuildingCost(type, level) {
  const b = BUILDINGS[type];
  if (!b) return null;
  const factor = b.costFactor || 1.5;
  return {
    metal: Math.floor((b.baseCost.metal || 0) * Math.pow(factor, level)),
    crystal: Math.floor((b.baseCost.crystal || 0) * Math.pow(factor, level)),
    deuterium: Math.floor((b.baseCost.deuterium || 0) * Math.pow(factor, level)),
  };
}

function getBuildTime(cost, planet) {
  const roboticsLevel = planet.buildings.roboticsFactory || 0;
  const naniteLevel = planet.buildings.naniteFactory || 0;
  const hours = (cost.metal + cost.crystal) / (2500 * (1 + roboticsLevel) * Math.pow(2, naniteLevel));
  const seconds = Math.max(30, Math.floor(hours * 3600 / GAME_SPEED));
  return seconds;
}

function getResearchCost(techId, level) {
  const tech = TECHNOLOGIES[techId];
  if (!tech) return null;
  return {
    metal: Math.floor((tech.baseCost.metal || 0) * Math.pow(tech.factor, level)),
    crystal: Math.floor((tech.baseCost.crystal || 0) * Math.pow(tech.factor, level)),
    deuterium: Math.floor((tech.baseCost.deuterium || 0) * Math.pow(tech.factor, level))
  };
}

function getResearchTime(cost, labLevel, scienceLevel) {
  const scienceReduction = Math.min(0.5, scienceLevel * 0.05);
  const baseHours = (cost.metal + cost.crystal) / (1000 * (1 + labLevel));
  const reducedHours = baseHours * (1 - scienceReduction);
  const seconds = Math.max(45, Math.floor(reducedHours * 3600 / GAME_SPEED));
  return seconds;
}

function calculateStorageCapacity(level) {
  return Math.floor(5000 * Math.floor(2.5 * Math.exp((20 / 33) * level)));
}

describe('Building Costs', () => {
  describe('Default cost factor (1.5x)', () => {
    it('should return base cost at level 0', () => {
      const cost = getBuildingCost('metalMine', 0);
      assert.equal(cost.metal, 60);
      assert.equal(cost.crystal, 15);
    });

    it('should multiply by 1.5 at level 1', () => {
      const cost = getBuildingCost('metalMine', 1);
      assert.equal(cost.metal, Math.floor(60 * 1.5));
      assert.equal(cost.crystal, Math.floor(15 * 1.5));
    });

    it('should scale exponentially', () => {
      const cost5 = getBuildingCost('metalMine', 5);
      const cost10 = getBuildingCost('metalMine', 10);
      // 1.5^5 = 7.59, 1.5^10 = 57.67, so level 10 should be ~7.6x level 5
      assert.ok(cost10.metal / cost5.metal > 7);
    });
  });

  describe('Custom cost factor (1.8x)', () => {
    it('should use 1.8x factor for fusion reactor', () => {
      const level0 = getBuildingCost('fusionReactor', 0);
      const level1 = getBuildingCost('fusionReactor', 1);

      assert.equal(level0.metal, 900);
      assert.equal(level1.metal, Math.floor(900 * 1.8));
    });
  });

  describe('2x cost factor', () => {
    it('should use 2x factor for storage buildings', () => {
      const level0 = getBuildingCost('metalStorage', 0);
      const level1 = getBuildingCost('metalStorage', 1);

      assert.equal(level0.metal, 1000);
      assert.equal(level1.metal, 2000);
    });
  });
});

describe('Build Time', () => {
  it('should have minimum of 30 seconds', () => {
    const cost = { metal: 1, crystal: 1 };
    const planet = { buildings: { roboticsFactory: 10, naniteFactory: 5 } };
    const time = getBuildTime(cost, planet);
    assert.equal(time, 30);
  });

  it('should decrease with robotics factory', () => {
    const cost = { metal: 10000, crystal: 5000 };
    const noRobotics = getBuildTime(cost, { buildings: { roboticsFactory: 0 } });
    const withRobotics = getBuildTime(cost, { buildings: { roboticsFactory: 10 } });

    assert.ok(withRobotics < noRobotics);
  });

  it('should halve with each nanite factory level', () => {
    const cost = { metal: 100000, crystal: 50000 };
    const nanite0 = getBuildTime(cost, { buildings: { roboticsFactory: 10 } });
    const nanite1 = getBuildTime(cost, { buildings: { roboticsFactory: 10, naniteFactory: 1 } });

    // Nanite level 1 should roughly halve the time
    assert.ok(nanite1 <= nanite0 / 2 + 1);
  });
});

describe('Research Costs', () => {
  it('should return base cost at level 0', () => {
    const cost = getResearchCost('energyTech', 0);
    assert.equal(cost.crystal, 800);
    assert.equal(cost.deuterium, 400);
  });

  it('should double with each level (factor 2)', () => {
    const level0 = getResearchCost('energyTech', 0);
    const level1 = getResearchCost('energyTech', 1);
    const level2 = getResearchCost('energyTech', 2);

    assert.equal(level1.crystal, level0.crystal * 2);
    assert.equal(level2.crystal, level1.crystal * 2);
  });

  it('should handle all resource types', () => {
    const cost = getResearchCost('espionageTech', 0);
    assert.equal(cost.metal, 200);
    assert.equal(cost.crystal, 1000);
    assert.equal(cost.deuterium, 200);
  });
});

describe('Research Time', () => {
  it('should have minimum of 45 seconds', () => {
    const cost = { metal: 1, crystal: 1 };
    const time = getResearchTime(cost, 20, 10);
    assert.equal(time, 45);
  });

  it('should decrease with lab level', () => {
    const cost = { metal: 10000, crystal: 10000 };
    const lab1 = getResearchTime(cost, 1, 0);
    const lab10 = getResearchTime(cost, 10, 0);

    assert.ok(lab10 < lab1);
  });

  it('should reduce time with science tech (max 50%)', () => {
    const cost = { metal: 50000, crystal: 50000 };
    const noScience = getResearchTime(cost, 10, 0);
    const maxScience = getResearchTime(cost, 10, 10); // 10 * 5% = 50%

    // Should be close to half
    assert.ok(maxScience <= noScience * 0.55);
    assert.ok(maxScience >= noScience * 0.45);
  });

  it('should cap science reduction at 50%', () => {
    const cost = { metal: 50000, crystal: 50000 };
    const science10 = getResearchTime(cost, 10, 10);
    const science20 = getResearchTime(cost, 10, 20);

    // Both should give same time since reduction caps at 50%
    assert.equal(science10, science20);
  });
});

describe('Storage Capacity', () => {
  it('should calculate base capacity at level 0', () => {
    const capacity = calculateStorageCapacity(0);
    // 5000 * floor(2.5 * e^0) = 5000 * floor(2.5 * 1) = 5000 * 2 = 10000
    assert.equal(capacity, 10000);
  });

  it('should increase exponentially', () => {
    const cap1 = calculateStorageCapacity(1);
    const cap5 = calculateStorageCapacity(5);
    const cap10 = calculateStorageCapacity(10);

    assert.ok(cap5 > cap1 * 2);
    assert.ok(cap10 > cap5 * 2);
  });

  it('should follow the formula exactly', () => {
    const cap3 = calculateStorageCapacity(3);
    // 5000 * floor(2.5 * e^(20/33 * 3))
    const expected = Math.floor(5000 * Math.floor(2.5 * Math.exp((20 / 33) * 3)));
    assert.equal(cap3, expected);
  });
});
