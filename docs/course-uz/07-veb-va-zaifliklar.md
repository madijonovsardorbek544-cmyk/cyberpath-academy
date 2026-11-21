# 7-dars. Veb qanday ishlaydi va keng tarqalgan zaifliklar

> Qoralama. Native speaker va mutaxassis tekshiruvi kerak.

**Davomiyligi:** 30 daqiqa oʻqish + 25 daqiqa tergov

## Dars maqsadlari

1. Veb-ilovaning uch qismini (brauzer, server, maʼlumotlar bazasi) va ular orasidagi ishonch chegarasini tushuntira olasiz.
2. OWASP Top 10 roʻyxati nima ekanini va undagi bir necha xavfni oddiy tilda tushuntira olasiz.
3. SQL injection va XSS qanday paydo boʻlishini va ularning **himoyasini** bilasiz.
4. Veb-server logida hujum urinishining belgilarini taniy olasiz.

Bu dars faqat himoya nuqtai nazaridan: zaiflik qanday paydo boʻladi, logda qanday koʻrinadi va dasturchi uni qanday oldini oladi. Hujum qilishni oʻrgatmaymiz.

## 1. Veb-ilova qanday tuzilgan?

1. **Brauzer (mijoz):** foydalanuvchi koʻradigan qism. Uni foydalanuvchi toʻliq boshqaradi.
2. **Server:** soʻrovlarni qabul qiladi, qoidalarni tekshiradi, maʼlumot qaytaradi.
3. **Maʼlumotlar bazasi:** foydalanuvchilar, buyurtmalar, baholar saqlanadi.

Eng muhim qoida: **brauzerdan kelgan hamma narsaga shubha bilan qarang.** Foydalanuvchi forma maydoniga, URL parametriga yoki cookie ga istalgan narsani yozishi mumkin. Brauzerdagi tekshiruv (masalan, "faqat raqam kiriting") qulaylik uchun, xavfsizlik uchun emas. Haqiqiy tekshiruv **serverda** boʻlishi kerak.

## 2. OWASP Top 10

**OWASP** veb-xavfsizlik boʻyicha xalqaro notijorat hamjamiyat. U vaqti-vaqti bilan veb-ilovalardagi eng muhim 10 ta xavf roʻyxatini chiqaradi (eng soʻnggisi OWASP Top 10:2025). Bir nechtasi:

- **Broken Access Control (buzilgan kirish nazorati):** talaba boshqa talabaning bahosini URL dagi raqamni oʻzgartirib koʻra oladi. Roʻyxatda birinchi oʻrinda.
- **Injection (inʼeksiya):** foydalanuvchi kiritgan matn buyruq yoki soʻrov sifatida bajariladi. SQL injection shu turga kiradi.
- **Security Misconfiguration (notoʻgʻri sozlash):** standart parollar, ochiq qolgan admin panel, xatolarning toʻliq matni foydalanuvchiga koʻrsatiladi.
- **Authentication Failures:** zaif parollarga ruxsat, cheksiz login urinishlari, MFA yoʻqligi (2-dars).

## 3. SQL injection: qanday paydo boʻladi?

Doʻkon sayti mahsulotni shunday qidiradi:

```
/products.php?id=12
```

Agar dasturchi soʻrovni **matnlarni qoʻshib** yasasa:

```
"SELECT * FROM products WHERE id = " + id
```

foydalanuvchi `id` oʻrniga raqam emas, SQL ning boʻlagini yuborishi mumkin. Shunda maʼlumotlar bazasi uni buyruqning bir qismi deb bajaradi va masalan, boshqa jadvaldagi foydalanuvchilar maʼlumotini qaytaradi.

**Himoya:**
- **Parametrlangan soʻrovlar (prepared statements):** soʻrov va maʼlumot alohida yuboriladi: `SELECT * FROM products WHERE id = ?`. Maʼlumot hech qachon buyruq boʻlib qolmaydi. Bu asosiy himoya.
- Kiritilgan qiymatni turi boʻyicha tekshirish (`id` faqat raqam boʻlishi kerak).
- Maʼlumotlar bazasi foydalanuvchisiga eng kam imtiyoz (5-dars).
- Foydalanuvchiga xatoning toʻliq matnini koʻrsatmaslik.

## 4. XSS: brauzerda begona kod

**Cross-Site Scripting (XSS)** sayt foydalanuvchi kiritgan matnni tozalamasdan sahifaga qoʻyganda paydo boʻladi. Masalan, izoh maydoniga yozilgan matn oddiy matn emas, brauzer bajaradigan skript sifatida chiqadi va boshqa foydalanuvchilarning brauzerida ishlaydi.

