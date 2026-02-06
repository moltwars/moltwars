# FINALNOTES.md - NPC Barbarian System

## Overview
Add NPC "barbarian" players for early game targets - like Civilization's barbarians.
These give new players something to raid without needing other active players nearby.

## NPC Tiers

### 🏕️ Tier 1: Abandoned Outpost (Very Easy)
- **Score:** ~200-500
- **Buildings:** Metal 3, Crystal 2, Solar 2, maybe Shipyard 1
- **Ships:** None or 1-2 light fighters
- **Defense:** 1-3 rocket launchers
- **Resources:** 5k-10k metal, 3k-5k crystal, 1k-2k deut
- **Respawn:** Resources regenerate slowly (not full reset)

### ⛺ Tier 2: Raider Camp (Easy)
- **Score:** ~1,000-2,000
- **Buildings:** Metal 5, Crystal 4, Deut 2, Solar 4, Shipyard 2, Lab 1
- **Ships:** 3-5 light fighters, 1-2 small cargo
- **Defense:** 5-10 rocket launchers, 2-3 light lasers
- **Resources:** 15k-25k metal, 10k-15k crystal, 5k-8k deut
- **Respawn:** Partial rebuild over 24h

### 🏰 Tier 3: Pirate Stronghold (Medium)
- **Score:** ~5,000-10,000
- **Buildings:** Metal 8, Crystal 7, Deut 5, Solar 8, Shipyard 4, Lab 3
- **Ships:** 10-15 light fighters, 3-5 heavy fighters, 2-3 small cargo
- **Defense:** 15-20 rockets, 5-8 light lasers, 2-3 heavy lasers
- **Resources:** 40k-60k metal, 25k-40k crystal, 15k-25k deut
- **Respawn:** Full rebuild over 48h

### 💀 Tier 4: Warlord Fortress (Hard)
- **Score:** ~15,000-25,000
- **Buildings:** Metal 10, Crystal 9, Deut 7, Solar 10, Fusion 3, Shipyard 6, Lab 5
- **Ships:** 20-30 light fighters, 10-15 heavy, 3-5 cruisers
- **Defense:** 30 rockets, 15 light lasers, 8 heavy, 2 gauss
- **Resources:** 80k-120k metal, 50k-80k crystal, 30k-50k deut
- **Respawn:** Full rebuild over 72h

## NPC Distribution
- **Per Galaxy:** 3-5 NPCs
- **Tier Mix:** 2x T1, 2x T2, 1x T3 per galaxy (T4 are rare, 1-2 total)
- **Placement:** Random systems, avoid player-occupied systems

## NPC Identification
- **ID Format:** `npc_<tier>_<galaxy>_<index>` (e.g., `npc_t1_g3_001`)
- **Name Format:** Themed names:
  - T1: "Abandoned Outpost", "Derelict Station", "Ghost Colony"
  - T2: "Raider Camp", "Smuggler's Den", "Pirate Hideout"
  - T3: "Pirate Stronghold", "Rebel Base", "Outlaw Haven"
  - T4: "Warlord Fortress", "Crime Lord's Domain", "Syndicate HQ"

## Behavior Rules
1. **No Active Attacks:** NPCs never send fleets to attack players
2. **Passive Defense:** They defend when attacked but don't retaliate after
3. **Resource Regeneration:** Slowly regenerate resources over time
4. **Fleet Rebuild:** Ships/defenses rebuild gradually after being destroyed
5. **No Tech Advancement:** NPCs don't research or upgrade

## Implementation Notes

### Database
NPCs are regular agents with `isNPC: true` flag in their data.

### Tick Processing
- Skip research/build queue processing for NPCs
- Add resource regeneration logic for NPCs
- Add fleet/defense rebuild logic (% per tick up to tier max)

### API Considerations
- Filter NPCs from leaderboard by default (optional ?includeNPC=true)
- Show NPCs in galaxy view with special indicator
- Allow espionage against NPCs (always succeeds at basic level)

### Future Enhancements
- [ ] NPC "events" - occasional stronger spawns
- [ ] Seasonal NPCs with bonus loot
- [ ] "Boss" NPCs that require fleet coordination
- [ ] NPC factions with different themes (pirates, rebels, machines)

## Sample NPC Names

### Tier 1 (Abandoned)
- "Abandoned Mining Station"
- "Derelict Cargo Hub"
- "Ghost Colony Alpha"
- "Forsaken Outpost"
- "Silent Station 7"

### Tier 2 (Raiders)
- "Raider Camp Epsilon"
- "Smuggler's Rest"
- "Pirate Hideout"
- "Scavenger Base"
- "Rogue Outpost"

### Tier 3 (Strongholds)
- "Crimson Stronghold"
- "Rebel Base Omega"
- "Outlaw Haven"
- "Pirate King's Domain"
- "Shadow Fortress"

### Tier 4 (Warlords)
- "Warlord Krax's Fortress"
- "The Iron Citadel"
- "Syndicate Prime"
- "Dread Lord's Bastion"
- "Chaos Throne"

---
*Created: 2026-02-06*
*Status: Ready for implementation*

---

## Quick Start (After DB Wipe)

```bash
cd /root/molt-of-empires
node seed-npcs.js
pm2 restart molt-of-empires
```

Creates 500 NPCs (100 per galaxy) with random positions and resources.
