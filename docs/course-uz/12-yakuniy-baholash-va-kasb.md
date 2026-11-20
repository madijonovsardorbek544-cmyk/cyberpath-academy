# 12-dars. Yakuniy amaliy baholash va keyingi qadamlar

> Qoralama. Native speaker va mutaxassis tekshiruvi kerak.

**Davomiyligi:** 20 daqiqa oʻqish + 180 daqiqa imtihon (alohida kuni)

## Dars maqsadlari

1. Yakuniy amaliy baholash (CPA-1) qanday tuzilganini va qanday baholanishini bilasiz.
2. Kurs davomida oʻrganganlaringizni bir sahifada takrorlay olasiz.
3. Kiberxavfsizlikda kirish darajasidagi rollar va keyingi oʻqish yoʻllarini bilasiz.
4. Oʻz portfolio ingizni qanday boshlashni rejalashtira olasiz.

## 1. Yakuniy baholash: CPA-1

Platformadagi **Analyst exam** boʻlimida **CyberPath Practical Analyst (CPA-1)** imtihoni bor.

- **Vaqt:** 180 daqiqa, bir martada.
- **Tuzilma:** bir nechta amaliy boʻlim (loglar va dalillar ustida savollar) va yakuniy **yozma insident hisoboti**.
- **Oʻtish:** umumiy ball kamida 70 va hisobot alohida minimal balldan oʻtishi kerak. Faqat test savollari bilan oʻtib boʻlmaydi.
- **Baholash:** amaliy savollar avtomatik, hisobotni mentor rubrika boʻyicha tekshiradi.
- **Sertifikat:** oʻtganlar ochiq tekshiriladigan kodli sertifikat oladi (`/verify` sahifasi). Sertifikat kurs va imtihondan muvaffaqiyatli oʻtganingizni koʻrsatadi. U davlat yoki xalqaro akkreditatsiyaga ega emas va ish kafolati bermaydi.

Qoidalar: imtihonni oʻzingiz bajarasiz; daftar va kurs materiallaridan foydalanish mumkin; boshqa odamdan yordam yoki AI dan tayyor javob olish mumkin emas. Mentor hisobotdagi mulohazalaringizni jonli suhbatda soʻrashi mumkin.

## 2. Tayyorgarlik: bir sahifali takrorlash

| Hafta | Asosiy fikr | Eng muhim koʻnikma |
| --- | --- | --- |
| 1 | CIA, xavf = ehtimollik × taʼsir, ruxsatsiz tekshirmaslik | Xavfni baholash |
| 1 | Parol, MFA, password spraying | Auth loglarini oʻqish |
| 2 | Fishing belgilari, From / Reply-To / DMARC | Email sarlavhalarini oʻqish |
| 2 | DNS, IP, port, HTTP kodlari, HTTPS | Veb-log maydonlari |
| 3 | Linux papkalari, `rwx`, eng kam imtiyoz | `ls`, `cat`, `head` |
| 3 | `grep`, pipe, `awk`, `sort \| uniq -c` | Logdan aniq raqam olish |
| 4 | OWASP Top 10, SQL injection, XSS va himoyalari | Logda hujum urinishini topish |
| 4 | Log turlari, timeline, exfiltration | Loglarni bogʻlash |
| 5 | Triage, true/false positive, jiddiylik | Qisqa dalilli izoh |
| 5 | SIEM soʻrovlari, MFA fatigue, beacon | `stats count by` |
| 6 | IR bosqichlari, persistence, hisobot | Insident hisoboti |

Imtihondan oldin: barcha tergovlarni qayta oʻting va 11-darsdagi hisobotingizga mentor bergan fikrni oʻqing.

## 3. Kasb yoʻli: qayerdan boshlash mumkin?

Kirish darajasidagi rollar (nomlari kompaniyaga qarab farq qiladi):
- **SOC analyst (L1):** ogohlantirishlarni saralash. Bu kursda eng koʻp mashq qilganingiz.
- **IT support / helpdesk** xavfsizlik vazifalari bilan: akkauntlar, MFA, fishing xabarlari. Koʻpchilik sohaga shu yerdan kiradi.
- **Junior security analyst / GRC:** siyosatlar, xavf baholash, auditga tayyorgarlik.

