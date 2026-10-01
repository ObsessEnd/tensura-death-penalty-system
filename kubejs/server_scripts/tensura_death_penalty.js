// =========================================================================
// Tensura Evolutions - Death Penalty System (NeoForge 1.21.1)
// Tự động hóa: 
//   1. Trừ 30% EP (Magicule & Aura) khi chết thật qua /gamerule epDeathPenalty 30
//   2. Tự động xóa ngẫu nhiên 1 Kỹ năng Độc nhất (Unique Skill) của người chơi
//   3. Tự động xóa ngẫu nhiên 1 vật phẩm trong Xác chết (Corpse)
// =========================================================================

const SkillAPI = Java.loadClass('io.github.manasmods.manascore.skill.api.SkillAPI');

// Danh sách các ID Unique Skill chính thức trong Tensura & Addons
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

// Lắng nghe sự kiện người chơi Hồi sinh (Respawn)
PlayerEvents.respawned(event => {
    const player = event.player;
    const server = player.server;

    // 1. XỬ LÝ XÓA 1 KỸ NĂNG ĐỘC NHẤT (UNIQUE SKILL) NGẪU NHIÊN
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

                    // Kiểm tra xem kỹ năng có nằm trong danh sách Unique không
                    if (UNIQUE_SKILL_IDS.includes(skillId) || skillId.includes("unique")) {
                        userUniqueSkills.push(skillInstance);
                    }
                }

                if (userUniqueSkills.length > 0) {
                    let randomIndex = Math.floor(Math.random() * userUniqueSkills.length);
                    let chosenSkill = userUniqueSkills[randomIndex];
                    let skillName = chosenSkill.getDisplayName().getString();

                    // Tước đoạt kỹ năng khỏi linh hồn người chơi
                    skillStorage.forgetSkill(chosenSkill);

                    // Thông báo Tiếng nói thế giới (Voice of the World)
                    player.tell("§c« [Tiếng nói thế giới]: Do bạn đã tử vong mà không được cứu sống... »");
                    player.tell("§c« Linh hồn bị tổn hại nặng nề, Kỹ năng Độc nhất §6[" + skillName + "]§c đã bị phân rã hoàn toàn! »");
                    server.tell("§7[Thông báo]: Người chơi §e" + player.name.string + " §7đã tử trận và bị tước đi Kỹ năng Độc nhất §c[" + skillName + "]§7!");
                } else {
                    player.tell("§7« [Tiếng nói thế giới]: Bạn không sở hữu Kỹ năng Độc nhất nào để bị phân rã. »");
                }
            }
        }
    } catch (e) {
        console.error("[Tensura Death Penalty] Lỗi khi xử lý kỹ năng: " + e);
    }

    // 2. XỬ LÝ TIÊU HỦY 1 VẬT PHẨM TRONG XÁC CHẾT (CORPSE)
    try {
        // Xóa 1 slot vật phẩm trong xác chết gần nhất của người chơi tại vị trí tử trận
        server.scheduleInTicks(20, () => {
            server.runCommandSilent(`execute at ${player.username} run data remove entity @e[type=corpse:corpse,limit=1,sort=nearest] Items[0]`);
            player.tell("§c« [Tiếng nói thế giới]: 1 vật phẩm trong di hài của bạn đã bị tiêu hủy vĩnh viễn! »");
        });
    } catch (e) {
        console.error("[Tensura Death Penalty] Lỗi khi xử lý xác chết: " + e);
    }
});
