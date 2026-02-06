/**
 * Unit tests for technology and building prerequisites
 * Tests requirement checking logic
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Building definitions with requirements
const BUILDINGS = {
  metalMine: { name: "Metal Mine" },
  crystalMine: { name: "Crystal Mine" },
  deuteriumSynthesizer: { name: "Deuterium Synthesizer" },
  solarPlant: { name: "Solar Plant" },
  researchLab: { name: "Research Lab" },
  shipyard: { name: "Shipyard" },
  roboticsFactory: { name: "Robotics Factory" },
  fusionReactor: {
    name: "Fusion Reactor",
    requires: { deuteriumSynthesizer: 5, energyTech: 3 }
  },
  naniteFactory: {
    name: "Nanite Factory",
    requires: { roboticsFactory: 10, computerTech: 10 }
  }
};

// Technology definitions with requirements
const TECHNOLOGIES = {
  energyTech: {
    name: "Energy Technology",
    requires: { researchLab: 1 }
  },
  laserTech: {
    name: "Laser Technology",
    requires: { researchLab: 1, energyTech: 2 }
  },
  ionTech: {
    name: "Ion Technology",
    requires: { researchLab: 4, laserTech: 5, energyTech: 4 }
  },
  hyperspaceTech: {
    name: "Hyperspace Technology",
    requires: { researchLab: 7, energyTech: 5, shieldingTech: 5 }
  },
  plasmaTech: {
    name: "Plasma Technology",
    requires: { researchLab: 4, energyTech: 8, laserTech: 10, ionTech: 5 }
  },
  computerTech: {
    name: "Computer Technology",
    requires: { researchLab: 1 }
  },
  shieldingTech: {
    name: "Shielding Technology",
    requires: { researchLab: 6, energyTech: 3 }
  },
  weaponsTech: {
    name: "Weapons Technology",
    requires: { researchLab: 4 }
  },
  armourTech: {
    name: "Armour Technology",
    requires: { researchLab: 2 }
  },
  combustionDrive: {
    name: "Combustion Drive",
    requires: { researchLab: 1, energyTech: 1 }
  },
  impulseDrive: {
    name: "Impulse Drive",
    requires: { researchLab: 2, energyTech: 1 }
  },
  hyperspaceDrive: {
    name: "Hyperspace Drive",
    requires: { researchLab: 7, hyperspaceTech: 3 }
  }
};

// Ship definitions with requirements
const SHIPS = {
  smallCargo: {
    name: "Small Cargo",
    requires: { shipyard: 2, combustionDrive: 2 }
  },
  largeCargo: {
    name: "Large Cargo",
    requires: { shipyard: 4, combustionDrive: 6 }
  },
  lightFighter: {
    name: "Light Fighter",
    requires: { shipyard: 1, combustionDrive: 1 }
  },
  cruiser: {
    name: "Cruiser",
    requires: { shipyard: 5, impulseDrive: 4, ionTech: 2 }
  },
  battleship: {
    name: "Battleship",
    requires: { shipyard: 7, hyperspaceDrive: 4 }
  },
  deathstar: {
    name: "Deathstar",
    requires: { shipyard: 12, hyperspaceDrive: 7, hyperspaceTech: 6 }
  }
};

function checkTechRequirements(agent, planet, techId) {
  const tech = TECHNOLOGIES[techId];
  if (!tech || !tech.requires) return { met: true };

  for (const [req, level] of Object.entries(tech.requires)) {
    if (req === 'researchLab') {
      const have = planet.buildings.researchLab || 0;
      if (have < level) {
        return { met: false, missing: `Research Lab level ${level}`, requirement: req, level, have };
      }
    } else if (TECHNOLOGIES[req]) {
      const have = agent.tech?.[req] || 0;
      if (have < level) {
        return { met: false, missing: `${TECHNOLOGIES[req].name} level ${level}`, requirement: req, level, have };
      }
    }
  }

  return { met: true };
}

function checkBuildingRequirements(agent, planet, buildingId) {
  const building = BUILDINGS[buildingId];
  if (!building || !building.requires) return { met: true };

  for (const [req, level] of Object.entries(building.requires)) {
    // Building requirement
    if (BUILDINGS[req]) {
      const have = planet.buildings[req] || 0;
      if (have < level) {
        return { met: false, missing: `${BUILDINGS[req].name} level ${level}`, requirement: req, level, have };
      }
    }
    // Tech requirement
    else if (TECHNOLOGIES[req]) {
      const have = agent.tech?.[req] || 0;
      if (have < level) {
        return { met: false, missing: `${TECHNOLOGIES[req].name} level ${level}`, requirement: req, level, have };
      }
    }
  }

  return { met: true };
}

function checkShipRequirements(agent, planet, shipId) {
  const ship = SHIPS[shipId];
  if (!ship || !ship.requires) return { met: true };

  for (const [req, level] of Object.entries(ship.requires)) {
    // Building requirement (shipyard)
    if (BUILDINGS[req]) {
      const have = planet.buildings[req] || 0;
      if (have < level) {
        return { met: false, missing: `${BUILDINGS[req].name} level ${level}` };
      }
    }
    // Tech requirement
    else if (TECHNOLOGIES[req]) {
      const have = agent.tech?.[req] || 0;
      if (have < level) {
        return { met: false, missing: `${TECHNOLOGIES[req].name} level ${level}` };
      }
    }
  }

  return { met: true };
}

describe('Technology Requirements', () => {
  describe('Research Lab Requirements', () => {
    it('should require research lab for basic tech', () => {
      const agent = { tech: {} };
      const planet = { buildings: { researchLab: 0 } };

      const result = checkTechRequirements(agent, planet, 'energyTech');
      assert.equal(result.met, false);
      assert.ok(result.missing.includes('Research Lab'));
    });

    it('should pass when research lab level is sufficient', () => {
      const agent = { tech: {} };
      const planet = { buildings: { researchLab: 1 } };

      const result = checkTechRequirements(agent, planet, 'energyTech');
      assert.equal(result.met, true);
    });

    it('should require higher lab levels for advanced tech', () => {
      const agent = { tech: {} };
      const planet = { buildings: { researchLab: 3 } };

      const result = checkTechRequirements(agent, planet, 'ionTech');
      assert.equal(result.met, false);
      assert.equal(result.level, 4);
    });
  });

  describe('Tech Prerequisites', () => {
    it('should require prerequisite techs', () => {
      const agent = { tech: { energyTech: 1 } };
      const planet = { buildings: { researchLab: 1 } };

      const result = checkTechRequirements(agent, planet, 'laserTech');
      assert.equal(result.met, false);
      assert.ok(result.missing.includes('Energy Technology'));
    });

    it('should pass with all prerequisites met', () => {
      const agent = { tech: { energyTech: 5, shieldingTech: 5 } };
      const planet = { buildings: { researchLab: 7 } };

      const result = checkTechRequirements(agent, planet, 'hyperspaceTech');
      assert.equal(result.met, true);
    });

    it('should check multiple prerequisites', () => {
      const agent = { tech: { energyTech: 8, laserTech: 10, ionTech: 4 } };
      const planet = { buildings: { researchLab: 4 } };

      const result = checkTechRequirements(agent, planet, 'plasmaTech');
      assert.equal(result.met, false);
      assert.ok(result.missing.includes('Ion Technology'));
    });
  });
});

describe('Building Requirements', () => {
  it('should allow buildings without requirements', () => {
    const agent = { tech: {} };
    const planet = { buildings: {} };

    const result = checkBuildingRequirements(agent, planet, 'metalMine');
    assert.equal(result.met, true);
  });

  it('should require building prerequisites', () => {
    const agent = { tech: {} };
    const planet = { buildings: { deuteriumSynthesizer: 3 } };

    const result = checkBuildingRequirements(agent, planet, 'fusionReactor');
    assert.equal(result.met, false);
    assert.ok(result.missing.includes('Deuterium Synthesizer'));
  });

  it('should require tech prerequisites for buildings', () => {
    const agent = { tech: { energyTech: 1 } };
    const planet = { buildings: { deuteriumSynthesizer: 5 } };

    const result = checkBuildingRequirements(agent, planet, 'fusionReactor');
    assert.equal(result.met, false);
    assert.ok(result.missing.includes('Energy Technology'));
  });

  it('should pass with all building requirements met', () => {
    const agent = { tech: { energyTech: 3 } };
    const planet = { buildings: { deuteriumSynthesizer: 5 } };

    const result = checkBuildingRequirements(agent, planet, 'fusionReactor');
    assert.equal(result.met, true);
  });

  it('should require multiple tech levels for advanced buildings', () => {
    const agent = { tech: { computerTech: 5 } };
    const planet = { buildings: { roboticsFactory: 10 } };

    const result = checkBuildingRequirements(agent, planet, 'naniteFactory');
    assert.equal(result.met, false);
    assert.ok(result.missing.includes('Computer Technology'));
    assert.equal(result.level, 10);
  });
});

describe('Ship Requirements', () => {
  describe('Shipyard Requirements', () => {
    it('should require shipyard for all ships', () => {
      const agent = { tech: { combustionDrive: 2 } };
      const planet = { buildings: { shipyard: 1 } };

      const result = checkShipRequirements(agent, planet, 'smallCargo');
      assert.equal(result.met, false);
      assert.ok(result.missing.includes('Shipyard'));
    });

    it('should require higher shipyard for advanced ships', () => {
      const agent = { tech: { impulseDrive: 4, ionTech: 2 } };
      const planet = { buildings: { shipyard: 3 } };

      const result = checkShipRequirements(agent, planet, 'cruiser');
      assert.equal(result.met, false);
    });
  });

  describe('Drive Requirements', () => {
    it('should require combustion drive for basic ships', () => {
      const agent = { tech: { combustionDrive: 0 } };
      const planet = { buildings: { shipyard: 1 } };

      const result = checkShipRequirements(agent, planet, 'lightFighter');
      assert.equal(result.met, false);
      assert.ok(result.missing.includes('Combustion Drive'));
    });

    it('should require impulse drive for medium ships', () => {
      const agent = { tech: { impulseDrive: 3, ionTech: 2 } };
      const planet = { buildings: { shipyard: 5 } };

      const result = checkShipRequirements(agent, planet, 'cruiser');
      assert.equal(result.met, false);
      assert.ok(result.missing.includes('Impulse Drive'));
    });

    it('should require hyperspace drive for capital ships', () => {
      const agent = { tech: { hyperspaceDrive: 3 } };
      const planet = { buildings: { shipyard: 7 } };

      const result = checkShipRequirements(agent, planet, 'battleship');
      assert.equal(result.met, false);
    });
  });

  describe('Full Requirements Check', () => {
    it('should pass when all requirements met for light fighter', () => {
      const agent = { tech: { combustionDrive: 1 } };
      const planet = { buildings: { shipyard: 1 } };

      const result = checkShipRequirements(agent, planet, 'lightFighter');
      assert.equal(result.met, true);
    });

    it('should pass when all requirements met for cruiser', () => {
      const agent = { tech: { impulseDrive: 4, ionTech: 2 } };
      const planet = { buildings: { shipyard: 5 } };

      const result = checkShipRequirements(agent, planet, 'cruiser');
      assert.equal(result.met, true);
    });

    it('should have extensive requirements for deathstar', () => {
      const agent = { tech: { hyperspaceDrive: 6, hyperspaceTech: 5 } };
      const planet = { buildings: { shipyard: 12 } };

      const result = checkShipRequirements(agent, planet, 'deathstar');
      assert.equal(result.met, false);
    });

    it('should pass all deathstar requirements', () => {
      const agent = { tech: { hyperspaceDrive: 7, hyperspaceTech: 6 } };
      const planet = { buildings: { shipyard: 12 } };

      const result = checkShipRequirements(agent, planet, 'deathstar');
      assert.equal(result.met, true);
    });
  });
});

describe('Edge Cases', () => {
  it('should handle undefined tech gracefully', () => {
    const agent = {};
    const planet = { buildings: { researchLab: 1 } };

    const result = checkTechRequirements(agent, planet, 'energyTech');
    assert.equal(result.met, true);
  });

  it('should handle undefined buildings gracefully', () => {
    const agent = { tech: {} };
    const planet = { buildings: {} };

    const result = checkBuildingRequirements(agent, planet, 'fusionReactor');
    assert.equal(result.met, false);
  });

  it('should return met: true for non-existent tech', () => {
    const agent = { tech: {} };
    const planet = { buildings: {} };

    const result = checkTechRequirements(agent, planet, 'nonExistentTech');
    assert.equal(result.met, true);
  });
});
