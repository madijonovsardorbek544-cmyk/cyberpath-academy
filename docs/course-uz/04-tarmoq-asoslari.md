# 4-dars. Tarmoq asoslari: IP, port, DNS, HTTP va HTTPS

> Qoralama. Native speaker va mutaxassis tekshiruvi kerak.

**Davomiyligi:** 30 daqiqa oʻqish + 20 daqiqa terminal mashqi

## Dars maqsadlari

1. Brauzerga manzil yozganingizdan sahifa ochilguncha nima boʻlishini bosqichma-bosqich tushuntira olasiz.
2. IP manzil, port, DNS va protokol tushunchalarini farqlay olasiz.
3. HTTP soʻrovi, metodlar (GET, POST) va javob kodlarini (200, 302, 404, 500) oʻqiy olasiz.
4. HTTPS nimani himoya qilishini va nimani himoya qilmasligini bilasiz.
5. Veb-server logidan IP manzillar va javob kodlarini ajratib ola olasiz.

## 1. `my.gov.uz` ni ochganingizda nima boʻladi?

Siz telefoningizda `https://my.gov.uz` yozdingiz. Bir soniyadan kam vaqt ichida quyidagilar sodir boʻladi:

1. **DNS soʻrovi.** Kompyuterlar nomlarni emas, raqamlarni tushunadi. Telefon DNS serveridan soʻraydi: "`my.gov.uz` ning IP manzili qanday?" DNS telefon kitobiga oʻxshaydi: ism → raqam.
2. **Ulanish.** Telefon shu IP manzilning **443-portiga** ulanadi.
3. **TLS qoʻl siqishuvi.** Telefon va server shifrlash kalitlarini kelishadi, server oʻz sertifikatini koʻrsatadi. Brauzer sertifikat haqiqatan `my.gov.uz` uchun berilganini tekshiradi.
4. **HTTP soʻrovi.** Brauzer shifrlangan kanal orqali soʻraydi: `GET / HTTP/1.1`.
5. **Javob.** Server `200 OK` va sahifa kodini qaytaradi. Brauzer uni chizadi.

Har bir bosqichda nimadir notoʻgʻri ketishi mumkin. Xavfsizlik mutaxassisi aynan shu bosqichlarni tushunib, muammoni qayerda ekanini topadi.

## 2. IP manzil

**IP manzil** tarmoqdagi qurilmaning manzili. IPv4 koʻrinishi: `192.168.1.10` (0–255 oraligʻidagi 4 ta son).

- **Xususiy (private) manzillar:** `10.x.x.x`, `172.16–31.x.x`, `192.168.x.x`. Uy yoki ofis ichida ishlatiladi, internetdan toʻgʻridan-toʻgʻri koʻrinmaydi.
- **Ommaviy (public) manzillar:** internetdagi manzillar. Uyingizdagi barcha qurilmalar internetga odatda routerning **bitta** ommaviy manzili orqali chiqadi (NAT).
- **IPv6:** yangi, uzunroq format, masalan `2001:db8::1`.

Logda IP manzil koʻrsangiz, avval soʻrang: bu ichki manzilmi yoki tashqi? Ichki manzildan kelgan gʻalati harakat va tashqi manzildan kelgan harakat turli xil tekshiriladi.

## 3. Port va protokol

Agar IP manzil binoning manzili boʻlsa, **port** xonaning raqami. Bitta serverda bir nechta xizmat turli portlarda ishlaydi:

| Port | Xizmat | Izoh |
| --- | --- | --- |
| 53 | DNS | Nomlarni IP ga aylantiradi |
| 80 | HTTP | Shifrlanmagan veb |
| 443 | HTTPS | Shifrlangan veb |
| 22 | SSH | Serverlarni masofadan boshqarish |
| 3389 | RDP | Windows masofaviy ish stoli |

Himoya qoidasi: **kerak boʻlmagan port yopiq boʻlishi kerak.** Internetga ochiq RDP (3389) yoki maʼlumotlar bazasi porti eng koʻp hujumga uchraydigan joylardan biri. Buni **firewall** (tarmoq devori) nazorat qiladi.

## 4. HTTP soʻrovi va javob kodlari

HTTP soʻrovining birinchi qatori: **metod**, **yoʻl** va **versiya**.

```
GET /products.php?id=12 HTTP/1.1
```

- **GET:** maʼlumot olish (sahifani ochish).
- **POST:** maʼlumot yuborish (login formasi, toʻlov).
- `?id=12` bu **parametr**: foydalanuvchi yuboradigan qiymat. Hujumlarning katta qismi aynan parametrlarga gʻalati qiymatlar yuborishdan boshlanadi (7-darsda koʻramiz).

