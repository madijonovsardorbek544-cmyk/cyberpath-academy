# 8-dars. Loglar: nima yoziladi, qanday oʻqiladi, nimaga eʼtibor beriladi

> Qoralama. Native speaker va mutaxassis tekshiruvi kerak.

**Davomiyligi:** 25 daqiqa oʻqish + 30 daqiqa tergov

## Dars maqsadlari

1. Asosiy log turlarini (autentifikatsiya, veb, tarmoq, DNS, endpoint) va har biri qanday savolga javob berishini bilasiz.
2. Vaqt zonasi va vaqt tartibi nima uchun muhimligini tushuntira olasiz.
3. Turli loglarni umumiy maydon (IP, foydalanuvchi, vaqt) orqali bogʻlay olasiz.
4. Loglardan maʼlumot sizib chiqishi (exfiltration) belgilarini taniy olasiz.

## 1. Log nima?

**Log (jurnal yozuvi)** tizimda nima boʻlganini vaqt bilan qayd qiladigan yozuv. Tergovchi uchun loglar kuzatuv kameralariga oʻxshaydi: ular boʻlmasa, nima boʻlganini faqat taxmin qilasiz.

Yaxshi log qatori besh savolga javob beradi: **qachon? kim? qayerdan? nima qildi? natija qanday?**

## 2. Asosiy log turlari

| Log | Misol | Qanday savolga javob beradi |
| --- | --- | --- |
| Autentifikatsiya | VPN, Windows kirishlari, `auth.log` | Kim, qachon, qayerdan kirdi yoki kira olmadi? |
| Veb-server | nginx, Apache access log | Kim qaysi sahifani soʻradi, javob qanday boʻldi? |
| Tarmoq | Firewall, Zeek `conn.log` | Qaysi qurilma kim bilan qancha maʼlumot almashdi? |
| DNS | Zeek `dns.log` | Qaysi qurilma qaysi domen nomini soʻradi? |
| Endpoint (EDR, Sysmon) | Jarayon yaratildi, fayl yozildi | Kompyuter ichida qaysi dastur nima qildi? |
| Bulut | AWS CloudTrail | Kim qaysi bulut resursini oʻzgartirdi yoki yuklab oldi? |

Bitta log kamdan-kam toʻliq javob beradi. Tergov odatda **bir nechta logni bogʻlash** orqali qilinadi.

## 3. Vaqt: eng koʻp xato qilinadigan joy

- **Vaqt zonasi:** bitta log UTC da, boshqasi Toshkent vaqtida (UTC+5) boʻlsa, voqealar tartibi chalkashadi. Har doim log qaysi zonada ekanini tekshiring. Bu kursdagi loglar UTC da.
- **Vaqt tartibi (timeline):** voqealarni vaqt boʻyicha bitta roʻyxatga yozing. Koʻpincha voqea tartibi sababni koʻrsatadi: "DNS soʻrovi → 5 soniyadan keyin katta ulanish".
- **Odatiy vaqt:** tungi soat 2 da hech kim ishlamaydigan ofisdagi faollik oʻz-oʻzidan shubhali.

## 4. Loglarni bogʻlash

Umumiy maydonlar:
- **IP manzil:** tarmoq logidagi ichki IP → aktivlar roʻyxatidagi kompyuter nomi va egasi.
- **Domen va IP:** DNS logidagi javob IP → tarmoq logidagi manzil.
- **Foydalanuvchi va sessiya:** VPN logidagi sessiya raqami → keyingi harakatlar (6-darsda `7f3a91` sessiyasi).

## 5. Maʼlumot sizib chiqishi belgilari

**Exfiltration** maʼlumotni tashkilotdan tashqariga olib chiqish. Belgilar:
- Ichki qurilmadan **yuborilgan** (sent, `orig_bytes`) hajm qabul qilingandan ancha katta.
- Odatiy boʻlmagan vaqt (tun, dam olish kuni).
- Odatiy boʻlmagan port (masalan, 443 oʻrniga 8443).
- Yangi yoki notanish domen, ayniqsa transferdan bir oz oldin DNS da soʻralgan.
- Bir xil manzilga takroriy katta ulanishlar.

