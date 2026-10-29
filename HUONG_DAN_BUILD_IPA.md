# 📱 HƯỚNG DẪN TỪNG BƯỚC TẠO REPOSITORY GITHUB & BUILD FILE .IPA TRÊN WINDOWS

Bạn đang sử dụng máy tính **Windows** (không cần máy Mac hay Xcode). Toàn bộ công đoạn biên dịch iOS 16.2 sẽ do máy chủ macOS của **GitHub Actions** thực hiện tự động.

---

## BƯỚC 1: GIẢI NÉN FILE `DiceGame-iOS.zip` TRÊN WINDOWS
1. Nhấn nút **"TẢI FILE DiceGame-iOS.zip NGAY"** trong ứng dụng.
2. Nhấp chuột phải vào file `DiceGame-iOS.zip` vừa tải về -> chọn **Extract All...** (hoặc Giải nén bằng WinRAR / 7-Zip) ra một thư mục, ví dụ `D:\DiceGame-iOS`.
3. Mở thư mục vừa giải nén, hãy chắc chắn bạn nhìn thấy thư mục `.github`, `scripts`, `www`, `package.json`, `capacitor.config.json`.
   - *Lưu ý*: Trên Windows Explorer, hãy tích chọn **View -> Show -> Hidden items** để nhìn thấy thư mục có dấu chấm ở đầu là `.github`.

---

## BƯỚC 2: TẠO REPOSITORY TRÊN GITHUB & UPLOAD MÃ NGUỒN
1. Truy cập [https://github.com](https://github.com) và đăng nhập tài khoản của bạn.
2. Nhấn nút dấu cộng **(+)** ở góc phải trên cùng -> chọn **New repository**.
3. Đặt tên Repository: `DiceGame-iOS`, chọn chế độ **Public** (để sử dụng GitHub Actions macOS miễn phí không giới hạn), tích chọn **Add a README file**, rồi nhấn **Create repository**.
4. Trong trang Repository vừa tạo, nhấn nút **Add file** -> **Upload files**.
5. Kéo thả **toàn bộ các thư mục và file bên trong thư mục giải nén** (`.github`, `scripts`, `www`, `package.json`, `capacitor.config.json`, `HUONG_DAN_BUILD_IPA.md`, `README.md`) vào khung upload của GitHub.
6. Đợi tải lên hoàn tất 100%, kéo xuống dưới và nhấn nút màu xanh **Commit changes**.

---

## BƯỚC 3: KIỂM TRA & CHẠY WORKFLOW BUILD .IPA
1. Nhấn vào tab **Actions** trên thanh menu ngang của Repository GitHub.
2. Ở cột bên trái, nhấn vào workflow **"Build iOS Unsigned IPA (iOS 16.2)"**.
3. Nếu workflow chưa tự chạy hoặc bạn muốn chạy lại ngay, hãy nhấn nút **Run workflow** (bên phải) -> nhấn nút xanh **Run workflow**.
4. Quá trình build sẽ diễn ra trong khoảng **3 đến 5 phút**.
   - 🟢 **Dấu tích xanh (Success)**: Đã biên dịch Xcode và đóng gói `.ipa` thành công!
   - 🔴 **Dấu X đỏ (Failed)**: Nhấn trực tiếp vào dòng chữ màu đỏ -> nhấn vào mục `Compile Capacitor iOS 16.2 & Package IPA` để đọc log chi tiết ở bước bị dừng.

---

## BƯỚC 4: TẢI FILE .IPA VỀ MÁY WINDOWS & CÀI LÊN IPHONE (iOS 16.2)
1. Khi lượt chạy hiện **Dấu tích xanh 🟢**, nhấn vào lượt chạy đó.
2. Kéo xuống cuối trang đến mục **Artifacts**, bạn sẽ thấy gói **`HoangGiaVIP-iOS16.2-IPA`**.
3. Nhấn vào **`HoangGiaVIP-iOS16.2-IPA`** để tải về máy Windows.
4. Giải nén file ZIP tải từ Artifacts ra, bên trong chính là file **`HoangGiaVIP-iOS16.2-unsigned.ipa`**.
5. **Cách cài đặt lên iPhone chạy iOS 16.2**:
   - **Cách 1 (TrollStore - Khuyên dùng cho iOS 16.2)**: Gửi file `HoangGiaVIP-iOS16.2-unsigned.ipa` qua Telegram / iCloud Drive / AirDrop vào iPhone -> Mở bằng **TrollStore** -> Nhấn **Install** (Vĩnh viễn không bị thu hồi chứng chỉ).
   - **Cách 2 (Sideloadly / AltStore trên Windows)**: Cắm cáp iPhone vào máy tính Windows -> Mở phần mềm **Sideloadly** -> Kéo file `HoangGiaVIP-iOS16.2-unsigned.ipa` vào -> Nhập Apple ID của bạn và nhấn **Start** để ký và cài đặt trực tiếp vào iPhone.
