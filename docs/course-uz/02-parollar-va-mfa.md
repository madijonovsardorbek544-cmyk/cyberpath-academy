# 2-dars. Parollar, MFA va akkauntni himoya qilish

> Qoralama. Native speaker va mutaxassis tekshiruvi kerak.

**Davomiyligi:** 25–30 daqiqa oʻqish + 20 daqiqa tergov

## Dars maqsadlari

1. Parollar qanday yoʻllar bilan qoʻlga tushishini bilasiz.
2. Kuchli va eslab qolsa boʻladigan parol yarata olasiz.
3. MFA (koʻp bosqichli autentifikatsiya) nima uchun kerakligini va uning turlarini tushuntira olasiz.
4. Loglarda "password spraying" hujumining belgilarini taniy olasiz.

## 1. Autentifikatsiya va avtorizatsiya

**Autentifikatsiya (authentication):** "Siz kimsiz?" savoliga javob. Parol, SMS kod, barmoq izi.
**Avtorizatsiya (authorization):** "Sizga nima qilish mumkin?" savoliga javob. Talaba oʻz bahosini koʻradi, lekin oʻzgartira olmaydi; oʻqituvchi esa oʻzgartira oladi.

Parol autentifikatsiyaning eng keng tarqalgan, lekin eng zaif usulidir.

## 2. Parollar qanday qoʻlga tushadi?

1. **Maʼlumotlar sizishi (data breach).** Siz roʻyxatdan oʻtgan biror sayt buziladi va parollar bazasi internetga chiqadi. Agar siz shu parolni boshqa joylarda ham ishlatsangiz, ular ham xavf ostida.
2. **Fishing.** Soxta sahifa yoki xabar orqali parolni oʻzingiz kiritasiz (keyingi darsda batafsil).
3. **Taxmin qilish.** `123456`, `qwerty`, `parol123`, tugʻilgan sana yoki telefon raqami bir necha urinishda topiladi.
4. **Password spraying.** Hujumchi bitta mashhur parolni (masalan `Toshkent2026!`) yuzlab akkauntlarda sinaydi. Har bir akkauntga 1–2 urinish qilingani uchun bloklanish ishlamaydi.
5. **Kodni soʻrab olish.** "Bank xodimi" qoʻngʻiroq qilib SMS kodni soʻraydi. Haqiqiy bank hech qachon kodni soʻramaydi.

## 3. Yaxshi parol

Uzunlik murakkablikdan muhimroq. Bir nechta tasodifiy soʻzdan iborat ibora (passphrase) ham kuchli, ham eslab qolish oson:

- Zaif: `Sardor2007`
- Oʻrtacha: `S@rd0r_2007!` (koʻrinishi murakkab, lekin ism va yil bor)
- Kuchli: `yomgʻir-choynak-velosiped-ochiq` (4 ta tasodifiy soʻz, 30 dan ortiq belgi)

Uchta qoida:
1. **Har bir muhim akkaunt uchun alohida parol.** Bitta sayt buzilsa, qolganlari xavfsiz qoladi.
2. **Parol menejeridan foydalaning** (masalan Bitwarden, telefoningizdagi oʻrnatilgan menejer). Shunda faqat bitta kuchli parolni eslab qolasiz.
3. **Parolni hech kimga aytmang**, hatto "texnik yordam"ga ham.

## 4. MFA: ikkinchi qulf

MFA (Multi-Factor Authentication) da tizimga kirish uchun parol bilan birga yana bir narsa kerak boʻladi:
- siz **biladigan** narsa (parol, PIN);
- sizda **bor** narsa (telefon, ilova, kalit);
- siz **oʻzingiz** (barmoq izi, yuz).

Parol oʻgʻirlansa ham, hujumchida ikkinchi omil boʻlmaydi. Shu sababli MFA eng foydali himoya choralaridan biridir.

MFA turlari, kuchsizdan kuchliga:
- **SMS kod:** hech narsadan yaxshi, lekin SIM-karta almashtirish va kodni soʻrab olish orqali chetlab oʻtilishi mumkin.
- **Ilova kodi** (Google Authenticator, Microsoft Authenticator): ancha xavfsiz.
- **Push-tasdiqlash** ("Kirishni tasdiqlaysizmi?"): qulay, lekin hujumchi ketma-ket soʻrov yuborib, foydalanuvchini charchatib "Ha" bosdirishi mumkin (MFA fatigue). Siz soʻramagan soʻrovni hech qachon tasdiqlamang.
- **Jismoniy kalit** (passkey, FIDO2): fishingga eng chidamli.

