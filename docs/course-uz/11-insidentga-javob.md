# 11-dars. Insidentga javob berish bosqichlari va hisobot yozish

> Qoralama. Native speaker va mutaxassis tekshiruvi kerak.

**Davomiyligi:** 30 daqiqa oʻqish + 30 daqiqa tergov

## Dars maqsadlari

1. Insidentga javob berishning bosqichlarini (NIST modeli) tushuntira olasiz.
2. Cheklash (containment) va tozalash (eradication) farqini bilasiz.
3. Dalillarni saqlash nima uchun muhimligini tushuntira olasiz.
4. Texnik va texnik boʻlmagan oʻquvchi uchun aniq insident hisoboti yoza olasiz.

## 1. Insident nima?

**Xavfsizlik insidenti** bu tashkilot maʼlumotlari yoki tizimlarining maxfiyligi, yaxlitligi yoki mavjudligiga (CIA, 1-dars) haqiqiy zarar yetgan yoki yetishi mumkin boʻlgan voqea. Har bir ogohlantirish insident emas: triage (9-dars) aynan qaysi biri insident ekanini aniqlaydi.

## 2. Bosqichlar

NIST (AQSh Standartlar va texnologiyalar instituti) insidentga javobni shunday bosqichlarga ajratadi (SP 800-61):

1. **Tayyorgarlik:** reja, aloqa roʻyxati, loglar, zaxira nusxalar insidentdan **oldin** tayyor boʻlishi.
2. **Aniqlash va tahlil:** nima boʻldi, qachon boshlandi, qaysi tizimlar va maʼlumotlar taʼsirlangan.
3. **Cheklash (containment):** zarar tarqalishini toʻxtatish. Masalan, kompyuterni tarmoqdan ajratish (izolyatsiya), akkaunt sessiyalarini bekor qilish, IP ni bloklash.
4. **Tozalash (eradication):** hujumchi qoldirgan narsalarni olib tashlash: zararli dastur, rejalashtirilgan vazifa, yangi yaratilgan akkaunt.
5. **Tiklash (recovery):** tizimni xavfsiz holatda ishga qaytarish, kuzatuvni kuchaytirish.
6. **Saboqlar (lessons learned):** nima yaxshi ishladi, nima ishlamadi, qanday chora takrorlanishni oldini oladi.

Muhim tartib: **avval cheklash, keyin tozalash.** Agar zararli dasturni izolyatsiyasiz oʻchirsangiz, hujumchi boshqa yoʻl bilan qaytib kelishi va izlarni yoʻqotishi mumkin.

## 3. Dalillarni saqlash

- Kompyuterni darhol **oʻchirmang**: xotiradagi maʼlumot yoʻqoladi. Tarmoqdan ajratish (izolyatsiya) odatda yaxshiroq.
- Loglarni saqlab qoʻying, ular avtomatik oʻchib ketishi mumkin.
- Kim, qachon, nima qilganingizni yozib boring. Bu keyinchalik hisobot va, kerak boʻlsa, huquqiy jarayon uchun kerak.

## 4. Persistence: hujumchi qanday "qoladi"?

Hujumchi kompyuter qayta yuklangandan keyin ham qaytib kelishi uchun **persistence (mustahkamlanish)** yaratadi. Keng tarqalgan usullar: rejalashtirilgan vazifa (scheduled task), avtomatik ishga tushish (Run kaliti), yangi xizmat. Tozalash bosqichida aynan shularni topish kerak.

## 5. Yaxshi insident hisoboti

Tuzilma:
1. **Qisqacha xulosa (2–3 gap):** nima boʻldi, qanchalik jiddiy, hozirgi holat. Rahbar faqat shuni oʻqishi mumkin.
2. **Timeline:** vaqt boʻyicha asosiy voqealar (UTC da, vaqt zonasini koʻrsating).
3. **Taʼsir:** qaysi tizimlar, akkauntlar, maʼlumotlar.
4. **Dalillar:** qaysi log, qaysi qator, qaysi qiymat.
5. **Koʻrilgan choralar** va **tavsiyalar:** kim, nima, qachongacha.

Qoidalar: faktni taxmindan ajrating ("tasdiqlangan" / "ehtimol"), jargonni kamaytiring, hech kimni ayblamang.

## 6. Tergov: "Word opened PowerShell"

Platformada `macro-powershell-persistence` tergovini oching. 3-darsdagi "invoice" xatidan 10 daqiqa oʻtib, boshqa buxgalteriya kompyuterida (WS-FIN-07) foydalanuvchi ilovani ochgan va EDR ogohlantirish bergan. Sizda shu kompyuterning Sysmon hodisalari bor.

Topish kerak:
1. Qaysi hujjat qaysi jarayonni ishga tushirgan?
2. PowerShell qanday buyruq bajargan? (`decoding-notes.txt` yordam beradi.)
3. Kompyuter qayerga ulangan?
4. Hujumchi qanday persistence qoldirgan?
5. Cheklash va tozalash uchun qadamlar roʻyxati.

**Yozma topshiriq (yakuniy baholashga tayyorgarlik):** 5-boʻlimdagi tuzilma boʻyicha toʻliq insident hisoboti yozing (250–400 soʻz). Mentor uni yakuniy imtihon rubrikasi boʻyicha baholaydi.

## 7. Bilimni tekshirish

1. Qaysi bosqich insidentdan oldin bajariladi?
   - a) Cheklash b) **Tayyorgarlik** c) Tiklash
2. Zararlangan kompyuterni tarmoqdan ajratish qaysi bosqichga kiradi?
   - a) Tozalash b) **Cheklash** c) Saboqlar
3. Hujumchi yaratgan rejalashtirilgan vazifani oʻchirish qaysi bosqich?
   - a) Aniqlash b) **Tozalash** c) Tayyorgarlik
4. Nima uchun zararlangan kompyuterni darhol oʻchirmaslik tavsiya etiladi?
   - a) U buziladi b) **Xotiradagi dalillar yoʻqoladi** c) Litsenziya yoʻqoladi
5. Persistence nima?
   - a) Parolni tez-tez almashtirish b) **Hujumchining qayta yuklashdan keyin ham tizimda qolish usuli** c) Zaxira nusxa
6. Insident hisobotining qaysi qismini rahbar birinchi oʻqiydi?
   - a) Dalillar b) **Qisqacha xulosa** c) Ilovalar
7. Toʻgʻri yoki notoʻgʻri: hisobotda fakt va taxminni ajratish shart emas. **Notoʻgʻri.**
8. "Saboqlar" bosqichining maqsadi nima?
   - a) Aybdorni topish b) **Takrorlanishni oldini olish uchun jarayon va himoyani yaxshilash** c) Loglarni oʻchirish

## 8. Xulosa

- Tayyorgarlik → aniqlash → cheklash → tozalash → tiklash → saboqlar.
- Avval cheklang, keyin tozalang. Dalillarni saqlang.
- Hisobot: qisqa xulosa, timeline, taʼsir, dalil, choralar. Fakt va taxmin alohida.

## Qoʻshimcha manbalar

- NIST SP 800-61 Rev. 3, "Incident Response Recommendations" (inglizcha). https://csrc.nist.gov/pubs/sp/800/61/r3/final
- Microsoft Sysmon hujjatlari: Event ID lar maʼnosi (inglizcha). https://learn.microsoft.com/sysinternals/downloads/sysmon