**Himoya:** chiqishni kodlash (output encoding: `<` belgisi `&lt;` boʻlib chiqadi), React kabi xavfsiz shablonlardan foydalanish, Content Security Policy (CSP) sarlavhasi.

## 5. Logda hujum urinishi qanday koʻrinadi?

- Bitta IP dan qisqa vaqtda koʻp soʻrov.
- Parametrlarda gʻalati belgilar: `'`, `"`, `--`, `UNION`, `SELECT`, `<script>`.
- Koʻp `500` (server xatosi) javoblari: server kutilmagan kiritishdan "qoqilmoqda".
- User-Agent maydonida avtomatik vositalar nomi.
- **Eng muhim belgi:** gʻalati soʻrovga javob hajmi (bytes) birdan katta boʻlsa. Bu maʼlumot chiqib ketganini bildirishi mumkin.

## 6. Tergov: "Errors on the products page"

Platformada `products-page-sqli` tergovini oching. Dasturchi "bu shunchaki bot, eʼtibor bermang" demoqda. Siz access log ni tekshirasiz.

```
grep -c sqlmap nginx-access.log
grep -v sqlmap nginx-access.log | wc -l
awk '{print $9}' nginx-access.log | sort | uniq -c
grep -i union nginx-access.log | awk '{print $1, $9, $10}'
```

Savollar:
1. Avtomatik vosita bilan nechta soʻrov yuborilgan va qaysi IP dan?
2. Qaysi soʻrovlar `500` qaytargan? Bu nimani koʻrsatadi?
3. `UNION` bor soʻrovga javob hajmi (10-maydon) oddiy sahifa hajmi (4120) bilan solishtirganda qanday? Bu nimani anglatishi mumkin?
4. "Shunchaki bot" degan fikrga qoʻshilasizmi? Dalil bilan javob bering.

**Yozma topshiriq:** dasturchiga 6–8 gapli xabar yozing: nima boʻlgani, dalil, xavf darajasi va ikkita himoya chorasi (biri kodda, biri jarayonda, masalan parollarni almashtirish).

## 7. Bilimni tekshirish

1. Brauzerdagi forma tekshiruvi (masalan "faqat raqam") nima uchun yetarli emas?
   - a) U sekin ishlaydi b) **Foydalanuvchi brauzerni chetlab, serverga istalgan soʻrov yubora oladi** c) U faqat Chrome da ishlaydi
2. OWASP Top 10:2025 da birinchi oʻrindagi xavf qaysi?
   - a) Injection b) **Broken Access Control** c) XSS
3. SQL injection ning asosiy himoyasi qaysi?
   - a) Saytni HTTPS ga oʻtkazish b) **Parametrlangan soʻrovlar (prepared statements)** c) Parolni uzunroq qilish
4. Talaba URL dagi `student_id=105` ni `106` ga oʻzgartirib, boshqa talabaning bahosini koʻrdi. Bu qaysi xavf?
   - a) XSS b) **Broken Access Control** c) DNS xatosi
5. XSS ning himoyalaridan biri qaysi?
   - a) **Chiqishni kodlash (output encoding) va CSP** b) Serverni qayta yuklash c) Portni yopish
6. Logda gʻalati parametrli soʻrovga javob hajmi oddiy sahifadan 20 barobar katta. Bu nimaning belgisi boʻlishi mumkin?
   - a) Sayt tezlashgan b) **Maʼlumot chiqib ketgan boʻlishi mumkin** c) Rasm yuklangan
7. Toʻgʻri yoki notoʻgʻri: xatoning toʻliq matnini (stack trace) foydalanuvchiga koʻrsatish xavfsiz, chunki u faqat texnik maʼlumot. **Notoʻgʻri.**
8. Zaiflikni topgan himoyachining birinchi ishi qaysi?
   - a) Ijtimoiy tarmoqda eʼlon qilish b) **Masʼul jamoaga dalil bilan xabar berish** c) Boshqa saytlarda ham sinab koʻrish

## 8. Xulosa

- Brauzerdan kelgan maʼlumotga ishonmang. Tekshiruv serverda boʻlsin.
- OWASP Top 10 eng muhim veb-xavflar roʻyxati. Birinchi oʻrinda kirish nazorati.
- SQL injection ga qarshi parametrlangan soʻrovlar, XSS ga qarshi chiqishni kodlash va CSP.
- Logda: gʻalati belgilar, koʻp `500`, avtomatik vositalar va katta javob hajmi.

## Qoʻshimcha manbalar

- OWASP Top 10:2025 (inglizcha). https://owasp.org/Top10/2025/
- OWASP Cheat Sheet Series: SQL Injection Prevention (inglizcha). https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
