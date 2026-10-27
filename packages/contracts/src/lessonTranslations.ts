// Uzbek (Latin) and Russian versions of the free Foundations lessons.
// A lesson without a translation falls back to English, field by field.
// Written for review by native speakers before wide release; keep wording plain and defensive.

export type ContentLocale = 'en' | 'uz' | 'ru';
export const contentLocales: ContentLocale[] = ['en', 'uz', 'ru'];

export type LessonTranslation = {
  title: string;
  phaseTitle: string;
  content: string;
  learningObjectives: string[];
  glossary: Array<{ term: string; definition: string }>;
  examples: string[];
  knowledgeChecks: string[];
  commonMistakes: string;
  whyItMatters: string;
};

type TranslatableLesson = { slug: string } & Partial<LessonTranslation>;

export function resolveContentLocale(value: unknown): ContentLocale {
  return contentLocales.includes(value as ContentLocale) ? (value as ContentLocale) : 'en';
}

/** Returns the lesson in the requested language when a translation exists, plus which language was served. */
export function localizeLesson<T extends TranslatableLesson>(lesson: T, locale: ContentLocale): T & { contentLocale: ContentLocale } {
  const translation = locale === 'en' ? undefined : lessonTranslations[locale][lesson.slug];
  return translation ? { ...lesson, ...translation, contentLocale: locale } : { ...lesson, contentLocale: 'en' };
}

