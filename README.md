# ⚔️ Tensura Evolutions - Death & Revive Penalty System

Hệ thống cơ chế sinh tử và hình phạt tử vong tùy chỉnh 100% tự động dành cho Modpack **Tensura Evolutions** (Minecraft 1.21.1 NeoForge).

---

## 🌟 Tổng quan cơ chế hoạt động (Gameplay Mechanics)

### 1. Khi Cạn Máu (Gục ngã / Knocked Out):
* Người chơi **không chết ngay** mà rơi vào trạng thái nằm gục trên mặt đất.
* Xuất hiện thanh đếm ngược **120 giây** (hoặc tùy chỉnh).
* **Đồng đội cứu:** Chạy lại gần, giữ nút **Sneak (Shift) + Chuột phải** để cứu.
* **Hồi sinh tại chỗ:** Người chơi đứng dậy ngay tại chỗ với **đúng 1 HP (nửa trái tim)**.  
  *(Không mất đồ, không mất EP, không mất Skill).*

### 2. Khi KHÔNG ĐƯỢC CỨU (Hết thời gian hoặc bấm *"Accept Fate"*):
Người chơi chính thức tử nạn và hồi sinh về điểm đặt giường/spawn, đồng thời tự động kích hoạt **3 Hình Phạt Nghiêm Khắc**:
1. 🔻 **Mất 30% EP (Magicule & Aura):** Hệ thống Tensura tự động cắt giảm 30% tổng EP của người chơi.
2. 🔻 **Mất 1 Kỹ năng Độc nhất (Unique Skill) ngẫu nhiên:** Hệ thống tự động quét kho kỹ năng linh hồn, chọn ngẫu nhiên 1 Unique Skill và phá hủy nó vĩnh viễn kèm thông báo *« Tiếng nói thế giới »*.
3. 🔻 **Mất 1 Vật phẩm ngẫu nhiên:** Hệ thống tự động xóa 1 món đồ ngẫu nhiên bên trong **Xác chết (Corpse)** tại vị trí tử trận trước khi người chơi kịp quay lại nhặt.

---

## 📂 Cấu trúc thư mục (Repository Structure)

```text
├── config/
│   └── hardcorerevival-common.toml      # File cấu hình mod Hardcore Revival (1 HP, 120s timer)
├── kubejs/
│   └── server_scripts/
│       └── tensura_death_penalty.js     # Script KubeJS tự động xóa 1 Unique Skill & 1 Item trong xác
├── mods/
│   ├── hardcorerevival-neoforge-1.21.1-21.1.22.jar  # Mod cơ chế gục ngã và đếm giờ cứu
│   ├── kubejs-neoforge-2101.7.2-build.377.jar        # Động cơ tự động hóa KubeJS
│   └── rhino-2101.2.8-build.91.jar                   # Thư viện JavaScript cho KubeJS
└── README.md
```

---

## 🚀 Hướng dẫn cài đặt lên Server (Server Installation)

Dành cho Admin / Quản trị viên máy chủ (áp dụng cho Server Pikamc hoặc VPS):

1. **Tải các file lên Server:**
   * Copy toàn bộ các file trong thư mục `mods/` vào thư mục `mods/` của Server.
   * Copy file `config/hardcorerevival-common.toml` vào thư mục `config/` của Server.
   * Copy file `kubejs/server_scripts/tensura_death_penalty.js` vào thư mục `kubejs/server_scripts/` của Server (nếu chưa có thư mục thì tạo mới).

2. **Bật lệnh Gamerule trên Server:**
   Chạy lệnh sau trên bảng điều khiển Console Server (hoặc trong game với quyền OP):
   ```mcfunction
   /gamerule epDeathPenalty 30
   ```

3. **Khởi động lại Server** để các mod và script bắt đầu hoạt động.

---

## 💻 Hướng dẫn cho Người chơi (Client Installation)

Người chơi tham gia vào Server chỉ cần:
* Đảm bảo trong thư mục `mods/` trên máy tính cá nhân đã có file:
  * `hardcorerevival-neoforge-1.21.1-21.1.22.jar`
  *(File này giúp hiển thị giao diện thanh đếm giờ và phím bấm cứu đồng đội).*
