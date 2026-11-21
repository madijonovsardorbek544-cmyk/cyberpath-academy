# 1-dars. Kiberxavfsizlik nima?

> Qoralama. Native speaker va mutaxassis tekshiruvi kerak.

**Davomiyligi:** 25–30 daqiqa oʻqish + 15 daqiqa mashq

## Dars maqsadlari

Dars oxirida siz:
1. Kiberxavfsizlik nimani himoya qilishini oddiy soʻzlar bilan tushuntira olasiz.
2. CIA uchligini (Confidentiality, Integrity, Availability) misollar bilan farqlay olasiz.
3. "Aktiv", "tahdid", "zaiflik" va "xavf" soʻzlarining farqini bilasiz.
4. Nima uchun ruxsatsiz "sinab koʻrish" qonunbuzarlik va kasbiy xato ekanini tushunasiz.

## 1. Kiberxavfsizlik nimani himoya qiladi?

Kiberxavfsizlik bu kompyuterlar emas, avvalo **odamlar va ularning maʼlumotlari** himoyasidir. Bank ilovangizdagi pul, telefoningizdagi suratlar, maktab yoki universitetdagi baholaringiz, shifoxonadagi tibbiy kartangiz: bularning barchasi biror kompyuterda saqlanadi. Kiberxavfsizlik mutaxassisining vazifasi shu maʼlumotlar va xizmatlar xavfsiz, toʻgʻri va kerak paytda ishlashini taʼminlashdir.

Koʻp yangi boshlovchilar kiberxavfsizlikni filmlardagi "xakerlik" deb oʻylaydi: qora ekran, tez yozilayotgan kod, bir necha soniyada buzilgan tizim. Haqiqiy ishning katta qismi boshqacha: loglarni oʻqish, sozlamalarni tekshirish, foydalanuvchilarga tushuntirish, hodisani hujjatlashtirish va keyingi safar takrorlanmasligi uchun choralar koʻrish. Yaxshi mutaxassis birinchi navbatda **diqqatli va halol** boʻladi.

## 2. CIA uchligi

Xavfsizlikda uchta asosiy maqsad bor. Ularni inglizcha bosh harflari bilan **CIA** deb atashadi (Markaziy razvedka boshqarmasi bilan aloqasi yoʻq).

**Confidentiality (maxfiylik).** Maʼlumotni faqat ruxsati bor odam koʻradi.
Misol: sizning SMS kodingizni faqat siz koʻrishingiz kerak. Agar kimdir kodni telefon orqali soʻrab olsa, maxfiylik buziladi.

**Integrity (yaxlitlik).** Maʼlumot ruxsatsiz oʻzgartirilmaydi va toʻgʻri qoladi.
Misol: universitet tizimida bahoyingiz "3" edi, kimdir uni "5" ga oʻzgartirdi. Hech kim hech narsani oʻgʻirlamadi, lekin maʼlumot endi ishonchli emas.

**Availability (mavjudlik).** Xizmat va maʼlumot kerak boʻlganda ishlaydi.
Misol: imtihon kuni test tizimi ishlamay qoldi. Maʼlumot ham sir saqlangan, ham toʻgʻri, lekin undan foydalanib boʻlmaydi.

Har bir xavfsizlik muammosini shu uchta savol bilan tekshirish mumkin: kim koʻrdi? nima oʻzgardi? nima ishlamay qoldi?

## 3. Aktiv, tahdid, zaiflik, xavf

Bu toʻrt soʻz har kuni ishlatiladi, shuning uchun ularni aniq farqlash kerak.

- **Aktiv (asset):** himoya qilinadigan narsa. Masalan, oʻquv markazining talabalar roʻyxati.
- **Tahdid (threat):** zarar yetkazishi mumkin boʻlgan narsa yoki odam. Masalan, roʻyxatni sotmoqchi boʻlgan firibgar yoki tasodifan faylni oʻchirib yuboradigan xodim.
- **Zaiflik (vulnerability):** tahdid foydalanishi mumkin boʻlgan kamchilik. Masalan, roʻyxat parolsiz umumiy papkada turibdi.
- **Xavf (risk):** tahdid zaiflikdan foydalanib, aktivga zarar yetkazishi ehtimoli va zarar hajmi.

Oddiy formula: **xavf = ehtimollik × taʼsir**. Parolsiz papkadagi 2 000 talabaning telefon raqamlari: ehtimollik yuqori, taʼsir katta, demak xavf yuqori. Hech kim ishlatmaydigan eski test fayli: xavf past.

Mutaxassis hamma narsani bir vaqtda tuzatolmaydi. Shuning uchun u avval **eng katta xavfni** kamaytiradi.

## 4. Ruxsat va etika: eng muhim qoida

Kiberxavfsizlikni oʻrganayotgan odam koʻp narsani sinab koʻrgisi keladi. Lekin qoida oddiy: **ruxsat boʻlmasa, tekshirmaysiz.**

Ruxsat bor joylar:
- oʻzingizning kompyuteringiz va oʻz akkauntlaringiz;
- CyberPath kabi platformalardagi oʻquv simulyatsiyalari;
- tashkilot sizga **yozma ravishda** ruxsat bergan tizimlar.

