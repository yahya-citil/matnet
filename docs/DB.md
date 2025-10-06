MatematikNET — Veritabanı Tasarımı (PostgreSQL)

Özet
- Amaç: Öğrenci/öğretmen rolleriyle konu, ödev ve net takibini tutmak.
- Tercih: PostgreSQL. UUID ve enum kullanıldı. Tüm FKs CASCADE.
- Kaynak dosyalar: `db/schema.sql`, `db/seed.sql`.

Ana Tablolar
- `users`: `role` = `student|teacher`. `email` benzersiz.
- `teacher_students`: Öğretmen–öğrenci eşlemesi.
- `topics`: Konu tanımları, `created_by` öğretmen.
- `topic_progress`: Öğrencinin konu ilerlemesi (0–100), PK=(student_id,topic_id).
- `assignments`: Ödev tanımları, `created_by` öğretmen.
- `assignment_assignees`: Ödeve özel öğrenci hedefleri. Kayıt yoksa “tüm öğrenciler” kuralı geçerli.
- `assignment_status`: Öğrencinin ödev durumu (`pending|done`).
- `exam_attempts`: Öğrencinin deneme kayıtları (tarih, başlık, mat_net, total_net, süre).

Görünüm
- `v_student_assignments`: Öğrencinin göreceği tüm ödevler (özel atanmış + atanması olmayanların öğretmenindekiler) ve mevcut durumları.

Örnek Sorgular
```
-- Öğrencinin göreceği ödevler
SELECT * FROM v_student_assignments WHERE student_id = $1 ORDER BY due_date NULLS LAST;

-- Öğretmenin öğrencileri
SELECT u.* FROM teacher_students ts JOIN users u ON u.id = ts.student_id WHERE ts.teacher_id = $1;

-- Öğrencinin konu ilerlemeleri
SELECT t.name, tp.progress FROM topics t
LEFT JOIN topic_progress tp ON tp.topic_id=t.id AND tp.student_id=$1
WHERE t.created_by = $teacherId ORDER BY t.name;

-- Öğrencinin denemeleri (son 10)
SELECT * FROM exam_attempts WHERE student_id=$1 ORDER BY taken_at DESC LIMIT 10;
```

API Taslak (öneri)
- Auth sonrası `user.id`, `user.role` alınır (JWT). 
- Öğrenci uçları: 
  - `GET /me/assignments` → `v_student_assignments`
  - `PATCH /me/assignments/:id` body `{status}` → `assignment_status` upsert
  - `GET /me/topics` → teacher scope + progress
  - `PUT /me/topics/:topicId/progress` → upsert `topic_progress`
  - `GET /me/exams`, `POST /me/exams`, `DELETE /me/exams/:id`
- Öğretmen uçları:
  - `GET/POST/DELETE /teacher/topics`
  - `GET/POST/DELETE /teacher/assignments`
  - `POST /teacher/assignments/:id/assignees` body `{studentIds: []}`
  - `GET /teacher/students`

Kurulum
1) PostgreSQL oluşturun ve bağlantı verin.
2) Şema: `psql < db/schema.sql`
3) Seed (opsiyonel): `psql < db/seed.sql`

Notlar
- Roller için RLS (Row Level Security) eklenebilir; şimdilik şema odaklıdır.
- `mat_net` ve `total_net` aralıkları esnek tutuldu; ihtiyaçta CHECK aralıkları daraltılabilir.

