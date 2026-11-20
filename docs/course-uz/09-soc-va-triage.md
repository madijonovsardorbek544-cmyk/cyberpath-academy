# 9-dars. SOC tahlilchisining ishi: ogohlantirishlarni saralash (triage)

> Qoralama. Native speaker va mutaxassis tekshiruvi kerak.

**Davomiyligi:** 25 daqiqa oʻqish + 30 daqiqa simulyator

## Dars maqsadlari

1. SOC nima va unda kimlar qanday ish qilishini tushuntira olasiz.
2. True positive, false positive va false negative tushunchalarini farqlay olasiz.
3. Ogohlantirishga (alert) toʻgʻri jiddiylik darajasini bera olasiz.
4. Qisqa, aniq va dalilga asoslangan triage izohini yoza olasiz.

## 1. SOC nima?

**SOC (Security Operations Center, xavfsizlik operatsiyalari markazi)** tashkilotdagi xavfsizlik hodisalarini kuzatib, ularga javob beradigan jamoa. Katta banklar, telekom kompaniyalari va davlat tashkilotlarida ular odatda 24/7 ishlaydi.

Odatiy rollar:
- **L1 tahlilchi (triage):** kelgan ogohlantirishlarni koʻrib chiqadi, haqiqiy yoki yolgʻon ekanini aniqlaydi, kerak boʻlsa yuqoriga uzatadi. Koʻpchilik sohaga shu rol orqali kiradi.
- **L2/L3 tahlilchi:** chuqur tergov, insidentga javob.
- **Detection engineer:** ogohlantirish qoidalarini yozadi va sozlaydi.

## 2. Ogohlantirish qayerdan keladi?

SIEM (keyingi dars), EDR, antivirus va firewall maʼlum qoidalar asosida ogohlantirish chiqaradi. Masalan: "5 daqiqada 10 ta muvaffaqiyatsiz login, keyin muvaffaqiyatli login". Qoida mashina, lekin qaror odam tomonidan qabul qilinadi.

## 3. Toʻrt natija

| | Haqiqatda hujum bor | Haqiqatda hujum yoʻq |
| --- | --- | --- |
| **Ogohlantirish chiqdi** | True positive (toʻgʻri topildi) | False positive (yolgʻon xavotir) |
| **Ogohlantirish chiqmadi** | False negative (oʻtkazib yuborildi) | True negative |

- **False positive** koʻp boʻlsa, tahlilchilar charchaydi va haqiqiy hujumni eʼtiborsiz qoldirishi mumkin ("alert fatigue").
- **False negative** eng xavfli: hujum boʻldi, lekin hech kim bilmadi.

Shuning uchun har bir false positive ni yopganda, sababini yozing. Detection engineer qoidani yaxshilashi uchun bu kerak.

## 4. Triage savollari

Har bir ogohlantirish uchun:
1. **Nima sodir boʻldi?** Qoida nimani koʻrdi?
2. **Kontekst:** bu foydalanuvchi yoki qurilma uchun odatiymi? Rejalashtirilgan ish (backup, yangilanish) bormi?
3. **Dalil:** qaysi log qatorlari buni tasdiqlaydi yoki rad etadi?
4. **Taʼsir:** muvaffaqiyatli boʻldimi? Qaysi aktiv xavf ostida?
5. **Qaror:** true/false positive, jiddiylik va keyingi qadam.

## 5. Jiddiylik darajasi

- **Critical (juda jiddiy):** faol hujum, muhim tizim yoki maʼlumot xavf ostida. Darhol harakat.
- **High (yuqori):** hujum tasdiqlangan yoki ehtimoli katta. Bugun hal qilinadi.
- **Medium (oʻrta):** shubhali, qoʻshimcha tekshiruv kerak.
- **Low (past):** kam xavf yoki tushuntirilgan holat.

SIEM bergan daraja faqat boshlangʻich taxmin. Tahlilchi uni dalillarga qarab oʻzgartiradi.