export const lessonTranslations: Record<'uz' | 'ru', Record<string, LessonTranslation>> = {
  uz: {
    'what-is-cybersecurity': {
      title: 'Kiberxavfsizlik nima?',
      phaseTitle: 'Asoslar',
      content: 'Kiberxavfsizlik — maʼlumotlar, qurilmalar, tarmoqlar va ularga tayanadigan odamlarni zarardan himoya qilish ishi. U faqat texnologiya emas: odamlar, jarayonlar va texnologiya birgalikda ishlaganda himoya kuchli bo‘ladi. Masalan, eng yaxshi antivirus ham xodim parolini firibgarga aytib qo‘ysa yordam bermaydi. Himoyachi har kuni oddiy savollarni beradi: nimani himoya qilyapmiz, unga nima tahdid soladi va xavfni qanday kamaytiramiz? Bu kursda biz faqat ruxsat berilgan, o‘quv muhitida mashq qilamiz va real tizimlarga hech qachon tegmaymiz.',
      learningObjectives: [
        'Kiberxavfsizlikni oddiy so‘zlar bilan tushuntirish.',
        'Odamlar, jarayonlar va texnologiya himoyada qanday birga ishlashini ko‘rsatish.',
        'Himoyachi fikrlash tarzi hujumchi fikrlashidan qanday farq qilishini aytib berish.',
        'Nega faqat ruxsat berilgan muhitda mashq qilish kerakligini tushuntirish.'
      ],
      glossary: [
        { term: 'Kiberxavfsizlik', definition: 'Maʼlumot va tizimlarni ruxsatsiz kirish, o‘zgartirish va to‘xtab qolishdan himoya qilish.' },
        { term: 'Odamlar, jarayonlar, texnologiya', definition: 'Himoyaning uch tayanchi: bilimli xodimlar, aniq qoidalar va to‘g‘ri sozlangan vositalar.' },
        { term: 'Himoyachi fikrlash', definition: 'Avval nimani himoya qilishni, keyin xavfni qanday kamaytirishni o‘ylash.' },
        { term: 'Ruxsat berilgan mashq', definition: 'Faqat egasi ruxsat bergan yoki o‘quv uchun yaratilgan tizimlarda ishlash.' }
      ],
      examples: [
        '1-misol: Buxgalter shubhali xatni ochmasdan IT bo‘limiga xabar beradi. Bu “odamlar” qismi ishlaganini ko‘rsatadi.',
        '2-misol: Kompaniya yangi xodimlarga kirish huquqini faqat rahbar tasdiqlagandan keyin beradi. Bu “jarayon”.',
        '3-misol: Noutbuklarda disk shifrlash yoqilgan, shuning uchun yo‘qolgan qurilmadagi maʼlumotni o‘qib bo‘lmaydi. Bu “texnologiya”.'
      ],
      knowledgeChecks: [
        'Kiberxavfsizlikni bir gap bilan tushuntiring.',
        'Nega faqat texnologiya yetarli emas? Bitta misol keltiring.',
        'Himoyachi har kuni qaysi uchta savolni beradi?',
        'Nega real saytlarda “sinab ko‘rish” noto‘g‘ri va noqonuniy bo‘lishi mumkin?'
      ],
      commonMistakes: 'Ko‘p o‘quvchilar kiberxavfsizlikni faqat “xakerlik” deb o‘ylashadi. Aslida ishning katta qismi himoya: qoidalar yozish, loglarni o‘qish, odamlarni o‘qitish va xatolarni oldini olish.',
      whyItMatters: 'Har bir tashkilot raqamli tizimlarga tayanadi. Himoyani tushunadigan mutaxassis ish beruvchilar uchun qimmatli, chunki u xavfni oldindan ko‘radi va xotirjam qaror qabul qiladi.'
    },
    'cia-triad': {
      title: 'CIA uchligi',
      phaseTitle: 'Asoslar',
      content: 'CIA uchligi — xavfsizlikning uchta asosiy maqsadi. Maxfiylik (Confidentiality): maʼlumotni faqat ruxsati bor odamlar ko‘radi. Yaxlitlik (Integrity): maʼlumot ruxsatsiz o‘zgartirilmaydi va to‘g‘riligicha qoladi. Mavjudlik (Availability): kerakli paytda tizim va maʼlumot ishlaydi. Har bir hodisani shu uch savol orqali tahlil qilish mumkin: kim ko‘rdi, nima o‘zgardi, nima ishlamay qoldi? Ko‘pincha bu maqsadlar o‘rtasida murosaga kelish kerak bo‘ladi: juda qattiq himoya foydalanishni qiyinlashtirishi mumkin.',
      learningObjectives: [
        'Maxfiylik, yaxlitlik va mavjudlikni o‘z so‘zlaringiz bilan taʼriflash.',
        'Har bir hodisani CIA nuqtai nazaridan tasniflash.',
        'Har bir maqsad uchun bitta himoya vositasini nomlash.',
        'Maqsadlar o‘rtasidagi murosani misolda ko‘rsatish.'
      ],
      glossary: [
        { term: 'Maxfiylik', definition: 'Maʼlumotni faqat ruxsat berilgan odamlar ko‘ra olishi.' },
        { term: 'Yaxlitlik', definition: 'Maʼlumot to‘g‘ri va ruxsatsiz o‘zgartirilmagan bo‘lishi.' },
        { term: 'Mavjudlik', definition: 'Tizim va maʼlumot kerak bo‘lganda ishlashi.' },
        { term: 'Murosa', definition: 'Bir maqsadni kuchaytirish boshqasini zaiflashtirishi mumkinligi.' }
      ],
      examples: [
        '1-misol: Talabalar baholari ochiq papkada qolib ketdi. Bu maxfiylik buzilishi.',
        '2-misol: Kimdir to‘lov rekvizitlarini almashtirdi. Bu yaxlitlik buzilishi.',
        '3-misol: Imtihon kuni o‘quv platformasi ishlamay qoldi. Bu mavjudlik muammosi.'
      ],
      knowledgeChecks: [
        'Maxfiylik va yaxlitlik o‘rtasidagi farq nima?',
        'Zaxira nusxa (backup) qaysi maqsadni qo‘llab-quvvatlaydi?',
        'Fidyaviy dastur (ransomware) CIA ning qaysi qismlariga taʼsir qiladi?',
        'Juda qattiq parol qoidasi mavjudlikka qanday zarar keltirishi mumkin?'
      ],
      commonMistakes: 'Har bir muammoni faqat “maʼlumot o‘g‘irlandi” deb ko‘rish. Ko‘p hodisalar yaxlitlik yoki mavjudlikka tegishli, va ularning yechimi ham boshqacha.',
      whyItMatters: 'CIA — hodisa haqida aniq gapirish uchun umumiy til. Hisobotda “mavjudlik 2 soat buzildi” deyish “nimadir buzildi” deyishdan ancha foydali.'
    },
    'risk-assets-threats': {
      title: 'Aktivlar, tahdidlar, zaifliklar va xavf',
      phaseTitle: 'Asoslar',
      content: 'Aktiv — tashkilot uchun qimmatli narsa: maʼlumot, server, xodim yoki obro‘. Tahdid — zarar keltirishi mumkin bo‘lgan sabab: firibgar, yong‘in yoki xodim xatosi. Zaiflik — tahdid foydalanishi mumkin bo‘lgan kamchilik: yangilanmagan dastur yoki zaif parol. Xavf esa ehtimollik va taʼsir birikmasidir: tahdid zaiflikka qanchalik tez-tez duch keladi va bu qanchalik qimmatga tushadi. Xavfni kamaytirish, boshqaga o‘tkazish (masalan, sug‘urta), qabul qilish yoki undan voz kechish mumkin.',
      learningObjectives: [
        'Aktiv, tahdid va zaiflikni farqlash.',
        'Xavfni ehtimollik va taʼsir orqali baholash.',
        'Xavfga qarshi to‘rtta yo‘lni nomlash.',
        'Oddiy xavf reyestri qatorini to‘ldirish.'
      ],
      glossary: [
        { term: 'Aktiv', definition: 'Tashkilot uchun qimmatli bo‘lgan har qanday narsa.' },
        { term: 'Tahdid', definition: 'Zarar keltirishi mumkin bo‘lgan sabab yoki shaxs.' },
        { term: 'Zaiflik', definition: 'Tahdid foydalanishi mumkin bo‘lgan kamchilik.' },
        { term: 'Xavf', definition: 'Ehtimollik va taʼsirning birikmasi.' }
      ],
      examples: [
        '1-misol: Mijozlar bazasi — aktiv, firibgar — tahdid, administratorning zaif paroli — zaiflik.',
        '2-misol: Server xonasi suv bosishi mumkin bo‘lgan yerda. Kompaniya serverlarni boshqa qavatga ko‘chirib, xavfni kamaytiradi.',
        '3-misol: Eski printerni yangilab bo‘lmaydi. Kompaniya uni alohida tarmoqqa ajratib, qolgan xavfni yozma ravishda qabul qiladi.'
      ],
      knowledgeChecks: [
        'Zaif parol aktivmi, tahdidmi yoki zaiflikmi?',
        'Ehtimollik past, taʼsiri juda katta xavfga misol keltiring.',
        'Sug‘urta xavfga qarshi qaysi yo‘lga misol?',
        'Nega har bir xavfni nolga tushirish shart emas?'
      ],
      commonMistakes: 'Tahdid va zaiflikni aralashtirish. Tahdidni odatda boshqara olmaymiz, lekin zaifliklarni tuzatish bizning qo‘limizda.',
      whyItMatters: 'Byudjet va vaqt cheklangan. Xavfni to‘g‘ri baholagan mutaxassis eng muhim muammoni birinchi hal qiladi.'
    },
    'identity-access-basics': {
      title: 'Autentifikatsiya va avtorizatsiya',
      phaseTitle: 'Asoslar',
      content: 'Autentifikatsiya — “siz kimsiz?” degan savolga javob: parol, barmoq izi yoki telefon kodi orqali shaxsni tasdiqlash. Avtorizatsiya — “sizga nima qilishga ruxsat bor?” degan savol: tizimga kirgandan keyin qaysi fayl va amallar ochiq. Eng kam huquq tamoyili har bir odam va dasturga faqat ishi uchun kerakli huquqni berishni talab qiladi. Shunda hisob o‘g‘irlansa ham zarar kichik bo‘ladi.',
      learningObjectives: [
        'Autentifikatsiya va avtorizatsiyani farqlash.',
        'Shaxsni tasdiqlashning uch turini nomlash.',
        'Eng kam huquq tamoyilini misolda tushuntirish.',
        'Ortiqcha huquqni kirish ro‘yxatida topish.'
      ],
      glossary: [
        { term: 'Identifikatsiya', definition: 'O‘zingizni tanishtirish, masalan, foydalanuvchi nomini kiritish.' },
        { term: 'Autentifikatsiya', definition: 'Shaxsingizni isbotlash.' },
        { term: 'Avtorizatsiya', definition: 'Tasdiqlangan foydalanuvchiga nima ruxsat etilganini aniqlash.' },
        { term: 'Eng kam huquq', definition: 'Faqat ish uchun zarur bo‘lgan minimal huquqni berish.' }
      ],
      examples: [
        '1-misol: Talaba platformaga parol bilan kiradi — bu autentifikatsiya.',
        '2-misol: Talaba o‘z baholarini ko‘radi, lekin boshqalarnikini o‘zgartira olmaydi — bu avtorizatsiya.',
        '3-misol: Amaliyotchiga butun moliya papkasi emas, faqat bitta hisobot papkasi ochiladi — bu eng kam huquq.'
      ],
      knowledgeChecks: [
        'Autentifikatsiya va avtorizatsiyani bir gap bilan farqlang.',
        'Barmoq izi qaysi turdagi isbot hisoblanadi?',
        'Nega hamma xodimga administrator huquqini berish xavfli?',
        'Xodim boshqa bo‘limga o‘tganda huquqlari bilan nima qilish kerak?'
      ],
      commonMistakes: 'Tizimga kirgan har bir foydalanuvchiga ishonish. Kirish faqat birinchi qadam; har bir amalda huquq server tomonida tekshirilishi kerak.',
      whyItMatters: 'Ko‘p hodisalar o‘g‘irlangan hisob orqali boshlanadi. To‘g‘ri sozlangan huquqlar shunday hodisani kichik muammo bilan to‘xtatadi.'
    },
    'passwords-mfa-and-phishing': {
      title: 'Parollar, MFA va fishingdan himoya',
      phaseTitle: 'Asoslar',
      content: 'Yaxshi parol uzun va har bir sayt uchun boshqacha bo‘ladi; parol menejeri ularni eslab qolishga yordam beradi. Ko‘p faktorli autentifikatsiya (MFA) paroldan tashqari yana bir isbot so‘raydi, masalan, ilovadagi kod. Shunda parol o‘g‘irlansa ham hisob himoyalangan qoladi. Fishing — odamni aldab parol, pul yoki maʼlumot olishga urinish. Belgilari: shoshiltirish, notanish yuboruvchi, soxta havola va g‘alati so‘rov. Shubha bo‘lsa, havolani bosmang va xatni xavfsizlik bo‘limiga yuboring.',
      learningObjectives: [
        'Kuchli parolning belgilarini aytib berish.',
        'MFA nima uchun foydali ekanini tushuntirish.',
        'Fishing xatning kamida to‘rtta belgisini topish.',
        'Shubhali xat bilan nima qilish kerakligini bilish.'
      ],
      glossary: [
        { term: 'Parol menejeri', definition: 'Uzun va noyob parollarni xavfsiz saqlaydigan dastur.' },
        { term: 'MFA', definition: 'Kirish uchun bir nechta isbot talab qilish, masalan parol va kod.' },
        { term: 'Fishing', definition: 'Odamni aldab xavfli harakat qildirishga urinish.' },
        { term: 'Zaxira kodlar', definition: 'Telefon yo‘qolganda hisobga kirish uchun oldindan saqlangan kodlar.' }
      ],
      examples: [
        '1-misol: Xodim barcha saytlarda bitta paroldan foydalanadi. Bitta sayt buzilganda, hamma hisoblari xavf ostida qoladi.',
        '2-misol: Firibgar parolni bilib oldi, lekin MFA kodi bo‘lmagani uchun kira olmadi.',
        '3-misol: “Hisobingiz 2 soatda bloklanadi” degan xatdagi havola bankning emas, boshqa domenga olib boradi. Xodim xatni xavfsizlik bo‘limiga yuboradi.'
      ],
      knowledgeChecks: [
        'Nega uzun parol murakkab qisqa paroldan yaxshiroq?',
        'MFA qanday hujumni to‘xtatadi?',
        'Fishing xatning ikkita belgisini ayting.',
        'Havolani bosib qo‘ygan bo‘lsangiz, birinchi navbatda nima qilasiz?'
      ],
      commonMistakes: 'Xato qilgan xodimni uyaltirish. Odamlar tez xabar berishi uchun ular qo‘rqmasligi kerak; tez xabar berish zararni kamaytiradi.',
      whyItMatters: 'Ko‘p hujumlar texnik zaiflikdan emas, aldangan odamdan boshlanadi. Kuchli parol, MFA va ehtiyotkor xodimlar eng arzon va eng samarali himoya.'
    },
    'device-hygiene': {
      title: 'Raqamli xavfsizlik va qurilma gigiyenasi',
      phaseTitle: 'Asoslar',
      content: 'Qurilma gigiyenasi — har kungi oddiy odatlar: tizim va dasturlarni o‘z vaqtida yangilash, ekran qulfini yoqish, faqat ishonchli manbalardan dastur o‘rnatish va muhim fayllarning zaxira nusxasini saqlash. Yangilanishlar maʼlum zaifliklarni yopadi, shuning uchun ularni kechiktirish xavfni oshiradi. Zaxira nusxa qurilma buzilganda yoki fidyaviy dastur fayllarni shifrlaganda yordam beradi, lekin faqat uni tiklab ko‘rgan bo‘lsangiz.',
      learningObjectives: [
        'Yangilanishlar nima uchun muhimligini tushuntirish.',
        'Qurilma uchun asosiy xavfsizlik sozlamalarini sanab berish.',
        '3-2-1 zaxira qoidasini tushuntirish.',
        'Xavfsiz brauzerlash odatlarini misolda ko‘rsatish.'
      ],
      glossary: [
        { term: 'Yangilanish', definition: 'Xatolar va zaifliklarni tuzatadigan dastur versiyasi.' },
        { term: 'Ekran qulfi', definition: 'Qurilmadan foydalanish uchun PIN yoki parol talab qilish.' },
        { term: 'Zaxira nusxa', definition: 'Fayllarning alohida joyda saqlangan nusxasi.' },
        { term: '3-2-1 qoidasi', definition: '3 nusxa, 2 xil saqlash vositasi, 1 nusxa boshqa joyda.' }
      ],
      examples: [
        '1-misol: Brauzer yangilanishini bir oy kechiktirgan xodim maʼlum zaiflikka ochiq qoladi.',
        '2-misol: Kafeda qoldirilgan noutbuk ekran qulfi va disk shifrlash tufayli begona odamga hech narsa bermaydi.',
        '3-misol: Maktab haftada bir zaxira nusxani tiklab ko‘radi va u ishlashiga ishonch hosil qiladi.'
      ],
      knowledgeChecks: [
        'Nega yangilanishlarni kechiktirish xavfli?',
        '3-2-1 qoidasini o‘z so‘zlaringiz bilan tushuntiring.',
        'Notanish saytdan dastur yuklash nima uchun xavfli?',
        'Zaxira nusxani nega tiklab ko‘rish kerak?'
      ],
      commonMistakes: 'Zaxira nusxa borligini bilib, uni hech qachon tiklab ko‘rmaslik. Tiklanmaydigan zaxira — zaxira emas.',
      whyItMatters: 'Oddiy odatlar ko‘p hujumlarni boshlanishidan oldin to‘xtatadi. Bu har bir xodim va o‘quvchi qila oladigan eng birinchi himoya.'
    }
  },
  ru: {
    'what-is-cybersecurity': {
      title: 'Что такое кибербезопасность?',
      phaseTitle: 'Основы',
      content: 'Кибербезопасность — это защита данных, устройств, сетей и людей, которые от них зависят. Это не только технологии: защита работает, когда вместе действуют люди, процессы и технологии. Даже лучший антивирус не поможет, если сотрудник сообщит пароль мошеннику. Защитник каждый день задаёт простые вопросы: что мы защищаем, что ему угрожает и как снизить риск? В этом курсе мы тренируемся только в разрешённой учебной среде и никогда не трогаем реальные системы.',
      learningObjectives: [
        'Объяснить кибербезопасность простыми словами.',
        'Показать, как люди, процессы и технологии работают вместе.',
        'Объяснить, чем мышление защитника отличается от мышления атакующего.',
        'Объяснить, почему тренироваться можно только в разрешённой среде.'
      ],
      glossary: [
        { term: 'Кибербезопасность', definition: 'Защита данных и систем от несанкционированного доступа, изменения и простоя.' },
        { term: 'Люди, процессы, технологии', definition: 'Три опоры защиты: обученные сотрудники, понятные правила и правильно настроенные инструменты.' },
        { term: 'Мышление защитника', definition: 'Сначала понять, что защищаем, затем — как снизить риск.' },
        { term: 'Разрешённая практика', definition: 'Работа только с системами, владелец которых дал разрешение, или с учебными стендами.' }
      ],
      examples: [
        'Пример 1: Бухгалтер не открывает подозрительное письмо и сообщает в ИТ-отдел. Сработала часть «люди».',
        'Пример 2: Новым сотрудникам дают доступ только после одобрения руководителя. Это «процесс».',
        'Пример 3: На ноутбуках включено шифрование диска, поэтому данные с потерянного устройства не прочитать. Это «технология».'
      ],
      knowledgeChecks: [
        'Объясните кибербезопасность одним предложением.',
        'Почему одних технологий недостаточно? Приведите пример.',
        'Какие три вопроса защитник задаёт каждый день?',
        'Почему «проверять» реальные сайты без разрешения неправильно и может быть незаконно?'
      ],
      commonMistakes: 'Многие считают кибербезопасность только «хакерством». На деле большая часть работы — защита: правила, чтение журналов, обучение людей и предотвращение ошибок.',
      whyItMatters: 'Каждая организация зависит от цифровых систем. Специалист, понимающий защиту, ценен, потому что видит риск заранее и спокойно принимает решения.'
    },
    'cia-triad': {
      title: 'Триада CIA',
      phaseTitle: 'Основы',
      content: 'Триада CIA — три главные цели безопасности. Конфиденциальность (Confidentiality): данные видят только те, у кого есть право. Целостность (Integrity): данные не изменены без разрешения и остаются верными. Доступность (Availability): система и данные работают, когда они нужны. Любой инцидент можно разобрать через три вопроса: кто увидел, что изменилось, что перестало работать? Часто между целями приходится искать баланс: слишком жёсткая защита может мешать работе.',
      learningObjectives: [
        'Своими словами определить конфиденциальность, целостность и доступность.',
        'Классифицировать инцидент с точки зрения CIA.',
        'Назвать по одной мере защиты для каждой цели.',
        'Показать на примере компромисс между целями.'
      ],
      glossary: [
        { term: 'Конфиденциальность', definition: 'Данные доступны только тем, кому это разрешено.' },
        { term: 'Целостность', definition: 'Данные верны и не изменены без разрешения.' },
        { term: 'Доступность', definition: 'Система и данные работают, когда они нужны.' },
        { term: 'Компромисс', definition: 'Усиление одной цели может ослабить другую.' }
      ],
      examples: [
        'Пример 1: Оценки студентов оказались в открытой папке. Это нарушение конфиденциальности.',
        'Пример 2: Кто-то подменил платёжные реквизиты. Это нарушение целостности.',
        'Пример 3: В день экзамена учебная платформа не работала. Это проблема доступности.'
      ],
      knowledgeChecks: [
        'Чем конфиденциальность отличается от целостности?',
        'Какую цель поддерживает резервное копирование?',
        'На какие части CIA влияет программа-вымогатель?',
        'Как слишком строгая парольная политика может навредить доступности?'
      ],
      commonMistakes: 'Видеть в каждой проблеме только «утечку данных». Многие инциденты касаются целостности или доступности, и решаются они иначе.',
      whyItMatters: 'CIA — общий язык, чтобы точно говорить об инциденте. Фраза «доступность нарушена на 2 часа» в отчёте гораздо полезнее, чем «что-то сломалось».'
    },
    'risk-assets-threats': {
      title: 'Активы, угрозы, уязвимости и риск',
      phaseTitle: 'Основы',
      content: 'Актив — всё, что ценно для организации: данные, серверы, сотрудники, репутация. Угроза — возможная причина вреда: мошенник, пожар или ошибка сотрудника. Уязвимость — слабое место, которым может воспользоваться угроза: необновлённая программа или слабый пароль. Риск — сочетание вероятности и последствий: как часто угроза встретит уязвимость и во что это обойдётся. Риск можно снизить, передать (например, страховке), принять или избежать.',
      learningObjectives: [
        'Различать актив, угрозу и уязвимость.',
        'Оценивать риск через вероятность и последствия.',
        'Назвать четыре способа обработки риска.',
        'Заполнить строку простого реестра рисков.'
      ],
      glossary: [
        { term: 'Актив', definition: 'Всё, что представляет ценность для организации.' },
        { term: 'Угроза', definition: 'Причина или лицо, способное нанести вред.' },
        { term: 'Уязвимость', definition: 'Слабое место, которым может воспользоваться угроза.' },
        { term: 'Риск', definition: 'Сочетание вероятности и последствий.' }
      ],
      examples: [
        'Пример 1: База клиентов — актив, мошенник — угроза, слабый пароль администратора — уязвимость.',
        'Пример 2: Серверная находится там, где возможен потоп. Компания переносит серверы на другой этаж и снижает риск.',
        'Пример 3: Старый принтер нельзя обновить. Компания выносит его в отдельный сегмент сети и письменно принимает остаточный риск.'
      ],
      knowledgeChecks: [
        'Слабый пароль — это актив, угроза или уязвимость?',
        'Приведите пример риска с низкой вероятностью и очень большими последствиями.',
        'Страхование — пример какого способа обработки риска?',
        'Почему не каждый риск нужно снижать до нуля?'
      ],
      commonMistakes: 'Путать угрозу и уязвимость. Угрозами мы обычно не управляем, а вот исправить уязвимости в наших силах.',
      whyItMatters: 'Бюджет и время ограничены. Специалист, который правильно оценивает риск, первым решает самую важную проблему.'
    },
    'identity-access-basics': {
      title: 'Аутентификация и авторизация',
      phaseTitle: 'Основы',
      content: 'Аутентификация отвечает на вопрос «кто вы?»: личность подтверждается паролем, отпечатком пальца или кодом с телефона. Авторизация отвечает на вопрос «что вам разрешено?»: какие файлы и действия доступны после входа. Принцип наименьших привилегий требует давать каждому человеку и программе только те права, которые нужны для работы. Тогда даже при краже учётной записи ущерб будет небольшим.',
      learningObjectives: [
        'Различать аутентификацию и авторизацию.',
        'Назвать три типа подтверждения личности.',
        'Объяснить принцип наименьших привилегий на примере.',
        'Найти лишние права в списке доступа.'
      ],
      glossary: [
        { term: 'Идентификация', definition: 'Представиться системе, например ввести имя пользователя.' },
        { term: 'Аутентификация', definition: 'Доказать, что вы — это вы.' },
        { term: 'Авторизация', definition: 'Определить, что разрешено подтверждённому пользователю.' },
        { term: 'Наименьшие привилегии', definition: 'Выдавать только минимально необходимые права.' }
      ],
      examples: [
        'Пример 1: Студент входит на платформу по паролю — это аутентификация.',
        'Пример 2: Студент видит свои оценки, но не может менять чужие — это авторизация.',
        'Пример 3: Стажёру открывают не всю финансовую папку, а только папку с одним отчётом — это наименьшие привилегии.'
      ],
      knowledgeChecks: [
        'Объясните разницу между аутентификацией и авторизацией одним предложением.',
        'К какому типу подтверждения относится отпечаток пальца?',
        'Почему опасно давать всем сотрудникам права администратора?',
        'Что нужно сделать с правами сотрудника при переходе в другой отдел?'
      ],
      commonMistakes: 'Доверять каждому вошедшему пользователю. Вход — только первый шаг; права нужно проверять на сервере при каждом действии.',
      whyItMatters: 'Многие инциденты начинаются с украденной учётной записи. Правильно настроенные права превращают такой инцидент в небольшую проблему.'
    },
    'passwords-mfa-and-phishing': {
      title: 'Пароли, MFA и защита от фишинга',
      phaseTitle: 'Основы',
      content: 'Хороший пароль длинный и уникальный для каждого сайта; менеджер паролей помогает их хранить. Многофакторная аутентификация (MFA) требует ещё одно подтверждение кроме пароля, например код из приложения. Тогда даже украденный пароль не открывает учётную запись. Фишинг — попытка обманом получить пароль, деньги или данные. Признаки: срочность, незнакомый отправитель, поддельная ссылка и странная просьба. Если сомневаетесь, не переходите по ссылке и перешлите письмо в службу безопасности.',
      learningObjectives: [
        'Назвать признаки надёжного пароля.',
        'Объяснить, чем полезна MFA.',
        'Найти не менее четырёх признаков фишингового письма.',
        'Знать, что делать с подозрительным письмом.'
      ],
      glossary: [
        { term: 'Менеджер паролей', definition: 'Программа, которая безопасно хранит длинные уникальные пароли.' },
        { term: 'MFA', definition: 'Вход с несколькими подтверждениями, например пароль и код.' },
        { term: 'Фишинг', definition: 'Попытка обманом заставить человека совершить опасное действие.' },
        { term: 'Резервные коды', definition: 'Заранее сохранённые коды для входа, если телефон потерян.' }
      ],
      examples: [
        'Пример 1: Сотрудник использует один пароль на всех сайтах. Взлом одного сайта ставит под угрозу все его учётные записи.',
        'Пример 2: Мошенник узнал пароль, но не смог войти без кода MFA.',
        'Пример 3: Ссылка в письме «Ваш аккаунт заблокируют через 2 часа» ведёт не на домен банка. Сотрудник пересылает письмо в службу безопасности.'
      ],
      knowledgeChecks: [
        'Почему длинный пароль лучше короткого сложного?',
        'Какую атаку останавливает MFA?',
        'Назовите два признака фишингового письма.',
        'Что вы сделаете первым делом, если уже перешли по ссылке?'
      ],
      commonMistakes: 'Стыдить сотрудника за ошибку. Чтобы люди быстро сообщали о проблемах, они не должны бояться; быстрое сообщение уменьшает ущерб.',
      whyItMatters: 'Многие атаки начинаются не с технической уязвимости, а с обманутого человека. Надёжные пароли, MFA и внимательные сотрудники — самая дешёвая и эффективная защита.'
    },
    'device-hygiene': {
      title: 'Цифровая безопасность и гигиена устройств',
      phaseTitle: 'Основы',
      content: 'Гигиена устройств — простые ежедневные привычки: вовремя обновлять систему и программы, включать блокировку экрана, ставить программы только из надёжных источников и делать резервные копии важных файлов. Обновления закрывают известные уязвимости, поэтому откладывать их опасно. Резервная копия выручит, если устройство сломалось или вымогатель зашифровал файлы, но только если вы проверяли восстановление.',
      learningObjectives: [
        'Объяснить, почему важны обновления.',
        'Перечислить базовые настройки безопасности устройства.',
        'Объяснить правило резервного копирования 3-2-1.',
        'Показать на примере привычки безопасного просмотра сайтов.'
      ],
      glossary: [
        { term: 'Обновление', definition: 'Версия программы, исправляющая ошибки и уязвимости.' },
        { term: 'Блокировка экрана', definition: 'Требование PIN-кода или пароля для использования устройства.' },
        { term: 'Резервная копия', definition: 'Копия файлов, хранящаяся отдельно.' },
        { term: 'Правило 3-2-1', definition: '3 копии, 2 разных носителя, 1 копия в другом месте.' }
      ],
      examples: [
        'Пример 1: Сотрудник месяц откладывает обновление браузера и остаётся открытым для известной уязвимости.',
        'Пример 2: Ноутбук, забытый в кафе, ничего не даёт постороннему благодаря блокировке экрана и шифрованию диска.',
        'Пример 3: Школа раз в неделю пробует восстановить резервную копию и убеждается, что она работает.'
      ],
      knowledgeChecks: [
        'Почему опасно откладывать обновления?',
        'Объясните правило 3-2-1 своими словами.',
        'Чем опасна установка программ с незнакомого сайта?',
        'Зачем проверять восстановление из резервной копии?'
      ],
      commonMistakes: 'Знать, что резервная копия есть, но ни разу не пробовать восстановление. Копия, которую нельзя восстановить, — не копия.',
      whyItMatters: 'Простые привычки останавливают многие атаки ещё до их начала. Это первая защита, доступная каждому сотруднику и ученику.'
    }
  }
};
