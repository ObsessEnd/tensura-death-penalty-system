// =========================================================================
// Tensura Evolutions - Death & Revive Penalty System (NeoForge 1.21.1)
// Automated Features: 
//   1. Deduct 30% EP (Magicule & Aura) upon true death via /gamerule epDeathPenalty 30
//   2. Automatically dissolve 1 random Unique Skill from the player's soul
//   3. Automatically destroy 1 random item from the player's Corpse
// =========================================================================

const SkillAPI = Java.loadClass('io.github.manasmods.manascore.skill.api.SkillAPI');

// Official list of Unique Skill IDs in Tensura & Addons
const UNIQUE_SKILL_IDS = [
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

// Listen to Player Respawn event
PlayerEvents.respawned(event => {
    const player = event.player;
    const server = player.server;

    // 1. DISSOLVE 1 RANDOM UNIQUE SKILL
    try {
        const skillStorage = SkillAPI.getSkillsFrom(player);
        if (skillStorage) {
            const learnedSkills = skillStorage.getLearnedSkills();
            if (learnedSkills && !learnedSkills.isEmpty()) {
                let userUniqueSkills = [];

                let iterator = learnedSkills.iterator();
                while (iterator.hasNext()) {
                    let skillInstance = iterator.next();
                    let skillId = skillInstance.getSkillId().toString().toLowerCase();

                    // Check if skill is in Unique Skill list
                    if (UNIQUE_SKILL_IDS.includes(skillId) || skillId.includes("unique")) {
                        userUniqueSkills.push(skillInstance);
                    }
                }

                if (userUniqueSkills.length > 0) {
                    let randomIndex = Math.floor(Math.random() * userUniqueSkills.length);
                    let chosenSkill = userUniqueSkills[randomIndex];
                    let skillName = chosenSkill.getDisplayName().getString();

                    // Strip skill from the player's soul
                    skillStorage.forgetSkill(chosenSkill);

                    // Broadcast Voice of the World announcement
                    player.tell("§c« [Voice of the World]: You have suffered true death without rescue... »");
                    player.tell("§c« Severe soul fracture detected: Unique Skill §6[" + skillName + "]§c has been permanently dissolved! »");
                    server.tell("§7[Notice]: Player §e" + player.name.string + " §7has fallen in battle and lost Unique Skill §c[" + skillName + "]§7!");
                } else {
                    player.tell("§7« [Voice of the World]: No Unique Skills were available to dissolve. »");
                }
            }
        }
    } catch (e) {
        console.error("[Tensura Death Penalty] Error handling skill removal: " + e);
    }

    // 2. DESTROY 1 RANDOM ITEM IN CORPSE
    try {
        server.scheduleInTicks(20, () => {
            server.runCommandSilent(`execute at ${player.username} run data remove entity @e[type=corpse:corpse,limit=1,sort=nearest] Items[0]`);
            player.tell("§c« [Voice of the World]: 1 item from your corpse has disintegrated into nothingness! »");
        });
    } catch (e) {
        console.error("[Tensura Death Penalty] Error handling corpse item removal: " + e);
    }
});