## 6. Yaxshi triage izohi

Yomon: "Shubhali. Tekshirildi."

Yaxshi: "True positive, high. 203.0.113.45 dan 8 ta akkauntga password spraying, keyin j.okafor muvaffaqiyatli kirgan (MFA yoʻq). Sessiya 7f3a91 FILESRV01 ga ulangan. Tavsiya: sessiyani toʻxtatish, parolni almashtirish, IP ni bloklash, MFA majburiy qilish."

Yaxshi izoh: **qaror + dalil (IP, foydalanuvchi, vaqt) + taʼsir + keyingi qadam**, 2–4 gapda.

## 7. Simulyator: "Monday morning queue"

Platformada **SOC Simulator → Monday morning queue** smenasini oching. Tunda 6 ta ogohlantirish kelgan. Har biri uchun:
- true yoki false positive ekanini tanlang;
- jiddiylik darajasini tanlang;
- 2–4 gapli izoh yozing.

Smena tugagach natijangizni va har bir ogohlantirish boʻyicha tushuntirishni oʻqing. Kamida 70% ball olguncha qayta urinib koʻring.

**Yozma topshiriq:** qaysi ogohlantirishda xato qildingiz va nima uchun? Keyingi safar nimaga eʼtibor berasiz? (5–7 gap)

## 8. Bilimni tekshirish

1. L1 SOC tahlilchisining asosiy vazifasi qaysi?
   - a) Ogohlantirish qoidalarini yozish b) **Kelgan ogohlantirishlarni saralash va kerak boʻlsa uzatish** c) Serverlarni oʻrnatish
2. Antivirus test faylini (EICAR) "virus" deb topdi. Bu …
   - a) True positive b) **False positive** c) False negative
3. Hujum boʻldi, lekin hech qanday ogohlantirish chiqmadi. Bu …
   - a) False positive b) True negative c) **False negative**
4. Nima uchun false positive larning koʻpligi xavfli?
   - a) Ular disk joyini egallaydi b) **Tahlilchilar charchab, haqiqiy hujumni oʻtkazib yuborishi mumkin** c) Ular xavfli emas
5. Tunda katta chiquvchi trafik, lekin har kuni shu vaqtda rejalashtirilgan backup ishlaydi va hajm odatdagidek. Qaror?
   - a) Critical b) **False positive, low; backup ekanini izohda yozish** c) Eʼtibor bermasdan yopish
6. Quyidagilardan qaysi biri yaxshi triage izohi?
   - a) "Tekshirildi" b) "Ehtimol hujum" c) **"True positive, high: 203.0.113.45 dan spraying, j.okafor kirdi (MFA yoʻq). Tavsiya: sessiyani toʻxtatish va MFA"**
7. Toʻgʻri yoki notoʻgʻri: SIEM bergan jiddiylik darajasini tahlilchi oʻzgartirmasligi kerak. **Notoʻgʻri.**
8. Office ilovasi PowerShell ni ishga tushirgan va u tashqi manzilga ulangan. Eng toʻgʻri jiddiylik?
   - a) Low b) Medium c) **Critical yoki high: kompyuterni izolyatsiya qilish va darhol tekshirish**

## 9. Xulosa

- SOC hodisalarni kuzatadi va javob beradi. L1 sohaga kirishning odatiy yoʻli.
- True/false positive va false negative farqini biling.
- Triage: nima, kontekst, dalil, taʼsir, qaror.
- Yaxshi izoh qisqa va dalilga asoslangan boʻladi.

## Qoʻshimcha manbalar

- MITRE ATT&CK: hujumchilar usullari bazasi, tahlilchilar umumiy tili sifatida ishlatiladi (inglizcha). https://attack.mitre.org
- SANS, "SOC Analyst" roli haqida maqolalar (inglizcha). https://www.sans.org/cyber-security-careers/
