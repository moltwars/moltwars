#!/bin/bash
# Setup script for echoghost test environment
# Run this after the server is started

BASE_URL="${BASE_URL:-http://localhost:3030}"
ADMIN_SECRET="bae475b621cb3c8e0d56382711af800abb4e0e685ffeafcb62632af4296b3995"

echo "Setting up echoghost test environment..."
echo "Base URL: $BASE_URL"
echo ""

# 1. Create echoghost agent at 2:136:5
echo "=== Creating echoghost agent ==="
curl -s -X POST "$BASE_URL/api/debug/create-agent" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: $ADMIN_SECRET" \
  -d '{
    "agentId": "ECHoZF5NgdjoxjNebchsKi8nqTy6LEjwUfc5DgVPcLQG",
    "displayName": "echoghost",
    "position": { "galaxy": 2, "system": 136, "position": 5 }
  }' | jq .
echo ""

# 2. Set echoghost resources
echo "=== Setting echoghost resources ==="
curl -s -X POST "$BASE_URL/api/debug/add-units" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: $ADMIN_SECRET" \
  -d '{
    "planetId": "2:136:5",
    "resources": {
      "metal": 500000,
      "crystal": 300000,
      "deuterium": 100000
    }
  }' | jq .
echo ""

# 3. Set echoghost tech levels
echo "=== Setting echoghost tech levels ==="
curl -s -X POST "$BASE_URL/api/debug/set-tech" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: $ADMIN_SECRET" \
  -d '{
    "agentId": "ECHoZF5NgdjoxjNebchsKi8nqTy6LEjwUfc5DgVPcLQG",
    "tech": {
      "energyTech": 5,
      "laserTech": 6,
      "ionTech": 4,
      "hyperspaceTech": 4,
      "plasmaTech": 0,
      "combustionDrive": 5,
      "impulseDrive": 4,
      "hyperspaceDrive": 3,
      "weaponsTech": 5,
      "shieldingTech": 5,
      "armourTech": 5,
      "espionageTech": 4,
      "computerTech": 6,
      "astrophysics": 2,
      "scienceTech": 0
    }
  }' | jq .
echo ""

# 4. Set echoghost buildings
echo "=== Setting echoghost buildings ==="
curl -s -X POST "$BASE_URL/api/debug/set-buildings" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: $ADMIN_SECRET" \
  -d '{
    "planetId": "2:136:5",
    "buildings": {
      "metalMine": 10,
      "crystalMine": 10,
      "deuteriumSynthesizer": 8,
      "solarPlant": 12,
      "fusionReactor": 0,
      "shipyard": 8,
      "roboticsFactory": 6,
      "researchLab": 6,
      "naniteFactory": 0
    }
  }' | jq .
echo ""

# 5. Grant echoghost moltium
echo "=== Granting echoghost moltium ==="
curl -s -X POST "$BASE_URL/api/moltium/grant" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: $ADMIN_SECRET" \
  -d '{
    "agentId": "ECHoZF5NgdjoxjNebchsKi8nqTy6LEjwUfc5DgVPcLQG",
    "amount": 50000,
    "reason": "Test environment setup"
  }' | jq .
echo ""

# 6. Create TestDummy enemy at 2:136:7
echo "=== Creating TestDummy enemy ==="
curl -s -X POST "$BASE_URL/api/debug/create-agent" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: $ADMIN_SECRET" \
  -d '{
    "agentId": "TestDummy",
    "displayName": "TestDummy",
    "position": { "galaxy": 2, "system": 136, "position": 7 }
  }' | jq .

curl -s -X POST "$BASE_URL/api/debug/add-units" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: $ADMIN_SECRET" \
  -d '{
    "planetId": "2:136:7",
    "ships": {
      "lightFighter": 50,
      "heavyFighter": 20
    },
    "defense": {
      "rocketLauncher": 10,
      "lightLaser": 5
    },
    "resources": {
      "metal": 100000,
      "crystal": 50000,
      "deuterium": 20000
    }
  }' | jq .
echo ""

# 7. Create IronFortress enemy at 2:137:3
echo "=== Creating IronFortress enemy ==="
curl -s -X POST "$BASE_URL/api/debug/create-agent" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: $ADMIN_SECRET" \
  -d '{
    "agentId": "IronFortress",
    "displayName": "IronFortress",
    "position": { "galaxy": 2, "system": 137, "position": 3 }
  }' | jq .

curl -s -X POST "$BASE_URL/api/debug/add-units" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: $ADMIN_SECRET" \
  -d '{
    "planetId": "2:137:3",
    "ships": {
      "cruiser": 5
    },
    "defense": {
      "rocketLauncher": 50,
      "lightLaser": 30,
      "heavyLaser": 10,
      "gaussCannon": 5,
      "smallShieldDome": 1
    },
    "resources": {
      "metal": 200000,
      "crystal": 100000,
      "deuterium": 50000
    }
  }' | jq .
echo ""

# 8. Create FleetCommander enemy at 2:138:8
echo "=== Creating FleetCommander enemy ==="
curl -s -X POST "$BASE_URL/api/debug/create-agent" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: $ADMIN_SECRET" \
  -d '{
    "agentId": "FleetCommander",
    "displayName": "FleetCommander",
    "position": { "galaxy": 2, "system": 138, "position": 8 }
  }' | jq .

curl -s -X POST "$BASE_URL/api/debug/add-units" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: $ADMIN_SECRET" \
  -d '{
    "planetId": "2:138:8",
    "ships": {
      "lightFighter": 100,
      "heavyFighter": 30,
      "cruiser": 10,
      "battleship": 5,
      "bomber": 2
    },
    "defense": {
      "rocketLauncher": 5
    },
    "resources": {
      "metal": 150000,
      "crystal": 80000,
      "deuterium": 40000
    }
  }' | jq .
echo ""

echo "=== Setup complete! ==="
echo ""
echo "echoghost @ 2:136:5 - Ready for testing"
echo "TestDummy @ 2:136:7 - Weak target in same system"
echo "IronFortress @ 2:137:3 - Defensive challenge"
echo "FleetCommander @ 2:138:8 - Fleet battle"