Ruxsat yoʻq joylar: doʻstingizning akkaunti ("u ruxsat berdi" deb ogʻzaki aytgan boʻlsa ham), maktab yoki universitet sayti, istalgan kompaniya sayti, umumiy Wi-Fi tarmogʻi.

Koʻpgina davlatlarda, jumladan Oʻzbekistonda ham, kompyuter tizimlariga ruxsatsiz kirish jinoiy javobgarlikka sabab boʻlishi mumkin. Bundan tashqari, ish beruvchi bunday tajribani ijobiy emas, salbiy belgi deb qabul qiladi. Ishonch bu sohadagi eng qimmat narsadir.

## 5. Hayotiy misol

Toshkentdagi kichik oʻquv markazi talabalarini Telegram guruhida roʻyxatdan oʻtkazadi. Administrator talabalar roʻyxatini (ism, telefon, toʻlov holati) Google Sheets jadvalida saqlaydi va havolani "havolasi bor har kim koʻrishi mumkin" qilib qoʻygan. Havola bir marta guruhga yuborilgan.

CIA boʻyicha tahlil:
- **Maxfiylik** xavf ostida: havola bor har kim telefon raqamlarini koʻradi.
- **Yaxlitlik:** agar havola "tahrirlash mumkin" boʻlsa, kimdir toʻlov holatini oʻzgartirishi mumkin.
- **Mavjudlik:** kimdir jadvalni tozalab qoʻysa, markaz kimlar toʻlov qilganini bilmay qoladi.

Eng yaxshi birinchi qadam: havolani faqat kerakli xodimlar bilan ulashish va eski havolani oʻchirish. Bu qimmat dastur talab qilmaydi, lekin eng katta xavfni darhol kamaytiradi.

## 6. Amaliy mashq: "Xavf xaritasi"

Oʻzingiz yaxshi biladigan joyni tanlang (oilangiz, maktabingiz, ish joyingiz yoki doʻstlaringiz guruhi). Haqiqiy tizimlarni tekshirmang, faqat oʻylab yozing.

1. 3 ta aktivni yozing (masalan: telefon, Telegram akkaunti, oila suratlari).
2. Har biri uchun bitta tahdid va bitta zaiflikni yozing.
3. Har birining xavfini "past / oʻrta / yuqori" deb baholang va nima uchun shunday deb oʻylashingizni bir gapda yozing.
4. Eng yuqori xavf uchun bitta oddiy himoya chorasini taklif qiling.

Natijani keyingi jonli darsdan oldin platformadagi topshiriqlar boʻlimiga yuklang. Mentor fikr bildiradi.

## 7. Bilimni tekshirish

1. Kimdir universitet tizimida oʻz bahosini oʻzgartirdi. CIA uchligining qaysi qismi buzildi?
   - a) Maxfiylik b) **Yaxlitlik** c) Mavjudlik
   *Izoh: maʼlumot hech kimga koʻrsatilmadi, lekin uning toʻgʻriligi buzildi.*
2. Onlayn doʻkon 3 soat ishlamay qoldi, maʼlumotlar yoʻqolmadi. Qaysi maqsad buzildi?
   - a) Maxfiylik b) Yaxlitlik c) **Mavjudlik**
3. "Parolsiz umumiy papka" bu …
   - a) tahdid b) **zaiflik** c) aktiv
4. Qaysi biri aktivga misol?
   - a) Firibgar b) Eski dastur versiyasi c) **Mijozlar bazasi**
5. Xavf qachon eng yuqori?
   - a) Ehtimollik past, taʼsir past b) Ehtimollik yuqori, taʼsir past c) **Ehtimollik yuqori, taʼsir katta**
6. Doʻstingiz Instagram akkauntining parolini "tekshirib koʻrishingizni" ogʻzaki soʻradi. Toʻgʻri javob qaysi?
   - a) Tekshirib koʻrasiz, chunki u ruxsat berdi
   - b) **Unga MFA yoqish va kuchli parol qoʻyishga yordam berasiz, lekin akkauntga kirib koʻrmaysiz**
   - c) Boshqa doʻstingizning akkauntida sinab koʻrasiz
7. Toʻgʻri yoki notoʻgʻri: kiberxavfsizlik mutaxassisining ishining katta qismi hujjatlar, loglar va odamlar bilan ishlashdan iborat. **Toʻgʻri.**
8. Mutaxassis birinchi navbatda qaysi muammoni tuzatishi kerak?
   - a) Eng qiziq muammoni b) **Eng katta xavfni** c) Eng oson muammoni
   *Izoh: oson muammoni tez tuzatish mumkin, lekin avval eng koʻp zarar keltirishi mumkin boʻlgan muammo hal qilinadi.*

## 8. Xulosa

- Kiberxavfsizlik odamlar va maʼlumotlarni himoya qiladi.
- CIA: maxfiylik, yaxlitlik, mavjudlik. Har bir muammoni shu uchta savol bilan tekshiring.
- Xavf = ehtimollik × taʼsir. Avval eng katta xavfni kamaytiring.
- Ruxsat yoʻq boʻlsa, tekshirmaysiz. Bu qonun va ishonch masalasi.

## Qoʻshimcha manbalar

- NIST, "Glossary": atamalarning rasmiy inglizcha taʼriflari. https://csrc.nist.gov/glossary
- CyberPath: "Investigations" boʻlimidagi birinchi tergov bilan tanishib chiqing (keyingi darsda ishlatamiz).
