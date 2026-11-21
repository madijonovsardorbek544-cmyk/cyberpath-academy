# 5-dars. Operatsion tizimlar, fayllar va ruxsatlar (Linux asoslari)

> Qoralama. Native speaker va mutaxassis tekshiruvi kerak.

**Davomiyligi:** 30 daqiqa oʻqish + 20 daqiqa terminal mashqi

## Dars maqsadlari

1. Operatsion tizim nima qilishini va nima uchun xavfsizlik uchun muhimligini tushuntira olasiz.
2. Linux fayl tizimining asosiy papkalarini (`/home`, `/etc`, `/var/log`) bilasiz.
3. Fayl ruxsatlarini (`rwx`) oʻqiy olasiz va "eng kam imtiyoz" tamoyilini qoʻllay olasiz.
4. Terminalda `pwd`, `ls`, `cd`, `cat`, `head` buyruqlari bilan fayllarni koʻra olasiz.

## 1. Operatsion tizim nima qiladi?

**Operatsion tizim (OT)** bu dasturlar va kompyuter qurilmalari orasidagi vositachi. U xotirani taqsimlaydi, dasturlarni ishga tushiradi, fayllarni saqlaydi va eng muhimi, **kim nimaga kira olishini** nazorat qiladi.

Eng keng tarqalgan OT lar:
- **Windows:** ofis kompyuterlarining aksariyatida.
- **Linux:** serverlarning katta qismida, bulut xizmatlarida, routerlarda, Android ichida.
- **macOS** va **iOS:** Apple qurilmalarida.

Xavfsizlik mutaxassisi uchun Linux ayniqsa muhim: veb-saytlar, maʼlumotlar bazalari va xavfsizlik vositalarining koʻpi Linux da ishlaydi. Shu sababli loglarni oʻqish va tergov qilish koʻpincha Linux terminalida bajariladi.

## 2. Linux fayl tizimi

Linux da hamma narsa bitta ildizdan (`/`) boshlanadigan daraxtda joylashgan. Disk harflari (`C:`, `D:`) yoʻq.

| Papka | Nima saqlanadi | Xavfsizlik nuqtai nazaridan |
| --- | --- | --- |
| `/home/ism` | Foydalanuvchining shaxsiy fayllari | Boshqa foydalanuvchilar odatda koʻra olmasligi kerak |
| `/etc` | Sozlama fayllari | Xizmatlar qanday sozlanganini shu yerdan bilish mumkin |
| `/var/log` | Loglar (jurnal yozuvlari) | Tergovning asosiy manbai |
| `/tmp` | Vaqtinchalik fayllar | Hamma yoza oladi, shubhali fayllar koʻpincha shu yerda paydo boʻladi |
| `/root` | Administratorning uy papkasi | Faqat administrator kirishi kerak |

**Yoʻl (path)** faylning manzili. `/var/log/auth.log` bu "ildiz → var → log → auth.log". Hozir qaysi papkada turganingizni `pwd` koʻrsatadi.

## 3. Foydalanuvchilar va ruxsatlar

Linux da har bir fayl va papkaning **egasi**, **guruhi** va **ruxsatlari** bor. `ls -l` natijasini koʻrib chiqamiz:

```
-rw-r----- 1 aziza finance 2048 Mar 14 09:10 maosh-2026.csv
```

Birinchi 10 ta belgi:
- `-` oddiy fayl (`d` boʻlsa papka)
- `rw-` **egasi** (aziza): oʻqiy oladi (r), yoza oladi (w), ishga tushira olmaydi (-)
- `r--` **guruh** (finance): faqat oʻqiy oladi
- `---` **boshqalar:** hech narsa qila olmaydi

Bu yaxshi sozlangan fayl: maosh jadvalini faqat egasi oʻzgartiradi, moliya boʻlimi koʻradi, boshqalar umuman koʻrmaydi.

Xavfli holat:
```
-rw-rw-rw- 1 aziza finance 2048 Mar 14 09:10 maosh-2026.csv
```
Endi tizimdagi **har qanday** foydalanuvchi (va har qanday buzilgan dastur) maosh jadvalini oʻqiy va oʻzgartira oladi. Bu maxfiylik ham, yaxlitlik ham buzilishi demak (1-darsdagi CIA).

**root** Linux dagi eng kuchli foydalanuvchi: unga hamma narsa mumkin. Shuning uchun kundalik ish oddiy foydalanuvchi sifatida qilinadi, administrator huquqlari faqat kerak boʻlganda `sudo` orqali olinadi.

## 4. Eng kam imtiyoz tamoyili

**Least privilege (eng kam imtiyoz):** har bir foydalanuvchi va dastur faqat oʻz ishini bajarish uchun kerak boʻlgan huquqlarga ega boʻlishi kerak. Ortiqcha emas.

