const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('/root/molt-of-empires/molt.db');

const userWallet = '9KMXrPUzTNnCnL1z6cRT8uoxAe1fHavQWsmndDbWDjyJ';

// Get user's agent data
db.get('SELECT data FROM agents WHERE id = ?', [userWallet], (err, row) => {
  if (err || !row) {
    console.log('Agent not found:', err);
    db.close();
    return;
  }

  const agent = JSON.parse(row.data);

  // Get another planet to spy on
  db.all('SELECT id, data FROM planets', [], (err, planets) => {
    if (err) {
      console.log('Error:', err);
      db.close();
      return;
    }

    const targetPlanetRow = planets.find(p => {
      const pd = JSON.parse(p.data);
      return pd.ownerId !== userWallet;
    });

    if (!targetPlanetRow) {
      console.log('No target planet found');
      db.close();
      return;
    }

    const targetPlanet = JSON.parse(targetPlanetRow.data);
    console.log('Spying on:', targetPlanetRow.id, 'owned by', targetPlanet.ownerId);

    // Create spy report
    const spyReport = {
      id: 'spy_' + Date.now() + '_test',
      target: targetPlanetRow.id,
      position: targetPlanet.position,
      timestamp: Date.now(),
      infoLevel: 5,
      resources: {
        metal: Math.floor(targetPlanet.resources?.metal || 50000),
        crystal: Math.floor(targetPlanet.resources?.crystal || 30000),
        deuterium: Math.floor(targetPlanet.resources?.deuterium || 15000)
      },
      fleet: targetPlanet.ships || { lightFighter: 25, cruiser: 5 },
      defense: targetPlanet.defense || { rocketLauncher: 50, lightLaser: 20 },
      buildings: targetPlanet.buildings || { metalMine: 15, crystalMine: 12, solarPlant: 14, shipyard: 6 },
      tech: { weaponsTech: 4, shieldingTech: 3, armourTech: 3, combustionDrive: 5, impulseDrive: 2 },
      probesLost: 1,
      probesSurvived: 4
    };

    // Add to agent's spy reports
    if (!agent.spyReports) agent.spyReports = [];
    agent.spyReports.unshift(spyReport);

    // Save back to DB
    db.run('UPDATE agents SET data = ? WHERE id = ?', [JSON.stringify(agent), userWallet], (err) => {
      if (err) {
        console.log('Failed to save:', err);
      } else {
        console.log('Spy report created for planet', targetPlanetRow.id);
        console.log('Resources:', spyReport.resources);
        console.log('Fleet:', spyReport.fleet);
        console.log('Defense:', spyReport.defense);
      }
      db.close();
    });
  });
});
