# 3-dars. Fishing: aldov xatlari va xabarlarni tanish

> Qoralama. Native speaker va mutaxassis tekshiruvi kerak.

**Davomiyligi:** 25 daqiqa oʻqish + 20 daqiqa tergov

## Dars maqsadlari

1. Fishing nima ekanini va nima uchun u eng keng tarqalgan hujum usuli ekanini tushuntira olasiz.
2. Email, SMS va Telegram xabarlarida fishingning 6 ta asosiy belgisini topa olasiz.
3. Email sarlavhalaridagi (headers) "From", "Reply-To" va domen farqini oʻqiy olasiz.
4. Shubhali xabar kelganda xavfsiz harakat tartibini bilasiz.

## 1. Fishing nima?

**Phishing (fishing)** bu odamni aldab, parol, karta maʼlumotlari, SMS kod yoki pul oʻtkazmasini olishga qaratilgan xabar. Hujumchi texnik zaiflikni emas, **inson ishonchini** ishlatadi. Shuning uchun eng yaxshi dastur ham fishingni toʻliq toʻxtata olmaydi: oxirgi qarorni odam qabul qiladi.

Turlari:
- **Email fishing:** "Hisobingiz bloklandi, shu yerga kiring."
- **Smishing (SMS):** "Sizga posilka keldi, yetkazib berish uchun 5 000 soʻm toʻlang: [havola]."
- **Telegram fishing:** "Ovoz bering, iltimos" degan havola orqali Telegram akkauntini oʻgʻirlash, yoki tanishingiz nomidan "qarz soʻrash".
- **Spear phishing:** aynan sizga moslab yozilgan xat (ismingiz, ish joyingiz, rahbaringiz nomi bilan).
- **BEC (Business Email Compromise):** buxgalteriyaga "yetkazib beruvchi" nomidan "bank rekvizitlarimiz oʻzgardi" degan xat.

## 2. Fishingning 6 ta belgisi

1. **Shoshiltirish yoki qoʻrqitish.** "24 soat ichida", "akkauntingiz oʻchiriladi", "jarima".
2. **Kutilmagan soʻrov.** Siz hech narsa buyurtma qilmagansiz, lekin "posilka" keldi.
3. **Yuboruvchi manzili mos emas.** Ism "Payme Support", manzil esa `payme-support@gmail.com` yoki `paymе.uz` (oxirgi "е" kirillcha harf).
4. **Havola boshqa joyga olib boradi.** Matnda `my.gov.uz`, havola esa `my-gov-uz.login-check.top`. Telefonda havolani bosmasdan, uzoq bosib manzilini koʻring.
5. **Maxfiy maʼlumot soʻrash.** SMS kod, karta CVV, parol. Haqiqiy tashkilotlar buni xat orqali soʻramaydi.
6. **Toʻlov rekvizitlari oʻzgargani haqida xabar.** Ayniqsa ishda: bu BEC ning asosiy belgisi.

Bitta belgi doim ham fishing degani emas. Lekin 2–3 ta belgi birga boʻlsa, **toʻxtang va tekshiring**.

## 3. Email sarlavhalari: "kimdan" haqiqatda kimdan?

Email dasturi sizga faqat chiroyli ismni koʻrsatadi. Sarlavhalarda (headers) haqiqiy maʼlumot bor:

- **From:** yuboruvchi manzili. Uni soxtalashtirish oson.
- **Reply-To:** "Javob berish" bosilganda xat qayerga ketadi. Agar From `buxgalteriya@hamkor.uz`, Reply-To esa `hamkor.buxgalter@outlook.com` boʻlsa, bu jiddiy ogohlantirish.
- **Return-Path** va **Received:** xat qaysi serverlardan oʻtganini koʻrsatadi.
- **SPF, DKIM, DMARC** natijalari (`Authentication-Results`): domen egasi bu serverga xat yuborishga ruxsat berganmi. `fail` boʻlsa, xat ehtimol soxta.

Gmailda: xatni oching → uch nuqta → "Show original" ("Asl nusxani koʻrsatish").

## 4. Shubhali xabar keldi. Nima qilasiz?

