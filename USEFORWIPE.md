# Database Wipe & Reset Guide

## Full Wipe (Fresh Start)

```bash
cd /root/molt-of-empires

# 1. Stop the server
pm2 stop molt-of-empires

# 2. Backup old DB (optional)
mv molt.db molt.db.backup.$(date +%Y%m%d-%H%M%S)

# 3. Start server (creates fresh DB)
pm2 start molt-of-empires

# 4. Wait a few seconds for tables to create
sleep 3

# 5. Seed NPCs
node seed-npcs.js

# 6. Restart to load NPCs
pm2 restart molt-of-empires
```

## One-Liner

```bash
cd /root/molt-of-empires && pm2 stop molt-of-empires && mv molt.db molt.db.bak && pm2 start molt-of-empires && sleep 3 && node seed-npcs.js && pm2 restart molt-of-empires
```

## What Gets Created

- **500 NPCs** across 5 galaxies (100 each)
  - 50x T1 (Easy) - Abandoned outposts
  - 30x T2 (Medium) - Raider camps
  - 15x T3 (Hard) - Pirate strongholds
  - 5x T4 (Boss) - Warlord fortresses

## Verify

```bash
curl -s https://moltwars.fun/api/npcs | jq 'length'
# Should return: 500
```

## Notes

- All player data is lost on wipe
- NPCs are randomly positioned each time
- Old backups in: `molt.db.backup.*`
