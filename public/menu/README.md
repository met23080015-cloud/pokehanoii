# Ảnh món (menu images)

Thả ảnh từng món vào đây, đặt tên theo **id** trong `data/menu.json`, rồi set field `image`.

## Cách thêm ảnh cho 1 món
1. Lưu ảnh vào `public/menu/`, ví dụ: `public/menu/poke-salmon.jpg`
2. Mở `data/menu.json`, thêm `"image": "/menu/poke-salmon.jpg"` vào món tương ứng:
   ```json
   { "id": "poke-salmon", "vi": "Cá hồi", ..., "image": "/menu/poke-salmon.jpg" }
   ```
3. Xong — `ItemCard` tự hiển thị thumbnail. Món chưa có ảnh vẫn hiển thị bình thường (không vỡ layout).

## Khuyến nghị
- Tỉ lệ ngang ~4:3, ≥ 400px chiều rộng, < 200KB (nén để load nhanh).
- Định dạng `.jpg` / `.webp`.
- Tên file = id để dễ map (vd `top-edamame.jpg`, `sauce-spicy-mayo.jpg`).

## Nguồn ảnh
- Ảnh thật của quán (Drive folder "ẢNh food") — cần tải về và đặt vào đây, HOẶC
- Ảnh tạo bằng AI (Imagen/Nano Banana) theo style nhất quán.