1. **Havolani bosmang, ilovani ochmang, javob bermang.**
2. Yuboruvchini **boshqa kanal orqali** tekshiring: rasmiy saytdagi telefon raqami, ilovaning oʻzi, yoki shaxsan.
3. Ishda boʻlsangiz, xatni IT yoki xavfsizlik boʻlimiga **xabar qiling** (oʻchirib yubormang, ular boshqalarni ham ogohlantirishi kerak).
4. Agar allaqachon parol kiritgan boʻlsangiz: darhol parolni almashtiring, boshqa qurilmalardagi sessiyalarni yoping va MFA yoqing. Karta maʼlumotini kiritgan boʻlsangiz, bankka qoʻngʻiroq qilib kartani bloklang.

Xato qilgan odamni ayblamang. Tez xabar bergan xodim tashkilotni qutqaradi; uyalib yashirgan xodim zararni oshiradi.

## 5. Tergov: "The urgent invoice"

Platformada **Investigations → The urgent invoice** (`invoice-bank-change-phish`) tergovini oching. Ssenariy: buxgalteriya xodimi "muddati oʻtgan hisob-faktura" xatini yangi bank rekvizitlari bilan yuborib, tekshirishni soʻraydi. Sarlavhalarni oʻqing va qaror qabul qiling.

Eʼtibor bering:
- From va Reply-To mos keladimi?
- Domen nomi haqiqiy hamkorniki bilan bir xilmi (harfma-harf)?
- SPF/DKIM/DMARC natijalari qanday?
- Xatda qanday shoshiltirish soʻzlari bor?

**Yozma topshiriq:** buxgalteriya xodimiga 5–7 gapdan iborat xabar yozing: bu xat nima uchun shubhali, nima qilmaslik kerak va toʻlovni qanday xavfsiz tekshirish kerak. Texnik boʻlmagan odam tushunadigan tilda yozing.

## 6. Bilimni tekshirish

1. Fishing asosan nimadan foydalanadi?
   - a) Server zaifliklaridan b) **Inson ishonchi va shoshilishidan** c) Wi-Fi tarmogʻidan
2. SMS: "Posilkangiz omborda. Yetkazish uchun 4 900 soʻm toʻlang: uzpost-delivery.top". Eng kuchli belgi qaysi?
   - a) Summa kichik b) **Domen rasmiy pochta saytiga oʻxshamaydi va siz posilka kutmayapsiz** c) Xabar oʻzbek tilida
3. From: `info@hamkor.uz`, Reply-To: `hamkor.uz.billing@gmail.com`. Bu nimani bildiradi?
   - a) Normal holat b) **Javoblar hujumchiga ketishi mumkin** c) Xat shifrlangan
4. `Authentication-Results: dmarc=fail` nimani anglatadi?
   - a) **Xat domen egasining ruxsatisiz yuborilgan boʻlishi mumkin** b) Xat juda katta c) Xat spamga tushgan, lekin xavfsiz
5. Rahbaringiz nomidan Telegram: "Hozir majlisdaman, tezda shu kartaga 2 mln oʻtkazib yubor." Toʻgʻri harakat?
   - a) Tezda oʻtkazasiz b) Telegramda "Siz rostdan siz misiz?" deb soʻraysiz c) **Rahbaringizga oddiy telefon qoʻngʻirogʻi yoki shaxsan tekshirasiz**
6. Siz fishing sahifasiga parolingizni kiritib qoʻydingiz. Birinchi ish?
   - a) Hech kimga aytmaslik b) **Darhol parolni almashtirish, sessiyalarni yopish va IT ga xabar berish** c) Kompyuterni oʻchirish
7. Toʻgʻri yoki notoʻgʻri: email ichidagi yuboruvchi ismi ("Payme Support") ishonchli dalil. **Notoʻgʻri.**
8. BEC hujumining eng xarakterli belgisi qaysi?
   - a) Xatda rasm bor b) **Toʻlov rekvizitlari oʻzgargani haqidagi kutilmagan xabar** c) Xat ingliz tilida

## 7. Xulosa

- Fishing odamni aldaydi. Shoshiltirish, kutilmagan soʻrov, mos kelmaydigan manzil va havola asosiy belgilar.
- Sarlavhalarda From, Reply-To va DMARC natijasini tekshiring.
- Shubha boʻlsa: bosmang, boshqa kanal orqali tekshiring, xabar bering.
- Xato qilgan boʻlsangiz, tez xabar bering. Bu uyat emas, professional harakat.

## Qoʻshimcha manbalar

- CISA, "Recognize and Report Phishing" (inglizcha). https://www.cisa.gov/secure-our-world/recognize-and-report-phishing
- Google, "Avoid and report phishing emails" (Gmail yordam markazi).