Misollar:
- Veb-sayt dasturi maʼlumotlar bazasini oʻqishi kerak, lekin butun serverni boshqarishi shart emas.
- Stajyor sotuv hisobotlarini koʻrishi kerak, lekin maosh jadvalini emas.
- Zaxira nusxa (backup) uchun xizmat akkaunti fayllarni oʻqiydi, lekin VPN orqali kirishi shart emas.

Buzgʻunchi bitta akkauntni qoʻlga kiritsa, u faqat shu akkauntning huquqlari bilan cheklanadi. Shuning uchun eng kam imtiyoz zarar hajmini kichraytiradi.

## 5. Terminal: birinchi buyruqlar

| Buyruq | Nima qiladi | Misol |
| --- | --- | --- |
| `pwd` | Hozirgi papkani koʻrsatadi | `pwd` |
| `ls` | Papkadagi fayllar roʻyxati | `ls` |
| `cd` | Boshqa papkaga oʻtish | `cd /case` |
| `cat` | Faylni toʻliq chiqaradi | `cat directory-export.csv` |
| `head` / `tail` | Faylning boshi / oxiri | `head -3 vpn-gw01.log` |
| `wc -l` | Qatorlar sonini sanaydi | `wc -l vpn-gw01.log` |

Katta-kichik harf muhim: `Log.txt` va `log.txt` ikki xil fayl.

## 6. Amaliy mashq

Platformada **Investigations → Night shift at the VPN gateway** (`vpn-password-spray`) tergovini oching va **Evidence terminal** ga kiring. Terminal faqat oʻqish uchun, real tizimga ulanmagan.

```
pwd
ls
head -3 vpn-gw01.log
wc -l vpn-gw01.log
cat directory-export.csv
grep -v ",enrolled," directory-export.csv
cut -d , -f1,3 directory-export.csv
```

Savollar:
1. Siz qaysi papkadasiz va unda qanday fayllar bor?
2. VPN logida nechta qator bor?
3. `directory-export.csv` dagi ustunlar qaysilar?
4. Qaysi foydalanuvchilarda MFA yoqilmagan yoki istisno qilingan? Ularning boʻlimi qaysi? (Nima uchun `grep -v enrolled` ishlamaydi? Maslahat: `not_enrolled` soʻzining ichida ham `enrolled` bor.)
5. Eng kam imtiyoz nuqtai nazaridan, `svc.backup` kabi xizmat akkauntiga VPN orqali kirish huquqi kerakmi? Bir gapda javob bering.

## 7. Bilimni tekshirish

1. Linux da loglar odatda qaysi papkada saqlanadi?
   - a) `/home` b) **`/var/log`** c) `/etc`
2. `pwd` buyrugʻi nima qiladi?
   - a) Parolni oʻzgartiradi b) **Hozirgi papkani koʻrsatadi** c) Faylni oʻchiradi
3. `-rw-r-----` ruxsatida guruh nima qila oladi?
   - a) Oʻqish va yozish b) **Faqat oʻqish** c) Hech narsa
4. `-rw-rw-rw-` ruxsatli maosh fayli qanday xavf tugʻdiradi?
   - a) Hech qanday b) **Har qanday foydalanuvchi uni oʻqiy va oʻzgartira oladi** c) Faqat fayl sekin ochiladi
5. Eng kam imtiyoz tamoyili nimani anglatadi?
   - a) Hamma foydalanuvchiga bir xil huquq berish b) **Har kimga faqat ishi uchun kerakli huquqni berish** c) Administrator akkauntidan kundalik foydalanish
6. Nima uchun kundalik ish root sifatida qilinmaydi?
   - a) root sekin ishlaydi b) **Xato yoki buzilgan dastur butun tizimga zarar yetkazishi mumkin** c) root akkaunti pullik
7. Toʻgʻri yoki notoʻgʻri: Linux da `Report.txt` va `report.txt` bitta fayl. **Notoʻgʻri.**
8. `/tmp` papkasi nima uchun tergovda alohida tekshiriladi?
   - a) U eng katta papka b) **Unga hamma yoza oladi, shubhali fayllar koʻpincha shu yerda paydo boʻladi** c) Unda parollar saqlanadi

## 8. Xulosa

- OT kim nimaga kira olishini nazorat qiladi. Serverlarning koʻpi Linux da.
- `/etc` sozlamalar, `/var/log` loglar, `/home` foydalanuvchilar.
- `rwx` ruxsatlari egasi, guruh va boshqalar uchun alohida beriladi.
- Eng kam imtiyoz: zarar boʻlsa ham, u kichik boʻlsin.

## Qoʻshimcha manbalar

- The Linux Command Line (William Shotts), bepul onlayn kitob (inglizcha). https://linuxcommand.org/tlcl.php
- OverTheWire Bandit: Linux buyruqlarini mashq qilish uchun xavfsiz oʻyin (inglizcha). https://overthewire.org/wargames/bandit/
