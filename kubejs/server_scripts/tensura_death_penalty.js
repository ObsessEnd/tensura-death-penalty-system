// =========================================================================
// Tensura Evolutions - Death & Revive Penalty System (NeoForge 1.21.1)
// Automated Features: 
//   1. Deduct 30% EP (Magicule & Aura) upon true death via /gamerule epDeathPenalty 30
//   2. Automatically dissolve 1 random Unique Skill from the player's soul
//   3. Automatically destroy 1 random item from the player's Corpse / Inventory
// =========================================================================

// Initialize external Java classes safely in the global scope
var SkillAPI = null;
var DeathManager = null;
var ItemStack = null;
var AABB = null;

try {
    SkillAPI = Java.loadClass('io.github.manasmods.manascore.skill.api.SkillAPI');
} catch (e) {
    console.error('[Tensura Death Penalty] Failed to load SkillAPI: ' + e);
}

try {
    DeathManager = Java.loadClass('de.maxhenkel.corpse.corelib.death.DeathManager');
} catch (e) {
    console.log('[Tensura Death Penalty] Corpse mod is not installed or unavailable.');
}

try {
    ItemStack = Java.loadClass('net.minecraft.world.item.ItemStack');
} catch (e) {
    console.error('[Tensura Death Penalty] Failed to load ItemStack: ' + e);
}

try {
    AABB = Java.loadClass('net.minecraft.world.phys.AABB');
} catch (e) {
    console.error('[Tensura Death Penalty] Failed to load AABB: ' + e);
}

// Official list of Unique Skill IDs in Tensura & Addons
var UNIQUE_SKILL_IDS = [
    "tensura:absolute_severance", "tensura:analyst", "tensura:berserk", "tensura:berserker",
    "tensura:bewilder", "tensura:chef", "tensura:chosen_one", "tensura:commander",
    "tensura:cook", "tensura:creator", "tensura:degenerate", "tensura:engorger",
    "tensura:envy", "tensura:falsifier", "tensura:fighter", "tensura:fusionist",
    "tensura:gourmand", "tensura:gourmet", "tensura:great_sage", "tensura:greed",
    "tensura:guardian", "tensura:healer", "tensura:infinity_prison", "tensura:lust",
    "tensura:martial_master", "tensura:mathematician", "tensura:merciless", "tensura:murderer",
    "tensura:musician", "tensura:observer", "tensura:oppressor", "tensura:predator",
    "tensura:pride", "tensura:reflector", "tensura:researcher", "tensura:royal_beast",
    "tensura:reaper", "tensura:reverser", "tensura:seeker", "tensura:seer",
    "tensura:severer", "tensura:shadow_striker", "tensura:sloth", "tensura:sniper",
    "tensura:spearhead", "tensura:suppressor", "tensura:survivor", "tensura:traveler",
    "tensura:thrower", "tensura:tuner", "tensura:unyielding", "tensura:usurper",
    "tensura:villain", "tensura:wrath", "stextras:imitator", "blensura:subspace",
    "blensura:celestial_path_blue", "blensura:celestial_cultivation_orange",
    "blensura:celestial_mutation_red", "blensura:convergence", "blensura:sporeblood",
    "mortal_cultivation:mischief", "mysticism:butcher", "mysticism:captivator",
    "mysticism:coalescence", "mysticism:constant", "mysticism:corroder", "mysticism:crasher",
    "mysticism:cultivator", "mysticism:dreamer", "mysticism:engineer", "mysticism:gardener",
    "mysticism:gatekeeper", "mysticism:hidden_ruler", "mysticism:jinchuriki", "mysticism:kyurem",
    "mysticism:malleable", "mysticism:phaser", "mysticism:provider", "mysticism:reducer",
    "mysticism:repeater", "mysticism:reshiram", "mysticism:scholar", "mysticism:schrodinger",
    "mysticism:spiritualist", "mysticism:stagnator", "mysticism:subjugator",
    "mysticism:victorious_harbinger", "mysticism:zekrom", "trnightmare:stripes",
    "trnightmare:lemegeton", "trnightmare:ending", "trnightmare:processor",
    "trnightmare:soul_shrine", "trnightmare:robotnic", "trnightmare:handler",
    "trnightmare:glorious", "trnightmare:witches_envy", "trnightmare:witches_greed",
    "trnightmare:lord_of_magewolves", "trnightmare:dominator", "trnightmare:time_traveler",
    "trnightmare:endorse", "trnightmare:freezing_flame", "trnightmare:tempter",
    "trnightmare:designer", "trnightmare:breaker", "trnightmare:deadly_poison",
    "trnightmare:coffin_of_darkness", "trnightmare:infinity", "trnightmare:sunshine",
    "trnightmare:elementalist", "trnightmare:stasis", "trnightmare:projection_sorcery",
    "trnightmare:elegy", "trnightmare:sentient_being", "trnightmare:gift",
    "trnightmare:saint", "trnightmare:investigator", "trnightmare:scavenger",
    "trnightmare:deluge", "trnightmare:imitator"
];

