# 10-dars. SIEM asoslari: hodisalarni bogʻlash

> Qoralama. Native speaker va mutaxassis tekshiruvi kerak.

**Davomiyligi:** 25 daqiqa oʻqish + 35 daqiqa laboratoriya

## Dars maqsadlari

1. SIEM nima qilishini va nima uchun alohida loglardan qulayroq ekanini tushuntira olasiz.
2. Oddiy SIEM soʻrovi yoza olasiz: filtr, `stats count by`, `sort`, `table`.
3. MFA push charchatish hujumi (MFA fatigue) belgilarini taniy olasiz.
4. "Beacon" (muntazam aloqa) belgisini vaqt oraligʻi orqali aniqlay olasiz.

## 1. SIEM nima?

**SIEM (Security Information and Event Management)** turli manbalardan (VPN, proxy, DNS, EDR, bulut) loglarni bir joyga yigʻadi, ularni bir xil formatga keltiradi va ular boʻyicha qidirish, sanash va ogohlantirish imkonini beradi. Mashhur SIEM lar: Splunk, Microsoft Sentinel, Elastic, Wazuh (bepul).

8-darsda siz loglarni alohida fayllardan `grep` bilan bogʻladingiz. SIEM buni bitta joyda, millionlab hodisalar ustida qiladi.

## 2. Hodisa (event) tuzilishi

SIEM dagi har bir hodisa maydonlardan iborat:

```
ts=2026-05-21T08:05:10Z sourcetype=auth user=s.yusupova src_ip=192.0.2.77 mfa_result=approved
```

- `ts`: vaqt
- `sourcetype`: log turi (auth, proxy, dns, edr)
- qolganlari: shu turga xos maydonlar

## 3. Soʻrov tili: toʻrt asosiy qadam

CyberPath SIEM laboratoriyasi Splunk ga oʻxshash soddalashtirilgan tildan foydalanadi:

1. **Filtrlash:** `sourcetype=auth mfa_result=denied`
2. **Sanash:** `| stats count by user`
3. **Tartiblash:** `| sort -count` (kattadan kichikka)
4. **Jadval:** `| table ts, user, src_ip`

Toʻliq misol:
```
sourcetype=auth mfa_result=denied | stats count by user | sort -count
```
"Rad etilgan MFA soʻrovlarini foydalanuvchi boʻyicha sanab, eng koʻpini tepaga chiqar."

Strategiya: **kengdan torga.** Avval umumiy rasmni koʻring (`stats count by sourcetype`), keyin gʻalati narsani topib, filtrni toraytiring.

## 4. MFA fatigue (push charchatish)

2-darsda push-tasdiqlash xavfi haqida gaplashdik. Hujumchida parol bor, lekin MFA yoʻq. U ketma-ket push soʻrovlarini yuboradi. Foydalanuvchi charchab yoki "xato boʻlsa kerak" deb oxiri **"Tasdiqlash"** ni bosadi.

SIEM dagi belgilari:
- Bitta foydalanuvchiga qisqa vaqtda koʻp `mfa_result=denied`.
- Ular notanish tashqi IP dan.
- Oxirida bitta `approved`, keyin shu foydalanuvchi nomidan VPN sessiyasi.

## 5. Beacon: muntazam "yurak urishi"

Kompyuterga oʻrnatilgan zararli dastur koʻpincha hujumchi serveriga **muntazam** murojaat qiladi ("men shu yerdaman, buyruq bormi?"). Bunga **beacon** deyiladi.

Belgilari: bir xil domen, deyarli bir xil hajmdagi soʻrovlar, **bir xil vaqt oraligʻi** (masalan, har 300 soniyada). Odam brauzerda bunday aniq ritm bilan ishlamaydi.

## 6. Laboratoriya: "Fourteen pushes and a heartbeat"

Platformada **Investigations → Fourteen pushes and a heartbeat** (`siem-push-fatigue-beacon`) tergovini oching va **SIEM** yorligʻiga oʻting. Unda 1 400 ga yaqin oʻylab topilgan hodisa bor.

Taklif qilinadigan soʻrovlar (oʻzingiz ham oʻzgartirib koʻring):
```
| stats count by sourcetype
sourcetype=auth mfa_result=denied | stats count by user | sort -count
user=d.rahimov mfa_result=denied | stats count by src_ip
sourcetype=proxy | stats count by url_domain | sort count
url_domain=cdn-telemetry.example | table ts, bytes_out, bytes_in
```

Savollar (tergovdagi savollar bilan bir xil):
1. Qaysi foydalanuvchi eng koʻp push ni rad etgan va nechta?
2. Soʻrovlar qaysi tashqi IP dan kelgan?
3. Sessiyaga qaysi ichki VPN manzil berilgan?
4. Yangi jarayon qaysi domenga murojaat qilmoqda va necha soniyada bir?
5. Birinchi navbatda nima qilish kerak?

**Yozma topshiriq:** 8–10 qatorli timeline tuzing: push soʻrovlari → tasdiqlash → VPN → yangi jarayon → beacon.

## 7. Bilimni tekshirish

1. SIEM ning asosiy vazifasi qaysi?
   - a) Viruslarni oʻchirish b) **Turli manbalardan loglarni yigʻish, qidirish va ogohlantirish** c) Saytni tezlashtirish
2. `| stats count by user` nima qiladi?
   - a) Foydalanuvchilarni oʻchiradi b) **Hodisalarni foydalanuvchi boʻyicha sanaydi** c) Faqat birinchi foydalanuvchini koʻrsatadi
3. `| sort -count` natijani qanday tartiblaydi?
   - a) Alifbo boʻyicha b) **Kattadan kichikka** c) Vaqt boʻyicha
4. MFA fatigue hujumining belgisi qaysi?
   - a) Bitta muvaffaqiyatli kirish b) **Qisqa vaqtda koʻp rad etilgan push, keyin bitta tasdiqlash** c) Parol almashtirilishi
5. Beacon ning eng kuchli belgisi qaysi?
   - a) Katta fayl yuklash b) **Bir xil domenga bir xil vaqt oraligʻida takroriy soʻrovlar** c) Koʻp DNS xatolari
6. SIEM da tergovni qanday boshlash maʼqul?
   - a) Darhol eng tor filtr bilan b) **Umumiy rasmdan boshlab, keyin toraytirish** c) Tasodifiy hodisalarni oʻqish
7. Toʻgʻri yoki notoʻgʻri: foydalanuvchi soʻramagan push soʻroviga "Tasdiqlash" ni bossa ham, parol boʻlmasa xavf yoʻq. **Notoʻgʻri.** *Izoh: push soʻrovi kelishining oʻzi hujumchida parol borligini bildiradi.*
8. Parol va ishlayotgan zararli dastur hujumchida boʻlsa, birinchi qadam qaysi?
   - a) Ertangi kunni kutish b) **Kompyuterni izolyatsiya qilish va foydalanuvchi sessiyalarini bekor qilish** c) Faqat parolni almashtirish

## 8. Xulosa

- SIEM loglarni bir joyga yigʻib, bogʻlash va sanashni osonlashtiradi.
- Soʻrov: filtr → `stats count by` → `sort` → `table`.
- MFA fatigue: koʻp rad etish, keyin bitta tasdiq. Beacon: muntazam ritm.

## Qoʻshimcha manbalar

- Wazuh: bepul ochiq kodli SIEM, hujjatlari (inglizcha). https://documentation.wazuh.com
- Splunk, "Search Tutorial" (inglizcha). https://docs.splunk.com/Documentation/Splunk/latest/SearchTutorial
