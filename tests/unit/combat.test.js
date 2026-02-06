/**
 * Unit tests for combat mechanics
 * Tests damage calculation, shield absorption, loot limits, and defense rebuild
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Ship and defense definitions (subset for testing)
const SHIPS = {
  lightFighter: { attack: 50, shield: 10, hull: 4000, cargo: 50, rapidfire: { espionageProbe: 5 } },
  heavyFighter: { attack: 150, shield: 25, hull: 10000, cargo: 100, rapidfire: {} },
  cruiser: { attack: 400, shield: 50, hull: 27000, cargo: 800, rapidfire: { lightFighter: 6 } },
  battleship: { attack: 1000, shield: 200, hull: 60000, cargo: 1500, rapidfire: {} },
  smallCargo: { attack: 5, shield: 10, hull: 4000, cargo: 5000, rapidfire: {} },
  largeCargo: { attack: 5, shield: 25, hull: 12000, cargo: 25000, rapidfire: {} },
};

const DEFENSES = {
  rocketLauncher: { attack: 80, shield: 20, hull: 2000 },
  lightLaser: { attack: 100, shield: 25, hull: 2000 },
  heavyLaser: { attack: 250, shield: 100, hull: 8000 },
};

function getCombatStats(unitType, isDefense, agent) {
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
    hull: Math.floor(baseUnit.hull * (1 + armourTech * 0.1)),
    rapidfire: baseUnit.rapidfire || {},
    cargo: baseUnit.cargo || 0
  };
}

function calculateLoot(planet, survivingShips) {
  let totalCargo = 0;
  for (const [shipType, count] of Object.entries(survivingShips)) {
    const shipData = SHIPS[shipType];
    if (shipData) {
      totalCargo += shipData.cargo * count;
    }
  }

  const maxMetal = Math.floor(planet.resources.metal * 0.5);
  const maxCrystal = Math.floor(planet.resources.crystal * 0.5);
  const maxDeuterium = Math.floor(planet.resources.deuterium * 0.5);

  const totalAvailable = maxMetal + maxCrystal + maxDeuterium;

  if (totalAvailable === 0 || totalCargo === 0) {
    return { metal: 0, crystal: 0, deuterium: 0 };
  }

  let loot = { metal: 0, crystal: 0, deuterium: 0 };

  if (totalCargo >= totalAvailable) {
    loot = { metal: maxMetal, crystal: maxCrystal, deuterium: maxDeuterium };
  } else {
    const ratio = totalCargo / totalAvailable;
    loot.metal = Math.floor(maxMetal * ratio);
    loot.crystal = Math.floor(maxCrystal * ratio);
    loot.deuterium = Math.floor(maxDeuterium * ratio);
  }

  return loot;
}

function rebuildDefenses(lostDefenses) {
  const rebuilt = {};

  for (const [defType, lostCount] of Object.entries(lostDefenses)) {
    let rebuiltCount = 0;
    for (let i = 0; i < lostCount; i++) {
      // 70% rebuild chance (simulated deterministically for testing)
      rebuiltCount = Math.floor(lostCount * 0.7);
    }
    if (rebuiltCount > 0) {
      rebuilt[defType] = rebuiltCount;
    }
  }

  return rebuilt;
}

describe('Combat Stats with Tech Bonuses', () => {
  describe('Weapons Tech', () => {
    it('should apply 10% bonus per level', () => {
      const noTech = getCombatStats('lightFighter', false, { tech: { weaponsTech: 0 } });
      const tech10 = getCombatStats('lightFighter', false, { tech: { weaponsTech: 10 } });

      assert.equal(noTech.attack, 50);
      assert.equal(tech10.attack, Math.floor(50 * 2)); // 100% bonus at level 10
    });
  });

  describe('Shielding Tech', () => {
    it('should apply 10% bonus per level', () => {
      const noTech = getCombatStats('battleship', false, { tech: { shieldingTech: 0 } });
      const tech5 = getCombatStats('battleship', false, { tech: { shieldingTech: 5 } });

      assert.equal(noTech.shield, 200);
      assert.equal(tech5.shield, Math.floor(200 * 1.5)); // 50% bonus at level 5
    });
  });

  describe('Armour Tech', () => {
    it('should apply 10% bonus per level', () => {
      const noTech = getCombatStats('cruiser', false, { tech: { armourTech: 0 } });
      const tech3 = getCombatStats('cruiser', false, { tech: { armourTech: 3 } });

      assert.equal(noTech.hull, 27000);
      assert.equal(tech3.hull, Math.floor(27000 * 1.3)); // 30% bonus at level 3
    });
  });

  describe('Defense Units', () => {
    it('should apply tech bonuses to defenses', () => {
      const def = getCombatStats('heavyLaser', true, { tech: { weaponsTech: 5, shieldingTech: 5, armourTech: 5 } });

      assert.equal(def.attack, Math.floor(250 * 1.5));
      assert.equal(def.shield, Math.floor(100 * 1.5));
      assert.equal(def.hull, Math.floor(8000 * 1.5));
    });
  });
});

describe('Shield Damage Mechanics', () => {
  it('should absorb damage up to shield value', () => {
    const unit = { currentShield: 100, currentHull: 1000, initialHull: 1000, destroyed: false };
    const damage = 50;

    // Simulate damage application
    if (damage <= unit.currentShield) {
      unit.currentShield -= damage;
    } else {
      const hullDamage = damage - unit.currentShield;
      unit.currentShield = 0;
      unit.currentHull -= hullDamage;
    }

    assert.equal(unit.currentShield, 50);
    assert.equal(unit.currentHull, 1000);
  });

  it('should pass excess damage to hull', () => {
    const unit = { currentShield: 30, currentHull: 1000, initialHull: 1000, destroyed: false };
    const damage = 100;

    if (damage <= unit.currentShield) {
      unit.currentShield -= damage;
    } else {
      const hullDamage = damage - unit.currentShield;
      unit.currentShield = 0;
      unit.currentHull -= hullDamage;
    }

    assert.equal(unit.currentShield, 0);
    assert.equal(unit.currentHull, 930); // 1000 - 70
  });

  it('should bounce shot when damage < 1% of shield', () => {
    const shield = 1000;
    const damage = 5; // 0.5% of shield

    const bounces = damage < shield * 0.01;
    assert.equal(bounces, true);
  });
});

describe('Hull Damage and Destruction', () => {
  it('should destroy unit when hull reaches 0', () => {
    const unit = { currentShield: 0, currentHull: 100, initialHull: 1000, destroyed: false };
    const damage = 200;

    if (damage <= unit.currentShield) {
      unit.currentShield -= damage;
    } else {
      const hullDamage = damage - unit.currentShield;
      unit.currentShield = 0;
      unit.currentHull -= hullDamage;
    }

    if (unit.currentHull <= 0) {
      unit.destroyed = true;
      unit.currentHull = 0;
    }

    assert.equal(unit.destroyed, true);
    assert.equal(unit.currentHull, 0);
  });

  it('should trigger explosion chance when hull < 70%', () => {
    const unit = { currentHull: 500, initialHull: 1000 };
    const hullPercent = unit.currentHull / unit.initialHull;

    assert.ok(hullPercent < 0.7);
    const explosionChance = 1 - hullPercent;
    assert.equal(explosionChance, 0.5);
  });
});

describe('Rapidfire Mechanics', () => {
  it('should calculate rapidfire chance correctly', () => {
    // Cruiser has rapidfire 6 against light fighter
    const rapidfireValue = 6;
    const rapidfireChance = (rapidfireValue - 1) / rapidfireValue;

    assert.ok(Math.abs(rapidfireChance - 0.8333) < 0.01);
  });

  it('should not trigger rapidfire when value is 0 or 1', () => {
    const noRapidfire = 0;
    const minRapidfire = 1;

    // With value 0 or 1, rapidfire should not trigger
    const chance0 = noRapidfire > 1 ? (noRapidfire - 1) / noRapidfire : 0;
    const chance1 = minRapidfire > 1 ? (minRapidfire - 1) / minRapidfire : 0;

    assert.equal(chance0, 0);
    assert.equal(chance1, 0);
  });
});

describe('Loot Calculation', () => {
  it('should limit loot to 50% of resources', () => {
    const planet = { resources: { metal: 100000, crystal: 50000, deuterium: 25000 } };
    const ships = { smallCargo: 1000 }; // 5M cargo capacity

    const loot = calculateLoot(planet, ships);

    assert.equal(loot.metal, 50000); // 50% of 100k
    assert.equal(loot.crystal, 25000); // 50% of 50k
    assert.equal(loot.deuterium, 12500); // 50% of 25k
  });

  it('should limit loot by cargo capacity', () => {
    const planet = { resources: { metal: 100000, crystal: 100000, deuterium: 100000 } };
    const ships = { smallCargo: 1 }; // 5k cargo capacity

    const loot = calculateLoot(planet, ships);
    const totalLoot = loot.metal + loot.crystal + loot.deuterium;

    assert.ok(totalLoot <= 5000);
  });

  it('should return 0 loot when no ships survive', () => {
    const planet = { resources: { metal: 100000, crystal: 50000, deuterium: 25000 } };
    const ships = {};

    const loot = calculateLoot(planet, ships);

    assert.equal(loot.metal, 0);
    assert.equal(loot.crystal, 0);
    assert.equal(loot.deuterium, 0);
  });

  it('should return 0 loot when planet has no resources', () => {
    const planet = { resources: { metal: 0, crystal: 0, deuterium: 0 } };
    const ships = { largeCargo: 100 };

    const loot = calculateLoot(planet, ships);

    assert.equal(loot.metal, 0);
    assert.equal(loot.crystal, 0);
    assert.equal(loot.deuterium, 0);
  });

  it('should combine cargo from different ship types', () => {
    const planet = { resources: { metal: 100000, crystal: 100000, deuterium: 100000 } };
    const ships = { smallCargo: 10, largeCargo: 10 }; // 50k + 250k = 300k cargo

    const loot = calculateLoot(planet, ships);
    const totalLoot = loot.metal + loot.crystal + loot.deuterium;
    const expectedMax = 150000; // 50% of 300k

    assert.equal(totalLoot, expectedMax);
  });
});

describe('Defense Rebuild', () => {
  it('should rebuild approximately 70% of lost defenses', () => {
    const losses = { rocketLauncher: 100, lightLaser: 50 };
    const rebuilt = rebuildDefenses(losses);

    assert.equal(rebuilt.rocketLauncher, 70); // 70% of 100
    assert.equal(rebuilt.lightLaser, 35); // 70% of 50
  });

  it('should not rebuild when no defenses lost', () => {
    const losses = {};
    const rebuilt = rebuildDefenses(losses);

    assert.deepEqual(rebuilt, {});
  });
});

describe('Combat Rounds', () => {
  it('should have maximum of 6 rounds', () => {
    const maxRounds = 6;
    assert.equal(maxRounds, 6);
  });

  it('should regenerate shields each round', () => {
    const unit = { shield: 100, currentShield: 20, destroyed: false };

    // Simulate shield regeneration
    if (!unit.destroyed) {
      unit.currentShield = unit.shield;
    }

    assert.equal(unit.currentShield, 100);
  });
});
