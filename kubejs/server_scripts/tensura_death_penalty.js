// =========================================================================
// Tensura Evolutions - Death Penalty System (NeoForge 1.21.1)
// Tự động hóa: 
//   1. Trừ 30% EP khi chết qua /gamerule epDeathPenalty 30
//   2. Tự động xóa ngẫu nhiên 1 Kỹ năng Độc nhất (Unique Skill) của người chơi
//   3. Tự động tiêu hủy ngẫu nhiên 1 vật phẩm trong Xác chết (Corpse) / Túi đồ
// =========================================================================

// Khởi tạo các Java Class an toàn bên ngoài
var SkillAPI = null;
var DeathManager = null;
var ItemStack = null;

try {
    SkillAPI = Java.loadClass('io.github.manasmods.manascore.skill.api.SkillAPI');
} catch (e) {
    console.error('[Tensura Death Penalty] Không thể nạp SkillAPI: ' + e);
}

try {
    DeathManager = Java.loadClass('de.maxhenkel.corpse.corelib.death.DeathManager');
} catch (e) {
    console.log('[Tensura Death Penalty] Mod Corpse không khả dụng hoặc chưa cài.');
}

try {
    ItemStack = Java.loadClass('net.minecraft.world.item.ItemStack');
} catch (e) {
    console.error('[Tensura Death Penalty] Không thể nạp ItemStack: ' + e);
}

// Danh sách các ID Unique Skill chính thức trong Tensura & Addons
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

// Lắng nghe sự kiện hồi sinh (Respawn)
PlayerEvents.respawned(function(event) {
    applyDeathPenalty(event);
});

function applyDeathPenalty(event) {
    var player = event.player;
    var server = player.server;

    // -------------------------------------------------------------
    // 1. PHÂN RÃ 1 KỸ NĂNG ĐỘC NHẤT (UNIQUE SKILL) NGẪU NHIÊN
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
                        var sid = inst.getSkillId().toString().toLowerCase();
                        if (UNIQUE_SKILL_IDS.indexOf(sid) !== -1 || sid.indexOf("unique") !== -1) {
                            userUniques.push(inst);
                        }
                    }

                    if (userUniques.length > 0) {
                        var rIndex = Math.floor(Math.random() * userUniques.length);
                        var targetSkill = userUniques[rIndex];
                        var skillId = targetSkill.getSkillId();
                        var skillName = targetSkill.getSkill().getName().getString();

                        // Tước bỏ kỹ năng vĩnh viễn
                        storage.forgetSkill(skillId);

                        // Thông báo
                        player.tell("§c« [Tiếng nói thế giới]: Do bạn đã tử vong mà không được cứu sống... »");
                        player.tell("§c« Linh hồn tổn thương trầm trọng: Kỹ năng Độc nhất §6[" + skillName + "]§c đã bị phân rã hoàn toàn! »");
                        server.tell("§7[Thông báo]: Người chơi §e" + player.name.string + " §7đã tử trận và bị phân rã Kỹ năng Độc nhất §c[" + skillName + "]§7!");
                    } else {
                        player.tell("§7« [Tiếng nói thế giới]: Bạn không sở hữu Kỹ năng Độc nhất nào để bị phân rã. »");
                    }
                }
            }
        }
    } catch (errSkill) {
        console.error("[Tensura Death Penalty] Lỗi phân rã kỹ năng: " + errSkill);
    }

    // -------------------------------------------------------------
    // 2. TIÊU HỦY 1 VẬT PHẨM NGẪU NHIÊN TRONG XÁC CHẾT HOẶC TÚI ĐỒ
    // -------------------------------------------------------------
    try {
        var itemRemoved = false;

        // Ưu tiên 1: Xóa trực tiếp trong Xác chết (Corpse mod)
        if (DeathManager && ItemStack) {
            var deaths = DeathManager.getDeaths(player);
            if (deaths && !deaths.isEmpty()) {
                var latestDeath = deaths.get(deaths.size() - 1);
                var validSlots = [];

                // Quét Main Inventory (36 ô)
                var mainInv = latestDeath.getMainInventory();
                if (mainInv) {
                    for (var i = 0; i < mainInv.size(); i++) {
                        var st = mainInv.get(i);
                        if (st && !st.isEmpty()) {
                            validSlots.push({ list: mainInv, index: i, stack: st });
                        }
                    }
                }

                // Quét Trang bị Giáp (4 ô)
                var armorInv = latestDeath.getArmorInventory();
                if (armorInv) {
                    for (var j = 0; j < armorInv.size(); j++) {
                        var stA = armorInv.get(j);
                        if (stA && !stA.isEmpty()) {
                            validSlots.push({ list: armorInv, index: j, stack: stA });
                        }
                    }
                }

                // Quét Tay phụ (1 ô)
                var offInv = latestDeath.getOffHandInventory();
                if (offInv) {
                    for (var k = 0; k < offInv.size(); k++) {
                        var stO = offInv.get(k);
                        if (stO && !stO.isEmpty()) {
                            validSlots.push({ list: offInv, index: k, stack: stO });
                        }
                    }
                }

                // Quét Phụ kiện Curios nếu có
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

                    // Tiêu hủy vật phẩm thành ItemStack.EMPTY
                    rSlot.list.set(rSlot.index, ItemStack.EMPTY);

                    // Đồng bộ lưu lại vào file xác chết trên đĩa
                    DeathManager.addDeath(player, latestDeath);

                    player.tell("§c« [Tiếng nói thế giới]: Vật phẩm §6[" + removedItemName + "]§c trong di hài của bạn đã bị tiêu hủy vĩnh viễn! »");
                    itemRemoved = true;
                }
            }
        }

        // Ưu tiên 2 (Dự phòng): Nếu không có Corpse hoặc chơi keepInventory=true, xóa 1 món trong túi đồ người chơi
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

                player.tell("§c« [Tiếng nói thế giới]: Vật phẩm §6[" + pItemName + "]§c trong túi đồ của bạn đã bị tiêu hủy vĩnh viễn! »");
                itemRemoved = true;
            }
        }

        if (!itemRemoved) {
            player.tell("§7« [Tiếng nói thế giới]: Bạn không có vật phẩm nào trong di hài hoặc túi đồ để tiêu hủy. »");
        }
    } catch (errItem) {
        console.error("[Tensura Death Penalty] Lỗi tiêu hủy vật phẩm: " + errItem);
    }
}