// Listen to player respawn event
PlayerEvents.respawned(function(event) {
    applyDeathPenalty(event);
});

function applyDeathPenalty(event) {
    var player = event.player;
    var server = player.server;

    // -------------------------------------------------------------
    // 1. DISSOLVE 1 RANDOM UNIQUE SKILL
    // -------------------------------------------------------------
    try {
        if (SkillAPI) {
            var storage = SkillAPI.getSkillsFrom(player);
            if (storage) {
                var learned = storage.getLearnedSkills();
                if (learned && !learned.isEmpty()) {
                    var userUniques = [];
                    var iter = learned.iterator();
                    while (iter.hasNext()) {
                        var inst = iter.next();
                        var skillObj = inst.getSkill();
                        var isUnique = false;
                        var isExplicitNonUnique = false;

                        // 1. Native Tensura Skill check via getType()
                        try {
                            if (skillObj && skillObj.getType) {
                                var sType = skillObj.getType();
                                if (sType) {
                                    var typeName = "" + (sType.name ? sType.name() : sType.toString());
                                    if (typeName.toUpperCase() === "UNIQUE") {
                                        isUnique = true;
                                    } else {
                                        // Explicitly identified as EXTRA, COMMON, INTRINSIC, RESISTANCE, etc.
                                        isExplicitNonUnique = true;
                                    }
                                }
                            }
                        } catch (eType) {}

                        // 2. Curated list / registry ID check (only if not explicitly non-unique)
                        if (!isExplicitNonUnique && !isUnique) {
                            var sid = inst.getSkillId().toString().toLowerCase();
                            if (UNIQUE_SKILL_IDS.indexOf(sid) !== -1) {
                                isUnique = true;
                            } else {
                                var parts = sid.split(":");
                                var path = parts.length > 1 ? parts[1] : parts[0];
                                // Match path only, preventing namespace collisions like 'tr_unique_monsters:appraisal_eye'
                                if (path.indexOf("unique") !== -1) {
                                    isUnique = true;
                                }
                            }
                        }

                        if (isUnique) {
                            userUniques.push(inst);
                        }
                    }

                    if (userUniques.length > 0) {
                        var rIndex = Math.floor(Math.random() * userUniques.length);
                        var targetSkill = userUniques[rIndex];
                        var skillId = targetSkill.getSkillId();
                        var skillName = targetSkill.getSkill().getName().getString();

                        // Permanently remove skill from player storage
                        storage.forgetSkill(skillId);

                        // Broadcast Voice of the World announcements
                        player.tell("§c« [Voice of the World]: You have suffered true death without rescue... »");
                        player.tell("§c« Severe soul fracture detected: Unique Skill §6[" + skillName + "]§c has been permanently dissolved! »");
                        server.tell("§7[Notice]: Player §e" + player.name.string + " §7has fallen in battle and lost Unique Skill §c[" + skillName + "]§7!");
                    } else {
                        player.tell("§7« [Voice of the World]: No Unique Skills were available to dissolve. »");
                    }
                }
            }
        }
    } catch (errSkill) {
        console.error("[Tensura Death Penalty] Error dissolving Unique Skill: " + errSkill);
    }

    // -------------------------------------------------------------
    // 2. DESTROY 1 RANDOM ITEM IN CORPSE OR INVENTORY
    // -------------------------------------------------------------
    try {
        var itemRemoved = false;

        // Priority 1: Direct deletion from Corpse mod storage
        if (DeathManager && ItemStack) {
            var sLevel = player.serverLevel ? player.serverLevel() : player.level;
            // Use (ServerLevel, UUID) to bypass the recursive StackOverflow bug in Corpse mod's getDeaths(ServerPlayer)
            var deaths = DeathManager.getDeaths(sLevel, player.uuid);
            if (deaths && !deaths.isEmpty()) {
                // In Corpse mod, deaths are sorted by timestamp descending, so index 0 is the newest death
                var latestDeath = deaths.get(0);
                var validSlots = [];

                // Scan Main Inventory (36 slots)
                var mainInv = latestDeath.getMainInventory();
                if (mainInv) {
                    for (var i = 0; i < mainInv.size(); i++) {
                        var st = mainInv.get(i);
                        if (st && !st.isEmpty()) {
                            validSlots.push({ list: mainInv, index: i, stack: st });
                        }
                    }
                }

                // Scan Armor Slots (4 slots)
                var armorInv = latestDeath.getArmorInventory();
                if (armorInv) {
                    for (var j = 0; j < armorInv.size(); j++) {
                        var stA = armorInv.get(j);
                        if (stA && !stA.isEmpty()) {
                            validSlots.push({ list: armorInv, index: j, stack: stA });
                        }
                    }
                }

                // Scan Off-Hand Slot (1 slot)
                var offInv = latestDeath.getOffHandInventory();
                if (offInv) {
                    for (var k = 0; k < offInv.size(); k++) {
                        var stO = offInv.get(k);
                        if (stO && !stO.isEmpty()) {
                            validSlots.push({ list: offInv, index: k, stack: stO });
                        }
                    }
                }

                // Scan Additional/Curios Items if present
                var addInv = latestDeath.getAdditionalItems();
                if (addInv) {
                    for (var m = 0; m < addInv.size(); m++) {
                        var stM = addInv.get(m);
                        if (stM && !stM.isEmpty()) {
                            validSlots.push({ list: addInv, index: m, stack: stM });
                        }
                    }
                }

                if (validSlots.length > 0) {
                    var rSlot = validSlots[Math.floor(Math.random() * validSlots.length)];
                    var removedItemName = rSlot.stack.getHoverName().getString();

                    // Destroy the chosen item in data structure
                    rSlot.list.set(rSlot.index, ItemStack.EMPTY);

                    // Persist updated corpse inventory to disk
                    DeathManager.addDeath(player, latestDeath);

                    // ALSO update the live CorpseEntity in world RAM so it's gone when right-clicked!
                    try {
                        var deathX = latestDeath.getPosX();
                        var deathY = latestDeath.getPosY();
                        var deathZ = latestDeath.getPosZ();
                        var targetDim = latestDeath.getDimension();
                        var targetLevel = sLevel;

                        if (server && targetDim) {
                            try {
                                var dimKey = Java.loadClass('net.minecraft.resources.ResourceLocation').parse(targetDim);
                                var resKey = Java.loadClass('net.minecraft.resources.ResourceKey').create(Java.loadClass('net.minecraft.core.registries.Registries').DIMENSION, dimKey);
                                var foundLevel = server.getLevel(resKey);
                                if (foundLevel) targetLevel = foundLevel;
                            } catch(eDim) {}
                        }

                        // Ensure chunk is loaded at death site
                        var chunkX = Math.floor(deathX) >> 4;
                        var chunkZ = Math.floor(deathZ) >> 4;
                        try {
                            targetLevel.getChunk(chunkX, chunkZ);
                        } catch(eChunk) {}

                        var foundLiveCorpse = null;

                        // Search within bounding box around death point
                        if (AABB) {
                            var box = new AABB(deathX - 16, deathY - 32, deathZ - 16, deathX + 16, deathY + 32, deathZ + 16);
                            var boxEntities = targetLevel.getEntitiesWithin(box);
                            if (boxEntities) {
                                var iterB = boxEntities.iterator();
                                while (iterB.hasNext()) {
                                    var be = iterB.next();
                                    if (be && be.type == 'corpse:corpse') {
                                        try {
                                            if (be.getDeath && be.getDeath() && be.getDeath().getId().equals(latestDeath.getId())) {
                                                foundLiveCorpse = be;
                                                break;
                                            }
                                        } catch(eBE) {}
                                    }
                                }
                            }
                        }

                        // Fallback: search all loaded entities in level
                        if (!foundLiveCorpse) {
                            var allEntities = targetLevel.getEntities();
                            if (allEntities) {
                                var iterAll = allEntities.iterator();
                                while (iterAll.hasNext()) {
                                    var ae = iterAll.next();
                                    if (ae && ae.type == 'corpse:corpse') {
                                        try {
                                            if (ae.getDeath && ae.getDeath() && ae.getDeath().getId().equals(latestDeath.getId())) {
                                                foundLiveCorpse = ae;
                                                break;
                                            }
                                        } catch(eAE) {}
                                    }
                                }
                            }
                        }

                        // Update the live entity's memory directly via multi-tier reflection!
                        if (foundLiveCorpse) {
                            var rawCorpse = (foundLiveCorpse.minecraftEntity) ? foundLiveCorpse.minecraftEntity : foundLiveCorpse;
                            var synced = false;

                            // Tier 1: Try Rhino JavaBean property assignment
                            try {
                                rawCorpse.death = latestDeath;
                                synced = true;
                            } catch (eBean) {}

                            // Tier 2: Try direct Java method reflection (bypasses Rhino method dispatcher)
                            if (!synced) {
                                try {
                                    var corpseMethods = rawCorpse.getClass().getMethods();
                                    for (var mIdx = 0; mIdx < corpseMethods.length; mIdx++) {
                                        if (corpseMethods[mIdx].getName().equals("setDeath")) {
                                            corpseMethods[mIdx].setAccessible(true);
                                            corpseMethods[mIdx].invoke(rawCorpse, latestDeath);
                                            synced = true;
                                            break;
                                        }
                                    }
                                } catch (eReflect) {}
                            }

                            // Tier 3: Try direct field reflection (directly modifies 'protected Death death' in JVM memory)
                            if (!synced) {
                                try {
                                    var cClass = rawCorpse.getClass();
                                    while (cClass != null && !synced) {
                                        try {
                                            var dField = cClass.getDeclaredField("death");
                                            dField.setAccessible(true);
                                            dField.set(rawCorpse, latestDeath);
                                            synced = true;
                                            break;
                                        } catch (eF) {
                                            cClass = cClass.getSuperclass();
                                        }
                                    }
                                } catch (eFieldReflect) {}
                            }

                            // Tier 4: Update equipment sync
                            try {
                                var eq = latestDeath.getEquipment();
                                if (eq) {
                                    try {
                                        rawCorpse.setEquipment(eq);
                                    } catch (eEqDirect) {
                                        var eqMethods = rawCorpse.getClass().getMethods();
                                        for (var eIdx = 0; eIdx < eqMethods.length; eIdx++) {
                                            if (eqMethods[eIdx].getName().equals("setEquipment")) {
                                                eqMethods[eIdx].setAccessible(true);
                                                eqMethods[eIdx].invoke(rawCorpse, eq);
                                                break;
                                            }
                                        }
                                    }
                                }
                            } catch (eEq) {}

                            if (synced) {
                                console.log("[Tensura Death Penalty] Successfully synchronized live CorpseEntity in-world RAM.");
                            } else {
                                console.warn("[Tensura Death Penalty] Could not mutate live CorpseEntity RAM directly, relying on disk data.");
                            }
                        }
                    } catch(errLive) {
                        console.error("[Tensura Death Penalty] Error syncing live CorpseEntity RAM: " + errLive);
                    }

                    player.tell("§c« [Voice of the World]: Item §6[" + removedItemName + "]§c from your corpse has disintegrated into nothingness! »");
                    itemRemoved = true;
                }
            }
        }

        // Priority 2 (Fallback): If keepInventory is enabled or corpse is empty, remove from player inventory
        if (!itemRemoved && ItemStack) {
            var pInv = player.inventory;
            var pSlots = [];
            for (var slotIdx = 0; slotIdx < pInv.containerSize; slotIdx++) {
                var pStack = pInv.getItem(slotIdx);
                if (pStack && !pStack.isEmpty()) {
                    pSlots.push({ index: slotIdx, stack: pStack });
                }
            }

            if (pSlots.length > 0) {
                var chosenPSlot = pSlots[Math.floor(Math.random() * pSlots.length)];
                var pItemName = chosenPSlot.stack.getHoverName().getString();
                pInv.setItem(chosenPSlot.index, ItemStack.EMPTY);

                player.tell("§c« [Voice of the World]: Item §6[" + pItemName + "]§c from your inventory has disintegrated into nothingness! »");
                itemRemoved = true;
            }
        }

        if (!itemRemoved) {
            player.tell("§7« [Voice of the World]: No items were found in your corpse or inventory to disintegrate. »");
        }
    } catch (errItem) {
        console.error("[Tensura Death Penalty] Error destroying item: " + errItem);
    }
}
