# ⚔️ Tensura Evolutions - Death & Revive Penalty System

A fully automated, custom death and revive penalty system for the **Tensura Evolutions** modpack (Minecraft 1.21.1 NeoForge).

---

## 🌟 Gameplay Mechanics

### 1. When Health Reaches Zero (Knocked Out):
* The player **does not die immediately**; instead, they enter a downed state on the ground.
* A countdown timer of **120 seconds** (configurable) begins.
* **Teammate Rescue:** An ally can approach, hold **Sneak (Shift) + Right-Click** to revive the fallen player.
* **On-the-spot Revive:** The player stands back up directly where they fell with **1 HP (half a heart)**.  
  *(No item loss, no EP loss, no skill loss).*

### 2. When NOT Rescued (Timer Expires or *"Accept Fate"* Clicked):
The player suffers true death and respawns at their bed/world spawn point. The system automatically enforces **3 Severe Death Penalties**:

1. 🔻 **-30% EP Loss (Magicule & Aura):** Tensura's native engine automatically cuts 30% of the player's total Existence Points (EP).
2. 🔻 **Loss of 1 Random Unique Skill:** The automated script scans the player's soul capability, selects 1 random Unique Skill, and permanently dissolves it, accompanied by a server-wide *"Voice of the World"* announcement.
3. 🔻 **Loss of 1 Random Item from Corpse:** The automated script deletes 1 random item from the player's **Corpse** at their death location before they can retrieve their grave.

---

## 📂 Repository Structure

```text
├── config/
│   └── hardcorerevival-common.toml      # Hardcore Revival config (1 HP revive, 120s timer, Survival mode enabled)
├── kubejs/
│   └── server_scripts/
│       └── tensura_death_penalty.js     # KubeJS automation script (random Unique Skill & Corpse item removal)
├── mods/
│   ├── hardcorerevival-neoforge-1.21.1-21.1.22.jar  # Knockout & revive countdown mod
│   ├── kubejs-neoforge-2101.7.2-build.377.jar        # KubeJS automation engine
│   └── rhino-2101.2.8-build.91.jar                   # JavaScript execution runtime for KubeJS
└── README.md
```

---

## 🚀 Server Installation Guide

Designed for Server Administrators (Pikamc Web Panel, Pterodactyl, or VPS):

1. **Upload Files to Server:**
   * Copy all files from `mods/` into the server's `mods/` directory.
   * Copy `config/hardcorerevival-common.toml` into the server's `config/` directory.
   * Copy `kubejs/server_scripts/tensura_death_penalty.js` into the server's `kubejs/server_scripts/` directory (create folders if they do not exist).

2. **Enable 30% EP Loss Gamerule:**
   Execute the following command in the Server Console (or in-game with OP permissions):
   ```mcfunction
   /gamerule epDeathPenalty 30
   ```

3. **Restart the Server** to apply all mods, configurations, and scripts.

---

## 💻 Client Installation Guide

Players joining the server simply need:
* Ensure their local `mods/` directory contains:
  * `hardcorerevival-neoforge-1.21.1-21.1.22.jar`  
  *(Required for rendering the downed HUD, countdown timer, and revive prompt).*
