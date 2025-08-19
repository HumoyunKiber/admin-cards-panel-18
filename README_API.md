# SimCard Management System

Bu dastur simkarta boshqaruvi tizimi bo'lib, ikkita API serverdan iborat:

## API Serverlari

### 1. Asosiy API Server (malin.py - Port 9022)
Barcha asosiy funksiyalar uchun:
- Magazinlar boshqaruvi (CRUD)
- Simkartalar boshqaruvi (CRUD)
- Foydalanuvchi autentifikatsiyasi
- Statistika va hisobotlar
- Simkartalarni magazinlarga tayinlash

### 2. Simkarta Holati API Server (simcard_status_api.py - Port 9020)
Simkarta holatini tekshirish uchun:
- Simkarta holatini tekshirish
- Avtomatik tekshirish uchun bulk endpoint-lar

## O'rnatish va Ishga Tushirish

### 1. Zarur kutubxonalarni o'rnating:
```bash
pip install fastapi uvicorn
```

### 2. API serverlarni ishga tushiring:

**Terminal 1** - Asosiy API (Port 9022):
```bash
python malin.py
```

**Terminal 2** - Simkarta Holati API (Port 9020):
```bash
python simcard_status_api.py
```

### 3. Frontend dasturni ishga tushiring:
```bash
npm install
npm run dev
```

## Test Ma'lumotlari

Dastur faqat bitta admin foydalanuvchi bilan boshlanadi:
- **Username**: admin
- **Password**: admin123

Boshqa barcha ma'lumotlar (magazinlar, simkartalar) dastur orqali qo'shiladi.

## API Endpoint-lari

### Asosiy API (Port 9022)

#### Autentifikatsiya
- `POST /auth/login` - Tizimga kirish
- `POST /auth/logout` - Tizimdan chiqish

#### Magazinlar
- `GET /shops` - Barcha magazinlarni olish
- `POST /shops` - Yangi magazin qo'shish
- `PUT /shops/{shop_id}` - Magazin ma'lumotlarini yangilash
- `DELETE /shops/{shop_id}` - Magazinni o'chirish
- `GET /shops/{shop_id}/stats` - Magazin statistikasi

#### Simkartalar
- `GET /simcards` - Barcha simkartalarni olish
- `POST /simcards` - Yangi simkarta qo'shish
- `PUT /simcards/{simcard_id}` - Simkarta ma'lumotlarini yangilash
- `DELETE /simcards/{simcard_id}` - Simkartani o'chirish
- `POST /simcards/assign` - Simkartalarni magazinga tayinlash
- `POST /simcards/auto-check` - Avtomatik tekshirish

#### Statistika
- `GET /statistics` - Umumiy statistika
- `GET /statistics/shops` - Magazinlar bo'yicha statistika

### Simkarta Holati API (Port 9020)

- `POST /check-simcard-status` - Simkarta holatini tekshirish
- `GET /bulk-check-simcards/{code}` - Bulk tekshirish

## Ma'lumotlar Bazasi

SQLite bazasi (`simcard_db.sqlite`) avtomatik yaratiladi va quyidagi jadvallardan iborat:

1. **users** - Foydalanuvchilar
2. **shops** - Magazinlar
3. **simcards** - Simkartalar

## Frontend Xususiyatlari

- React + TypeScript
- Tailwind CSS dizayni
- Supabase integratsiyasi
- Avtomatik simkarta holati tekshirish (har 5 daqiqada)
- Real-time ma'lumotlar yangilanishi
- Responsive dizayn

## Test Qilish

1. Dasturni ishga tushiring
2. Admin hisobi bilan kiring (admin/admin123)  
3. Yangi magazin qo'shing
4. Simkartalar qo'shing
5. Simkartalarni magazinga tayinlang
6. Simkarta holatini tekshiring
7. Statistikani ko'ring

## Xato Tuzatish

Agar xatolik yuz bersa:
1. Ikkala API server ham ishlab turganini tekshiring
2. Port 9020 va 9022 band emasligini tekshiring
3. SQLite bazasi yaratilganini tekshiring
4. Console loglarni tekshiring