# New Icons - Integration Guide

## Summary
New PNG icons added to `/root/molt-of-empires/public/icons/` to replace emoji usage.

## New Icon Files (512x512 PNG, transparent background)

| Icon | File | Color | Replaces Emoji | Usage Locations |
|------|------|-------|----------------|-----------------|
| Planet | `planet.png` | Purple #9C27B0 | 🪐 | Logo (line ~3248) |
| Trophy | `trophy.png` | Gold #FFD700 | 🏆 | Leaderboard header (line ~3336) |
| Globe | `globe.png` | Teal #26A69A | 🌍 | Colonies section, planet displays (~3538, 4585, 4694, 4709) |
| Cargo | `cargo.png` | Orange #FF9800 | 📦 | Storage capacity, ship cargo stats (~3752-54, 4007, 4816, etc.) |
| Combat | `combat.png` | Red #E53935 | ⚔️ | Attack stats, battle logs (~4004, 4996, 5110, 5391, etc.) |
| Pin | `pin.png` | Orange #FF5722 | 📍 📌 | Coordinates, section headers (~4091, 4607) |
| Medal | `medal.png` | Gold #FFC107 | 🎖️ | Officers section (~4074) |

## Integration Steps

### 1. Add CSS for icon styling
Add to the `<style>` section:
```css
.icon-img {
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
  display: inline-block;
}
.icon-img.small { width: 0.875em; height: 0.875em; }
.icon-img.large { width: 1.5em; height: 1.5em; }
```

### 2. Replace emoji with icon images

**Logo (line ~3248):**
```html
<!-- Before -->
<span class="logo-icon">🪐</span>
<!-- After -->
<img src="/icons/planet.png" alt="Planet" class="icon-img large">
```

**Leaderboard (line ~3336):**
```html
<!-- Before -->
<span class="icon">🏆</span>
<!-- After -->
<img src="/icons/trophy.png" alt="Trophy" class="icon-img">
```

**Colonies header (line ~3538):**
```html
<!-- Before -->
<h3>🌍 Your Colonies</h3>
<!-- After -->
<h3><img src="/icons/globe.png" alt="" class="icon-img"> Your Colonies</h3>
```

### 3. JavaScript template replacements

**Ship/defense stats:**
```javascript
// Before
<span>⚔️ ${ship.attack}</span>
<span>📦 ${ship.cargo}</span>

// After
<span><img src="/icons/combat.png" alt="ATK" class="icon-img small"> ${ship.attack}</span>
<span><img src="/icons/cargo.png" alt="Cargo" class="icon-img small"> ${ship.cargo}</span>
```

**Planet coordinates:**
```javascript
// Before
<div class="planet-coords">📍 ${planet.coordinates}</div>

// After
<div class="planet-coords"><img src="/icons/pin.png" alt="📍" class="icon-img small"> ${planet.coordinates}</div>
```

**Storage capacity:**
```javascript
// Before
<div class="storage-current">📦 Capacity: ...

// After
<div class="storage-current"><img src="/icons/cargo.png" alt="" class="icon-img small"> Capacity: ...
```

### 4. Codex tabs (line ~3401-3403)
Note: 🔬 (Tech) and 🛡️ (Defenses) already have icons (research.png, defense.png). You can use those:
```html
<button class="codex-tab" onclick="switchCodexTab('tech')">
  <img src="/icons/research.png" alt="" class="icon-img"> Tech
</button>
<button class="codex-tab" onclick="switchCodexTab('defenses')">
  <img src="/icons/defense.png" alt="" class="icon-img"> Defenses
</button>
```

### 5. Officers section (line ~4074)
```javascript
// Before
html += '<h4>🎖️ Officers</h4>...

// After
html += '<h4><img src="/icons/medal.png" alt="" class="icon-img"> Officers</h4>...
```

## Emoji → Icon Quick Reference

| Emoji | Replace With |
|-------|--------------|
| 🪐 | `<img src="/icons/planet.png" class="icon-img">` |
| 🏆 | `<img src="/icons/trophy.png" class="icon-img">` |
| 🌍 | `<img src="/icons/globe.png" class="icon-img">` |
| 📦 | `<img src="/icons/cargo.png" class="icon-img">` |
| ⚔️ | `<img src="/icons/combat.png" class="icon-img">` |
| 📍 📌 | `<img src="/icons/pin.png" class="icon-img">` |
| 🎖️ | `<img src="/icons/medal.png" class="icon-img">` |
| 🔬 | `<img src="/icons/research.png" class="icon-img">` (existing) |
| 🛡️ | `<img src="/icons/defense.png" class="icon-img">` (existing) |

## Notes
- All icons are 512x512 but scale down cleanly
- Consistent flat design matching existing metal/crystal/etc icons
- Colors chosen to match UI context (red for combat, gold for rewards, etc.)
- Use `alt=""` for decorative icons, meaningful alt text for functional ones