Halol gap: 6 haftalik kurs sizni toʻgʻridan-toʻgʻri tajribali mutaxassis qilmaydi. U mustahkam poydevor beradi. Ishga olishda koʻpincha amaliy dalil (portfolio), ingliz tili va doimiy oʻrganish muhim.

## 4. Keyingi oʻrganish yoʻllari

- **Chuqurlashtirish:** tarmoqlar (Cisco CCNA darajasi), Linux, Windows va Active Directory asoslari.
- **Bepul mashq platformalari** (inglizcha): TryHackMe bepul xonalari, OverTheWire Bandit, Blue Team Labs Online bepul tergovlari, CyberDefenders.
- **Sertifikatlar** (pullik, xalqaro tan olingan, ixtiyoriy): CompTIA Security+, Cisco CyberOps Associate, ISC2 Certified in Cybersecurity (CC). Narx va talablarni rasmiy saytlardan tekshiring.
- **Ingliz tili:** hujjatlar, vositalar va ish eʼlonlarining koʻpi ingliz tilida. Har kuni bitta texnik maqola oʻqish odati juda foydali.

## 5. Portfolio: oʻrganganingizni koʻrsating

Ish beruvchi "kurs tugatdim" dan koʻra "mana qilgan ishim" ni koʻrishni afzal koʻradi. Platformadagi **Portfolio** boʻlimida:
- 2–3 ta eng yaxshi tergov hisobotingizni (oʻylab topilgan maʼlumotlar asosida) chop eting.
- Har biriga qisqa izoh: qanday muammo, qanday usul, qanday xulosa.
- Ommaviy profil havolasini rezyume yoki LinkedIn ga qoʻshing.

Hech qachon real tashkilotning maʼlumotlari yoki ruxsatsiz "tekshiruv" natijalarini portfolio ga qoʻymang.

## 6. Bilimni tekshirish (takrorlash)

1. Xavf qanday baholanadi?
   - a) Faqat ehtimollik bilan b) **Ehtimollik va taʼsir bilan** c) Faqat narx bilan
2. Bitta IP dan koʻp akkauntga bittadan urinish nima deyiladi?
   - a) Fishing b) **Password spraying** c) Beacon
3. From va Reply-To manzillari har xil domenda. Bu nimaning belgisi boʻlishi mumkin?
   - a) Normal holat b) **Fishing yoki BEC** c) DNS xatosi
4. SQL injection ning asosiy himoyasi qaysi?
   - a) HTTPS b) **Parametrlangan soʻrovlar** c) Firewall
5. `sort | uniq -c` nima qiladi?
   - a) Faylni oʻchiradi b) **Bir xil qatorlarni sanaydi** c) Faylni shifrlaydi
6. Antivirus test faylini virus deb topdi. Bu …
   - a) True positive b) **False positive** c) False negative
7. Insidentga javobda cheklash va tozalashning toʻgʻri tartibi qaysi?
   - a) Avval tozalash, keyin cheklash b) **Avval cheklash, keyin tozalash** c) Tartib muhim emas
8. Toʻgʻri yoki notoʻgʻri: CyberPath sertifikati xalqaro akkreditatsiyaga ega va ish kafolatini beradi. **Notoʻgʻri.**

## 7. Xulosa

- CPA-1: 180 daqiqa, amaliy boʻlimlar va yozma hisobot. Hisobot alohida baholanadi.
- Kurs poydevor beradi. Keyingi qadam: chuqurlashtirish, ingliz tili va portfolio.
- Har doim: ruxsat boʻlmasa, tekshirmaysiz.

## Qoʻshimcha manbalar

- ISC2 Certified in Cybersecurity (CC): kirish darajasidagi sertifikat (inglizcha). https://www.isc2.org/certifications/cc
- CompTIA Security+ (inglizcha). https://www.comptia.org/certifications/security
- Blue Team Labs Online (inglizcha). https://blueteamlabs.online
