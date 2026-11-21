# 6-dars. Terminal bilan ishlash: qidirish, sanash va filtrlash

> Qoralama. Native speaker va mutaxassis tekshiruvi kerak.

**Davomiyligi:** 25 daqiqa oʻqish + 30 daqiqa terminal mashqi

## Dars maqsadlari

1. `grep` bilan katta fayldan kerakli qatorlarni topa olasiz.
2. `|` (pipe) yordamida buyruqlarni zanjir qilib ulay olasiz.
3. `cut`, `awk`, `sort`, `uniq -c` bilan maydonlarni ajratib, sanab chiqa olasiz.
4. Bir necha buyruq bilan "kim, qachon, qayerdan, necha marta" savollariga javob topa olasiz.

## 1. Nima uchun terminal?

Haqiqiy tizimlarda loglar minglab, hatto millionlab qatordan iborat boʻladi. Ularni Excel yoki bloknotda ochib, koʻz bilan qidirish mumkin emas. Terminal buyruqlari esa bir necha soniyada minglab qatorni filtrlaydi va sanaydi. Tahlilchi uchun bu eng kundalik vositalardan biri.

Bu darsdagi buyruqlarning hammasi faqat **oʻqiydi**: ular hech qanday faylni oʻzgartirmaydi va hech qayerga ulanmaydi.

## 2. `grep`: qidirish

`grep` berilgan soʻz yoki naqsh (pattern) bor qatorlarni chiqaradi.

```
grep FAIL vpn-gw01.log          # FAIL soʻzi bor qatorlar
grep -c FAIL vpn-gw01.log       # nechta qator ekanini sanaydi
grep -v FAIL vpn-gw01.log       # FAIL soʻzi YOʻQ qatorlar
grep -i success vpn-gw01.log    # katta-kichik harfga qaramay qidiradi
```

## 3. Pipe: buyruqlarni ulash

`|` belgisi bir buyruq natijasini keyingi buyruqqa uzatadi. Konveyerni tasavvur qiling: har bir buyruq bitta ishni qiladi va natijani keyingisiga beradi.

```
grep FAIL vpn-gw01.log | wc -l
```
"FAIL bor qatorlarni top, keyin ularni sana."

## 4. Maydonlarni ajratish: `cut` va `awk`

Log qatorlari maydonlardan (ustunlardan) iborat. Masalan:

```
2026-03-14T02:11:04Z vpn-gw01 auth: FAIL    user=b.tursunov  src=203.0.113.45   reason=bad_password
```

Maydonlar boʻsh joy bilan ajratilgan: 1-vaqt, 2-qurilma, 3-tur, 4-natija, 5-foydalanuvchi, 6-manba IP, 7-sabab.

- `cut -d , -f1,3 fayl.csv` vergul bilan ajratilgan fayldan 1- va 3-ustunni oladi.
- `awk '{print $5}'` boʻsh joylar soni turlicha boʻlsa ham 5-maydonni toʻgʻri ajratadi. Shuning uchun loglar uchun `awk` qulayroq.

## 5. Sanash: `sort | uniq -c`

Tahlilchining eng sevimli zanjiri:

```
... | sort | uniq -c | sort -rn
```

- `sort` bir xil qatorlarni yonma-yon qoʻyadi.
- `uniq -c` har bir qator necha marta takrorlanganini sanaydi.
- `sort -rn` natijani kattadan kichikka tartiblaydi.

Shu bilan "qaysi IP eng koʻp urindi?", "qaysi foydalanuvchi eng koʻp xato qildi?" kabi savollarga bir qatorda javob topasiz.

## 6. Amaliy mashq: VPN logini tergov qilish

Platformada `vpn-password-spray` tergovini oching va **Evidence terminal** da quyidagilarni bajaring:

```
grep -c FAIL vpn-gw01.log
grep FAIL vpn-gw01.log | awk '{print $6}' | sort | uniq -c
grep FAIL vpn-gw01.log | grep 203.0.113.45 | awk '{print $5}' | sort | uniq -c
grep SUCCESS vpn-gw01.log
grep 7f3a91 vpn-gw01.log
grep j.okafor directory-export.csv
```

Savollar:
1. Nechta muvaffaqiyatsiz urinish bor?
2. Muvaffaqiyatsiz urinishlar qaysi IP manzil(lar)dan kelgan?
3. Eng koʻp urinish qilgan IP manzildan har bir foydalanuvchiga nechta urinish qilingan? Bu password spraying belgisimi (2-dars)?
4. Shu IP manzildan qaysi akkaunt muvaffaqiyatli kirgan va unda MFA bormi?
5. `7f3a91` sessiyasi kirgandan keyin nima qilgan? (Oxirgi qatorga qarang.)
6. Tergov savollariga javob bering va "Debrief" bilan solishtiring.

**Yozma topshiriq:** ishlatgan buyruqlaringizni va har biri nimani koʻrsatganini 5–8 qatorda yozing. Masalan: "`grep -c FAIL` → 9 ta muvaffaqiyatsiz urinish, ulardan 8 tasi bitta IP dan".

## 7. Bilimni tekshirish

1. `grep -c ERROR app.log` nima qiladi?
   - a) ERROR qatorlarini oʻchiradi b) **ERROR bor qatorlar sonini chiqaradi** c) Faylni ERROR deb nomlaydi
2. `|` belgisi nima qiladi?
   - a) Ikki faylni birlashtiradi b) **Bir buyruq natijasini keyingi buyruqqa uzatadi** c) Buyruqni bekor qiladi
3. `grep -v` nima qiladi?
   - a) Versiyani koʻrsatadi b) **Naqsh YOʻQ qatorlarni chiqaradi** c) Batafsil chiqaradi
4. `uniq -c` dan oldin nima uchun `sort` kerak?
   - a) Tezroq ishlashi uchun b) **`uniq` faqat yonma-yon turgan bir xil qatorlarni birlashtiradi** c) Kerak emas
5. Boʻsh joylar soni turlicha boʻlgan logdan 5-maydonni olish uchun qaysi buyruq qulayroq?
   - a) `cut -d " " -f5` b) **`awk '{print $5}'`** c) `head -5`
6. Bitta IP dan 8 ta turli foydalanuvchiga bittadan urinish qilingan. Bu nima?
   - a) Brute force bitta akkauntga b) **Password spraying** c) Oddiy foydalanuvchi xatosi
7. Toʻgʻri yoki notoʻgʻri: bu darsdagi buyruqlar log fayllarini oʻzgartiradi. **Notoʻgʻri.**
8. "Qaysi IP eng koʻp soʻrov yuborgan?" savoliga qaysi zanjir javob beradi?
   - a) `cat log | head` b) **`awk '{print $1}' log | sort | uniq -c | sort -rn`** c) `grep -v log`

## 8. Xulosa

- `grep` topadi, `|` ulaydi, `awk`/`cut` ajratadi, `sort | uniq -c` sanaydi.
- Kichik buyruqlarni zanjir qilib, katta logdan aniq javob olasiz.
- Har bir xulosangizni buyruq natijasi bilan isbotlang.

## Qoʻshimcha manbalar

- GNU grep qoʻllanmasi (inglizcha). https://www.gnu.org/software/grep/manual/grep.html
- "explainshell.com": har qanday buyruqni boʻlaklarga ajratib tushuntiradi (inglizcha). https://explainshell.com