## 5. Tergov: "Night shift at the VPN gateway"

Platformada **Investigations → Night shift at the VPN gateway** (`vpn-password-spray`) tergovini oching. Ssenariy: kompaniyaning VPN shlyuzida bitta manzildan koʻplab muvaffaqiyatsiz kirish urinishlari, keyin bitta muvaffaqiyatli kirish. Sizning vazifangiz: kim kirdi va nima uchun bu mumkin boʻldi.

Tergovda eʼtibor bering:
- Urinishlar **bitta foydalanuvchiga** emas, **koʻp foydalanuvchiga** qilinganmi? (Spraying belgisi.)
- Muvaffaqiyatli kirgan akkauntda MFA bormi?
- Kirish vaqti va manzili odatdagi ishchi xatti-harakatiga mos keladimi?

Barcha maʼlumotlar oʻylab topilgan. Tergovni tugatgach, "Debrief" boʻlimini oʻqing va xulosangiz bilan solishtiring.

**Yozma topshiriq (1 hafta):** 5–8 gapda tergov xulosasini yozing: nima boʻldi, qanday dalil bor, qanday xavf bor, qanday 2 ta chora koʻrish kerak.

## 6. Bilimni tekshirish

1. Autentifikatsiya qaysi savolga javob beradi?
   - a) **Siz kimsiz?** b) Sizga nima qilish mumkin? c) Siz qayerdasiz?
2. Qaysi parol eng kuchli?
   - a) `Qwerty2026!` b) `Sardor_1999` c) **`olma-kitob-shamol-daryo-yashil`**
3. Nima uchun har bir sayt uchun alohida parol kerak?
   - a) Saytlar shuni talab qiladi b) **Bitta sayt buzilsa, boshqa akkauntlar xavfsiz qoladi** c) Parollar tez eskiradi
4. Hujumchi bitta parolni 300 ta akkauntda sinadi, har biriga bir marta. Bu …
   - a) Fishing b) **Password spraying** c) Maʼlumotlar sizishi
5. Qaysi MFA turi fishingga eng chidamli?
   - a) SMS kod b) Push-tasdiqlash c) **Jismoniy kalit yoki passkey**
6. Tunda telefoningizga "Kirishni tasdiqlaysizmi?" soʻrovi keldi, siz hech qayerga kirmayapsiz. Nima qilasiz?
   - a) Tasdiqlaysiz, keyin tekshirasiz
   - b) **Rad etasiz va darhol parolni almashtirasiz**
   - c) Eʼtibor bermaysiz
   *Izoh: soʻrov kelgan boʻlsa, hujumchi parolingizni allaqachon bilishi mumkin.*
7. Toʻgʻri yoki notoʻgʻri: bank xodimi qoʻngʻiroq qilib SMS kodni soʻrasa, uni aytish xavfsiz. **Notoʻgʻri.**
8. Loglarda bitta IP manzildan 40 ta turli foydalanuvchiga bittadan muvaffaqiyatsiz kirish, keyin bitta muvaffaqiyatli kirish koʻrinmoqda. Birinchi qadam qaysi?
   - a) Hech narsa qilmaslik, chunki faqat bitta muvaffaqiyat bor
   - b) **Muvaffaqiyatli kirgan akkauntni tekshirish, sessiyalarini toʻxtatish va parolini almashtirish**
   - c) Barcha 40 foydalanuvchini oʻchirib tashlash

## 7. Xulosa

- Parollar sizish, fishing, taxmin va spraying orqali qoʻlga tushadi.
- Uzun ibora + har akkauntga alohida parol + parol menejeri.
- MFA parol oʻgʻirlanganda ham himoya qiladi. Soʻramagan tasdiqni hech qachon bosmang.
- Loglarda "koʻp akkaunt, kam urinish" spraying belgisi.

## Qoʻshimcha manbalar

- NIST SP 800-63B: parol siyosati boʻyicha rasmiy tavsiyalar (inglizcha). https://pages.nist.gov/800-63-4/sp800-63b.html
- Have I Been Pwned: emailingiz maʼlum sizishlarda bormi, tekshirish (faqat oʻz emailingizni). https://haveibeenpwned.com