Bitta belgi isbot emas. Bir nechta belgi birga boʻlsa, voqeani jiddiy tekshirish kerak.

## 6. Tergov: "Gigabytes at 2 a.m."

Platformada `night-time-upload` tergovini oching. Tarmoq jamoasi 20-may tunda katta chiquvchi trafikni koʻrgan, ofisda hech kim boʻlmagan.

```
ls
head -2 conn.log
grep -v "^#" conn.log | awk '{print $3, $5, $6, $10}' | sort -k4 -n
grep 203.0.113.80 dns.log
grep 10.20.4.17 asset-inventory.csv
grep 203.0.113.80 conn.log | awk '{print $10}'
```

Savollar:
1. `conn.log` dagi qaysi maydon ichki qurilma **yuborgan** baytlarni koʻrsatadi?
2. Qaysi ichki IP katta hajmda maʼlumot yuborgan, qaysi manzil va portga?
3. Transferdan oldin bu qurilma qaysi domen nomini soʻragan?
4. Bu qurilma kimga tegishli va qaysi boʻlimda?
5. Jami nechta bayt yuborilgan? Taxminan necha megabayt? (1 MB ≈ 1 048 576 bayt)
6. Voqealar tartibini (timeline) 4–5 qatorda yozing.

**Yozma topshiriq:** rahbaringiz uchun qisqa hisobot (8–10 gap): nima boʻldi, qachon, qaysi qurilma, qancha maʼlumot, qanday dalil, keyingi 3 qadam.

## 7. Bilimni tekshirish

1. Yaxshi log qatori qaysi savollarga javob beradi?
   - a) Faqat qachon b) **Qachon, kim, qayerdan, nima qildi, natija** c) Faqat IP manzil
2. Qaysi log "qaysi kompyuter qaysi domen nomini soʻradi?" savoliga javob beradi?
   - a) Veb-server logi b) **DNS logi** c) Autentifikatsiya logi
3. Bir log UTC da, ikkinchisi UTC+5 da. Nima qilish kerak?
   - a) Eʼtibor bermaslik b) **Hammasini bitta vaqt zonasiga keltirib, keyin taqqoslash** c) Faqat bitta logdan foydalanish
4. Ichki IP ni kompyuter nomi va egasiga qanday bogʻlaysiz?
   - a) DNS logi orqali b) **Aktivlar roʻyxati (asset inventory) orqali** c) Bogʻlab boʻlmaydi
5. Qaysi belgi exfiltration ga eng koʻp ishora qiladi?
   - a) Kunduzi kichik soʻrovlar b) **Tunda notanish manzilga takroriy katta yuborishlar** c) Sahifa ochilishi
6. `orig_bytes` 200 MB, `resp_bytes` 20 KB. Bu nimani bildiradi?
   - a) Qurilma koʻp yuklab olgan b) **Qurilma koʻp maʼlumot yuborgan** c) Ulanish muvaffaqiyatsiz
7. Toʻgʻri yoki notoʻgʻri: bitta shubhali belgi har doim hujum borligini isbotlaydi. **Notoʻgʻri.**
8. Tergovda voqealarni vaqt boʻyicha bitta roʻyxatga yozish nima deyiladi?
   - a) Backup b) **Timeline (vaqt chizigʻi)** c) Firewall

## 8. Xulosa

- Har bir log turi oʻz savoliga javob beradi. Tergov loglarni bogʻlashdan iborat.
- Vaqt zonasini tekshiring va timeline tuzing.
- Exfiltration belgilari: katta yuborish, gʻalati vaqt, gʻalati port, notanish domen.

## Qoʻshimcha manbalar

- Zeek hujjatlari: `conn.log` maydonlari (inglizcha). https://docs.zeek.org/en/master/logs/conn.html
- NIST SP 800-92 "Guide to Computer Security Log Management" (inglizcha). https://csrc.nist.gov/pubs/sp/800/92/final