Javob kodlari:
- **2xx muvaffaqiyat:** `200 OK`.
- **3xx yoʻnaltirish:** `302 Found` (masalan, logindan keyin boshqa sahifaga).
- **4xx mijoz xatosi:** `401` (kirish kerak), `403` (ruxsat yoʻq), `404` (topilmadi), `429` (soʻrovlar juda koʻp).
- **5xx server xatosi:** `500` (serverda nimadir buzildi).

Logda bitta IP manzildan qisqa vaqt ichida koʻp `404` yoki `500` kelsa, bu kimdir saytni "paypaslab" koʻrayotganining belgisi boʻlishi mumkin.

## 5. HTTPS: nimani himoya qiladi, nimani yoʻq

HTTPS (HTTP + TLS) **yoʻldagi** maʼlumotni himoya qiladi:
- Kafedagi Wi-Fi da oʻtirgan odam parolingizni koʻra olmaydi.
- Maʼlumot yoʻlda oʻzgartirilmaydi.
- Sertifikat siz haqiqatan shu domenga ulanganingizni tasdiqlaydi.

HTTPS **himoya qilmaydi**:
- Saytning oʻzi firibgarniki boʻlsa. `my-gov-uz.login-check.top` da ham qulf belgisi boʻlishi mumkin. Qulf "sayt xavfsiz" degani emas, "ulanish shifrlangan" degani.
- Server buzilgan boʻlsa yoki saytda zaiflik boʻlsa.

## 6. Amaliy mashq: veb-server logini oʻqish

Platformada **Investigations** boʻlimidan `products-page-sqli` tergovini oching va **Evidence terminal** ga kiring. Bu brauzerda ishlaydigan, faqat oʻqish uchun moʻljallangan terminal. U hech qanday real tizimga ulanmaydi.

Quyidagi buyruqlarni bajaring va natijani yozib oling:

```
ls
head -3 nginx-access.log
cut -d " " -f1 nginx-access.log | sort | uniq -c
cut -d " " -f9 nginx-access.log | sort | uniq -c
grep " 500 " nginx-access.log | wc -l
```

Savollar:
1. Har bir qatordagi birinchi maydon nima? Toʻqqizinchi maydon-chi?
2. Logda nechta turli IP manzil bor? Qaysi biri eng koʻp soʻrov yuborgan?
3. Qaysi javob kodlari bor va ulardan nechtasi `500`?
4. `500` xatolar qaysi IP manzildan kelgan? Shu IP ning soʻrovlarida "User-Agent" maydonida nima yozilgan?

Bu darsda faqat maʼlumotni oʻqiymiz. Bu soʻrovlar nimani anglatishini 7-darsda tahlil qilamiz.

## 7. Bilimni tekshirish

1. DNS nima qiladi?
   - a) Maʼlumotni shifrlaydi b) **Domen nomini IP manzilga aylantiradi** c) Saytni viruslardan himoya qiladi
2. `192.168.1.25` qanday manzil?
   - a) Ommaviy b) **Xususiy (ichki tarmoq)** c) IPv6
3. HTTPS odatda qaysi portda ishlaydi?
   - a) 80 b) 22 c) **443**
4. Login formasi parolni serverga yuborganda odatda qaysi metod ishlatiladi?
   - a) GET b) **POST** c) DELETE
5. `403` javob kodi nimani bildiradi?
   - a) Sahifa topilmadi b) **Ruxsat yoʻq** c) Server ishlamayapti
6. Saytda qulf belgisi bor. Bu nimani kafolatlaydi?
   - a) Sayt firibgarniki emas b) **Brauzer va server orasidagi ulanish shifrlangan** c) Saytda zaiflik yoʻq
7. Internetga ochiq qaysi port eng jiddiy xavf tugʻdiradi va odatda yopiq boʻlishi kerak?
   - a) 443 b) **3389 (RDP)** c) 80 dan 443 ga yoʻnaltirish
8. Logda bitta tashqi IP 30 soniyada 200 ta turli sahifaga soʻrov yuborgan, koʻpi `404`. Bu nimaning belgisi boʻlishi mumkin?
   - a) Oddiy foydalanuvchi b) **Avtomatlashtirilgan skanerlash** c) DNS xatosi

## 8. Xulosa

- DNS → ulanish → TLS → HTTP soʻrovi → javob. Har bir bosqich xavfsizlik nuqtai nazaridan muhim.
- IP manzil kim, port qaysi xizmat. Kerak boʻlmagan portlarni yoping.
- Javob kodlari (2xx, 3xx, 4xx, 5xx) logdagi eng foydali maʼlumotlardan biri.
- HTTPS yoʻlni himoya qiladi, lekin saytning halolligini kafolatlamaydi.

## Qoʻshimcha manbalar

- MDN Web Docs, "An overview of HTTP" (inglizcha, rus tilida ham bor). https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview
- Cloudflare Learning Center, "What is DNS?" (inglizcha). https://www.cloudflare.com/learning/dns/what-is-dns/
