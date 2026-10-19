// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Russian (`ru`).
class AppLocalizationsRu extends AppLocalizations {
  AppLocalizationsRu([String locale = 'ru']) : super(locale);

  @override
  String get appName => 'NearSoul';

  @override
  String get tagline => 'Узнай себя. Найди того, кто тебе подходит.';

  @override
  String get welcome1 => 'Узнай, какой ты в любви, за 2 минуты.';

  @override
  String get welcome2 =>
      'Знакомься с теми, кто тебе подходит, даже рядом и прямо сейчас.';

  @override
  String get welcome3 => 'Твоё точное местоположение никогда не раскрывается.';

  @override
  String get getStarted => 'Начать';

  @override
  String get haveAccount => 'У меня есть аккаунт';

  @override
  String get continueBtn => 'Продолжить';

  @override
  String get back => 'Назад';

  @override
  String get skip => 'Пропустить';

  @override
  String get save => 'Сохранить';

  @override
  String get cancel => 'Отмена';

  @override
  String get done => 'Готово';

  @override
  String get retry => 'Повторить';

  @override
  String get close => 'Закрыть';

  @override
  String get loading => 'Загрузка…';

  @override
  String get somethingWrong => 'Что-то пошло не так.';

  @override
  String get offline => 'Нет сети. Повторим, когда появится связь.';

  @override
  String get emailTitle => 'Какая у тебя почта?';

  @override
  String get emailHint => 'Мы пришлём 6-значный код. Без паролей.';

  @override
  String get emailLabel => 'Email';

  @override
  String get emailInvalid => 'Введите корректный email.';

  @override
  String get termsNote =>
      'Продолжая, ты соглашаешься с Условиями и Политикой конфиденциальности.';

  @override
  String get codeTitle => 'Введи код';

  @override
  String codeSent(String email) {
    return 'Мы отправили код на $email';
  }

  @override
  String get codeLabel => '6-значный код';

  @override
  String resendIn(int seconds) {
    return 'Отправить снова через $seconds с';
  }

  @override
  String get resend => 'Отправить новый код';

  @override
  String get checkSpam => 'Не видишь письмо? Проверь папку «Спам».';

  @override
  String get inviteLabel => 'Код приглашения';

  @override
  String get inviteHint =>
      'Сейчас NearSoul работает по приглашениям. Попроси код у того, кто поделился с тобой.';

  @override
  String get dobTitle => 'Когда ты родился(ась)?';

  @override
  String get dobHint =>
      'Тебе должно быть 18+. Мы показываем только возраст, не дату рождения.';

  @override
  String get dobPick => 'Выбрать дату';

  @override
  String dobConfirm(int age) {
    return 'Тебе $age. Всё верно?';
  }

  @override
  String get blockedTitle => 'Извини, NearSoul только для взрослых';

  @override
  String get blockedBody =>
      'Чтобы пользоваться NearSoul, нужно быть старше 18 лет.';

  @override
  String get consentTitle => 'Несколько согласий';

  @override
  String get consentTerms =>
      'Я принимаю Условия и Политику конфиденциальности (обязательно)';

  @override
  String get consentAlpha =>
      'Я понимаю, что это тестовая версия: что-то может ломаться, данные могут сбросить с предупреждением за 48 ч, и я не буду делиться скриншотами чужих профилей (обязательно)';

  @override
  String get consentAi =>
      'Разрешить AI написать мою карточку личности по ответам';

  @override
  String get consentAiHint =>
      'Отправляются только результаты черт, без почты, фото и локации. Без согласия используем шаблон.';

  @override
  String get consentAnalytics =>
      'Помогать улучшать NearSoul анонимной аналитикой';

  @override
  String get consentEmails => 'Новости продукта на почту';

  @override
  String get scanIntroTitle => 'Давай познакомимся с твоей душой';

  @override
  String get scanIntroBody =>
      '10 вопросов, около 2 минут. Здесь нет правильных и неправильных ответов. Просто будь честен(на) с собой.';

  @override
  String get scanStart => 'Начать';

  @override
  String get blockA => 'Какой ты';

  @override
  String get blockB => 'Как ты любишь';

  @override
  String get blockC => 'Что важно';

  @override
  String get blockD => 'Как ты живёшь';

  @override
  String get blockX => 'Точно нет';

  @override
  String get scanHowAccurate => 'Насколько точно это про тебя?';

  @override
  String scanProgress(int done, int total) {
    return '$done из $total';
  }

  @override
  String scanInterlude(String block) {
    return 'Отлично. Дальше: $block';
  }

  @override
  String get untranslated =>
      'Показано на английском, пока перевод не утверждён.';

  @override
  String pickUpTo(int n) {
    return 'Выбери до $n';
  }

  @override
  String pickExactly(int n) {
    return 'Выбери ровно $n';
  }

  @override
  String get revealTitle => 'Познакомься со своей душой';

  @override
  String get revealStrengths => 'Твои сильные стороны';

  @override
  String get revealRate => 'Насколько это точно?';

  @override
  String get revealRateThanks => 'Спасибо! Это помогает настроить движок.';

  @override
  String get revealOff => 'Что показалось неточным? (необязательно)';

  @override
  String get lowConfidence => 'Ответь ещё на пару вопросов, чтобы уточнить.';

  @override
  String get cardTitle => 'Твоя карточка личности';

  @override
  String get cardAi => 'Написано AI по твоим ответам';

  @override
  String get cardTemplate => 'Составлено по твоим ответам';

  @override
  String get cardShow => 'Показать в профиле';

  @override
  String get cardEdit => 'Редактировать';

  @override
  String get cardHide => 'Скрыть';

  @override
  String get cardGenerating => 'Пишем твою карточку…';

  @override
  String get cardHeadline => 'Заголовок';

  @override
  String get cardSummary => 'Описание';

  @override
  String get cardComm => 'Стиль общения';

  @override
  String get cardDate => 'Идеальное первое свидание';

  @override
  String get visibilityEveryone => 'Все';

  @override
  String get visibilityMatches => 'Только матчи';

  @override
  String get visibilityHidden => 'Скрыто';

  @override
  String get shareTitle => 'Сколько твои матчи смогут узнать о тебе?';

  @override
  String get shareReciprocity =>
      'Ты видишь настолько глубоко, насколько открываешься ты.';

  @override
  String get shareMinimal => 'Минимально';

  @override
  String get shareMinimalDesc =>
      'Только уровень совместимости и то, что у вас общего.';

  @override
  String get shareStandard => 'Стандарт (рекомендуем)';

  @override
  String get shareStandardDesc =>
      'Плюс где вы можете различаться и советы, как с тобой общаться.';

  @override
  String get shareDeep => 'Глубоко';

  @override
  String get shareDeepDesc => 'Плюс сравнение черт «Большой пятёрки».';

  @override
  String get basicsTitle => 'Немного о тебе';

  @override
  String get firstName => 'Имя';

  @override
  String get iAm => 'Я';

  @override
  String get interestedIn => 'Интересуют';

  @override
  String get lookingFor => 'Ищу';

  @override
  String get genderWoman => 'Женщина';

  @override
  String get genderMan => 'Мужчина';

  @override
  String get genderNonBinary => 'Небинарный человек';

  @override
  String get women => 'Женщины';

  @override
  String get men => 'Мужчины';

  @override
  String get nonBinaryPeople => 'Небинарные люди';

  @override
  String get intentLong => 'Долгие отношения';

  @override
  String get intentOpen => 'Свидания, открыт(а) к серьёзному';

  @override
  String get intentCasual => 'Что-то лёгкое';

  @override
  String get intentNotSure => 'Пока не знаю';

  @override
  String ageRange(int min, int max) {
    return 'Возраст: $min–$max';
  }

  @override
  String get city => 'Город';

  @override
  String get photosTitle => 'Добавь фото';

  @override
  String get photosHint =>
      'Нужно хотя бы одно фото. Лучше всего — свежее, где хорошо видно тебя.';

  @override
  String get addPhoto => 'Добавить фото';

  @override
  String get fromGallery => 'Выбрать из галереи';

  @override
  String get fromCamera => 'Сделать фото';

  @override
  String get uploading => 'Загрузка…';

  @override
  String get interestsTitle => 'Что тебе нравится?';

  @override
  String interestsCount(int n) {
    return 'Выбрано $n из 3–10';
  }

  @override
  String get bio => 'О себе (необязательно)';

  @override
  String get bioHint => 'Пару слов о себе. Без ссылок и контактов.';

  @override
  String get discoveryTitle => 'Показывать меня подходящим людям?';

  @override
  String get discoveryBody =>
      'Ты будешь появляться в «Душах дня» у других. Это можно выключить в любой момент.';

  @override
  String get discoveryOn => 'Да, показывать';

  @override
  String get notNow => 'Не сейчас';

  @override
  String get tabToday => 'Сегодня';

  @override
  String get tabNearby => 'Рядом';

  @override
  String get tabSoul => 'Душа';

  @override
  String get tabMatches => 'Матчи';

  @override
  String get tabMe => 'Я';

  @override
  String get todayTitle => 'Души дня';

  @override
  String todayLeft(int n) {
    return 'Осталось $n';
  }

  @override
  String get todayDone => 'На сегодня всё. Новые люди в 12:00.';

  @override
  String get todayEmpty =>
      'Сейчас никого нового. Попробуй «Open to meet» или расширь предпочтения.';

  @override
  String get tryNearby => 'Попробовать «Рядом»';

  @override
  String get like => 'Нравится';

  @override
  String get pass => 'Пропустить';

  @override
  String get later => 'Позже';

  @override
  String get undo => 'Отменить';

  @override
  String get whyClick => 'Почему вы можете совпасть';

  @override
  String get oneDifference => 'Одно различие';

  @override
  String get demoBadge => 'ДЕМО';

  @override
  String get tierStrong => 'Сильное совпадение';

  @override
  String get tierGood => 'Хорошее совпадение';

  @override
  String get tierSome => 'Есть общее';

  @override
  String get tierLow => 'Разные волны';

  @override
  String get sharedInterest => 'Общее';

  @override
  String get aboutPerson => 'О себе';

  @override
  String get interests => 'Интересы';

  @override
  String get itsMatch => 'Это матч!';

  @override
  String get bothNearby => 'Вы оба рядом, скажи привет 👋';

  @override
  String get sayHi => 'Написать';

  @override
  String get keepExploring => 'Смотреть дальше';

  @override
  String get likeLimit =>
      'Лимит лайков на сегодня исчерпан. Завтра будут новые.';

  @override
  String get nearbyOffTitle => 'Open to meet';

  @override
  String get nearbyOffBody =>
      'Включи на 1–4 часа. Если рядом окажется подходящий человек, который тоже открыт, вы оба получите одно приватное уведомление.';

  @override
  String get nearbySafety =>
      'Другие видят только диапазон расстояния, но никогда не видят, где ты.';

  @override
  String get openToMeetCta => 'Я открыт(а) к знакомству';

  @override
  String get locationTitle => 'Твоё местоположение остаётся приватным';

  @override
  String get locationBody =>
      'NearSoul использует твой примерный район только пока приложение открыто. Другие видят диапазон вроде «до 1 км», но не где ты. Мы храним только последний примерный район и удаляем его в течение 24 часов.';

  @override
  String get allowLocation => 'Разрешить геолокацию';

  @override
  String get locationDenied =>
      'Геолокация выключена. Она нужна для «Рядом», остальное работает без неё.';

  @override
  String get locationDesktop => '«Рядом» лучше всего работает на телефоне.';

  @override
  String get duration => 'На сколько?';

  @override
  String hours(int n) {
    return '$n ч';
  }

  @override
  String get radius => 'Как далеко?';

  @override
  String get activity => 'Настроение (необязательно)';

  @override
  String get actCoffee => '☕ Кофе';

  @override
  String get actWalk => '🚶 Прогулка';

  @override
  String get actDrinks => '🍷 Бокал';

  @override
  String get actChat => '💬 Просто поболтать';

  @override
  String get start => 'Начать';

  @override
  String get stop => 'Остановить';

  @override
  String openLeft(String time) {
    return 'Open to meet · осталось $time';
  }

  @override
  String get nearbyWaiting =>
      'Мы сообщим, когда рядом окажется подходящий человек.';

  @override
  String get nearbyList => 'Рядом сейчас';

  @override
  String get simulated => 'Симулированная локация (тест)';

  @override
  String get soulTitle => 'Твоя душа';

  @override
  String profileDepth(int n) {
    return 'Глубина профиля $n%';
  }

  @override
  String get selfReport => 'Твой полный отчёт';

  @override
  String get retakeScan => 'Пройти тест заново';

  @override
  String get retakeConfirm =>
      'Пройти часть о личности заново? Подбор обновится.';

  @override
  String get comingSoon => 'Скоро';

  @override
  String get soulTalk => 'Soul Talk';

  @override
  String get deepPersonality => 'Deep Personality';

  @override
  String get freeBeta => 'Бесплатно во время беты';

  @override
  String get locked => 'Открыть с Soul+';

  @override
  String get needs => 'Что тебе нужно от партнёра';

  @override
  String get growth => 'Зоны роста';

  @override
  String get reflect => 'Вопросы для размышления';

  @override
  String get values => 'Твои ценности';

  @override
  String get relationshipStyle => 'Ты в отношениях';

  @override
  String get inDating => 'В отношениях';

  @override
  String get matchesTitle => 'Матчи';

  @override
  String get newMatches => 'Новые матчи';

  @override
  String get conversations => 'Переписки';

  @override
  String get noMatches => 'Пока нет матчей. Поставь пару лайков в «Душах дня».';

  @override
  String get deletedUser => 'Удалённый пользователь';

  @override
  String get typeMessage => 'Сообщение';

  @override
  String get send => 'Отправить';

  @override
  String get notSent => 'Не отправлено · Нажми, чтобы повторить';

  @override
  String get conversationEnded => 'Эта переписка завершена.';

  @override
  String get safetyTip =>
      'Будь осторожен(на) со ссылками и номерами от тех, с кем ещё не встречался(ась).';

  @override
  String get starters => 'С чего начать разговор';

  @override
  String get youTwo => 'Вы двое';

  @override
  String get pairAccuracy => 'Совпало с твоим впечатлением?';

  @override
  String get frictions => 'Где вы можете различаться';

  @override
  String tips(String name) {
    return 'Как общаться с $name';
  }

  @override
  String get firstDate => 'Идеи для первого свидания';

  @override
  String get layers => 'Ваши слои рядом';

  @override
  String get unmatch => 'Отменить матч';

  @override
  String unmatchConfirm(String name) {
    return 'Отменить матч с $name? Вы больше не увидите друг друга.';
  }

  @override
  String get block => 'Заблокировать';

  @override
  String blockConfirm(String name) {
    return 'Заблокировать $name? Этот человек не сможет видеть тебя и писать тебе. Уведомления не будет.';
  }

  @override
  String get report => 'Пожаловаться';

  @override
  String get reportTitle => 'Что случилось?';

  @override
  String get reportComment => 'Что ещё нам стоит знать? (необязательно)';

  @override
  String get reportAlsoBlock => 'Также заблокировать';

  @override
  String get reportDone =>
      'Спасибо, что сообщил(а). Мы скрыли этого человека, команда всё проверит.';

  @override
  String get catHarassment => 'Домогательства';

  @override
  String get catScam => 'Мошенничество или спам';

  @override
  String get catFake => 'Фейковый профиль';

  @override
  String get catUnderage => 'Возможно, младше 18';

  @override
  String get catPhotos => 'Неприемлемые фото';

  @override
  String get catThreats => 'Угрозы или насилие';

  @override
  String get catOffline => 'Поведение на свидании';

  @override
  String get catOther => 'Другое';

  @override
  String get meTitle => 'Я';

  @override
  String get editProfile => 'Редактировать профиль';

  @override
  String get settings => 'Настройки';

  @override
  String get notifications => 'Уведомления';

  @override
  String get noNotifications => 'Ничего нового.';

  @override
  String get markAllRead => 'Отметить всё прочитанным';

  @override
  String get sendFeedback => 'Отправить отзыв';

  @override
  String get feedbackTitle => 'Помоги нам стать лучше';

  @override
  String get feedbackSent => 'Спасибо! Мы читаем каждое сообщение.';

  @override
  String get fbBug => 'Что-то сломалось';

  @override
  String get fbIdea => 'Идея';

  @override
  String get fbConfusing => 'Непонятно';

  @override
  String get fbEngine => 'Движок ошибся';

  @override
  String get fbOther => 'Другое';

  @override
  String get invites => 'Пригласить друзей';

  @override
  String invitesLeft(int n) {
    return 'Осталось приглашений: $n';
  }

  @override
  String get createInvite => 'Создать ссылку';

  @override
  String get copied => 'Скопировано';

  @override
  String get alphaTools => 'Инструменты теста';

  @override
  String get simulateLocation => 'Симулировать локацию';

  @override
  String get resetToday => 'Сбросить «Души дня»';

  @override
  String get engineDebug => 'Отладка движка';

  @override
  String get blockedUsers => 'Заблокированные';

  @override
  String get unblock => 'Разблокировать';

  @override
  String get safetyCentre => 'Центр безопасности';

  @override
  String get safety1 => 'Первые встречи — в людных местах.';

  @override
  String get safety2 => 'Скажи другу, куда и с кем идёшь.';

  @override
  String get safety3 => 'Общайтесь в NearSoul, пока не появится доверие.';

  @override
  String get safety4 =>
      'Никогда не отправляй деньги и платёжные данные людям из интернета.';

  @override
  String get safety5 =>
      'Используй «Заблокировать» и «Пожаловаться» в любое время. Жалобы конфиденциальны.';

  @override
  String get emergency => 'В экстренной ситуации звони 112.';

  @override
  String get about => 'О приложении';

  @override
  String version(String v) {
    return 'Версия $v';
  }

  @override
  String environment(String e) {
    return 'Окружение: $e';
  }

  @override
  String get ipipNote =>
      'Вопросы о личности из International Personality Item Pool (общественное достояние).';

  @override
  String get logout => 'Выйти';

  @override
  String get deleteAccount => 'Удалить аккаунт';

  @override
  String get deleteBody =>
      'Профиль, фото, ответы и матчи будут удалены. Ты сразу выйдешь и станешь невидимым(ой). Некоторые записи о безопасности хранятся анонимно, как требует закон.';

  @override
  String get deleteConfirm => 'Удалить мой аккаунт';

  @override
  String get discoverySetting => 'Показывать меня в «Душах дня»';

  @override
  String get hideDistance => 'Скрывать моё расстояние';

  @override
  String get readReceipts => 'Отчёты о прочтении';

  @override
  String get cardVisibility => 'Карточку личности видят';

  @override
  String get shareLevel => 'Уровень раскрытия в отчётах';

  @override
  String get language => 'Язык';

  @override
  String get testVersion => 'ТЕСТ';

  @override
  String get sessionExpired => 'Пожалуйста, войди снова.';

  @override
  String get photoMin => 'Пока тебя видят другие, нужно минимум 2 фото.';

  @override
  String get rateLimited => 'Слишком много попыток. Подожди немного.';

  @override
  String get downloadTitle => 'Установить NearSoul';

  @override
  String get downloadWeb => 'Открыть в браузере';

  @override
  String get downloadWebHint =>
      'Работает на любом телефоне и компьютере. Установка: Chrome/Edge → меню → «Установить приложение»; iPhone Safari → Поделиться → «На экран Домой».';

  @override
  String get downloadAndroid => 'Приложение для Android (APK)';

  @override
  String get downloadAndroidHint =>
      'Скачай, открой файл и разреши установку из этого источника, если спросят.';

  @override
  String get downloadIos => 'iPhone (TestFlight)';

  @override
  String get downloadDesktop =>
      'Приложения для компьютера (Windows, macOS, Linux)';

  @override
  String get downloadDesktopHint =>
      'Тестовые сборки не подписаны. На macOS: правый клик по приложению → «Открыть».';

  @override
  String get notAvailableYet => 'Пока недоступно';

  @override
  String get deepIntro =>
      '4 коротких части, примерно по 4 минуты. Каждая открывает новые грани твоей личности.';

  @override
  String deepPart(int n) {
    return 'Часть $n из 4';
  }

  @override
  String get deepPartDone => 'Часть пройдена! Открыты новые грани.';

  @override
  String get deepAllDone =>
      'Все части пройдены. Профиль теперь строится по 116 вопросам.';

  @override
  String get facets => 'Грани';

  @override
  String get soulTalkIntroTitle => 'Узнай себя';

  @override
  String get soulTalkIntroBody =>
      'Короткие беседы о том, чего ты хочешь, что даёт тебе энергию и как ты общаешься. Их видишь только ты.';

  @override
  String get soulNotTherapy => 'Это самоанализ, а не терапия.';

  @override
  String get soulPrivacy =>
      'Soul Talk приватен и зашифрован. Никто в NearSoul не может его прочитать. Беседы удаляются через 90 дней, если ты не решишь их сохранить.';

  @override
  String get soulConsentCta => 'Согласен(на), начнём';

  @override
  String get soulTopics => 'Темы';

  @override
  String get soulSuggested => 'Рекомендуем';

  @override
  String get soulDoneBadge => 'Пройдено';

  @override
  String get soulResume => 'Продолжить';

  @override
  String get soulEnd => 'Завершить';

  @override
  String get soulThinking => 'Думаю…';

  @override
  String get soulRetry => 'Что-то пошло не так. Нажми, чтобы повторить.';

  @override
  String get soulWrapTitle => 'Что ты открыл(а) сегодня';

  @override
  String get soulKeep => 'Оставить';

  @override
  String get soulDiscard => 'Убрать';

  @override
  String soulBasedOn(String evidence) {
    return 'Из твоих слов: $evidence';
  }

  @override
  String get soulVisPrivate => 'Только я';

  @override
  String get soulVisMatching => 'Учитывать в подборе';

  @override
  String get soulVisCard => 'Показать в карточке';

  @override
  String get soulQuestion => 'Вопрос для размышления';

  @override
  String get soulMap => 'Карта души';

  @override
  String get soulMapEmpty => 'Карта растёт с каждой беседой.';

  @override
  String get soulKeepConversations => 'Хранить мои беседы';

  @override
  String get soulDeleteAll => 'Удалить все данные Soul Talk';

  @override
  String get soulDeleteAllConfirm =>
      'Удалить все беседы и инсайты Soul Talk? Это нельзя отменить.';

  @override
  String get soulSafetyContinue => 'Продолжить';

  @override
  String get soulSafetyEnd => 'Завершить';

  @override
  String get soulTooShort =>
      'Беседа была слишком короткой для выводов. Это нормально.';

  @override
  String get soulAffectsMatching => 'Может улучшить подбор';

  @override
  String get catValue => 'Ценности';

  @override
  String get catNeed => 'Потребности';

  @override
  String get catPattern => 'Закономерности';

  @override
  String get catStrength => 'Сильные стороны';

  @override
  String get catPreference => 'Предпочтения';

  @override
  String get catGrowth => 'Рост';

  @override
  String get exportData => 'Скачать мои данные';

  @override
  String get exportRequested =>
      'Готовим твои данные. Пришлём письмо со ссылкой для скачивания.';

  @override
  String get exportReady => 'Твои данные готовы';

  @override
  String get exportPending => 'Готовим данные…';

  @override
  String get paywallTitle => 'Пойми себя и своих матчей глубже';

  @override
  String get paywallB1 => 'Полный отчёт о себе со всеми гранями';

  @override
  String get paywallB2 => 'Полный отчёт «Вы двое» для каждого матча';

  @override
  String get paywallB3 => 'Безлимитный Soul Talk';

  @override
  String get paywallMonthly => '7,99 € в месяц';

  @override
  String get paywallYearly => '39,99 € в год';

  @override
  String get paywallRenewal =>
      'Продлевается автоматически, пока не отменишь. Отменить можно в любой момент в настройках магазина.';

  @override
  String get paywallRestore => 'Восстановить покупки';

  @override
  String get paywallSoon => 'Покупки откроются после беты.';

  @override
  String get soulPlus => 'Soul+';

  @override
  String soulPlusActive(String date) {
    return 'Активна до $date';
  }

  @override
  String get soulPlusInactive => 'Не активна';

  @override
  String get pushNotifications => 'Push-уведомления';

  @override
  String get pushOnHint =>
      'Включены в этом браузере. В тексте нет имён и сообщений.';

  @override
  String get pushOffHint =>
      'Узнавайте о взаимных симпатиях и новых сообщениях.';

  @override
  String get pushBlocked =>
      'Заблокированы в настройках браузера. Разрешите уведомления для этого сайта.';

  @override
  String get pushUnsupported =>
      'Здесь недоступны. На iPhone сначала добавьте NearSoul на экран «Домой».';

  @override
  String get pushEnabled => 'Уведомления включены';

  @override
  String get notifyTypes => 'О чём уведомлять';

  @override
  String get notifyNewMatch => 'Взаимные симпатии';

  @override
  String get notifyNewMessage => 'Новые сообщения';

  @override
  String get notifyDailySet => '«Души дня» готовы (12:00)';

  @override
  String get notifyNearby => 'Рядом кто-то совместимый';

  @override
  String get notifyOpenEnding => '«Открыт к встрече» заканчивается';

  @override
  String get notifyReport => 'Новости по моим жалобам';

  @override
  String get notifyRulesNote =>
      'С 23:00 до 08:00 тихо, кроме сообщений. Не больше одного напоминания в день. Всё остальное по-прежнему видно в колокольчике.';

  @override
  String testCodeBanner(String code) {
    return 'Тестовая версия: письма не отправляются. Ваш код: $code.';
  }

  @override
  String scaleLean(String side) {
    return 'Скорее: $side';
  }

  @override
  String get scaleMiddle => 'Где-то посередине';

  @override
  String get appearance => 'Оформление';

  @override
  String get themeSystem => 'Как в системе';

  @override
  String get themeLight => 'Светлая';

  @override
  String get themeDark => 'Тёмная';

  @override
  String get paletteNeutral => 'Нейтральная';

  @override
  String get paletteSage => 'Шалфей';

  @override
  String get paletteSand => 'Песок';

  @override
  String get paletteCoral => 'Коралл';

  @override
  String get profiles => 'Мои профили';

  @override
  String get profilesHint =>
      'Каждый профиль отдельный: свои вопросы, фото, совпадения и чаты. Возраст во всех один и тот же, а твои профили никогда не видят друг друга.';

  @override
  String get profileOwner => 'Основной профиль';

  @override
  String get profileCurrent => 'Сейчас';

  @override
  String get profileSwitch => 'Переключиться';

  @override
  String get profileAdd => 'Добавить профиль';

  @override
  String get profileLabel => 'Название для себя (видишь только ты)';

  @override
  String get profileRename => 'Переименовать';

  @override
  String get profileNew => 'Новый профиль';

  @override
  String get profileUnfinished => 'Ещё не заполнен';

  @override
  String profileMax(int max) {
    return 'У тебя максимум профилей: $max.';
  }

  @override
  String get todayNeedsAnswers =>
      'Ты пропустил(а) почти все вопросы, поэтому пока не на что опереться при подборе. Ответь на них, и «Души дня» заполнятся.';

  @override
  String get answerQuestions => 'Ответить на вопросы';

  @override
  String get subscription => 'Подписка';

  @override
  String get tierFree => 'Бесплатно';

  @override
  String get tierPlus => 'Soul+';

  @override
  String get tierGold => 'Gold';

  @override
  String get tierVip => 'VIP';

  @override
  String get tierCurrent => 'Твой уровень';

  @override
  String featDaily(int count) {
    return '«Души дня»: $count в день';
  }

  @override
  String get featDailyUnlimited => '«Души дня»: без лимита';

  @override
  String get featReports => 'Полные отчёты о себе и о паре';

  @override
  String get featLikes => 'Видеть, кто тебя лайкнул, и отвечать взаимностью';

  @override
  String get featLikesCount => 'Видеть, сколько людей тебя лайкнули';

  @override
  String get featRewind => 'Вернуть последнего пропущенного';

  @override
  String get featPersonas => 'Видеть, сколько профилей у человека';

  @override
  String featLikeLimit(int count) {
    return 'Лайки: $count в день';
  }

  @override
  String get featLikeUnlimited => 'Лайки: без лимита';

  @override
  String perMonth(String price) {
    return '$price в месяц';
  }

  @override
  String get activateTest => 'Активировать (тест, бесплатно)';

  @override
  String get backToFree => 'Вернуться на бесплатный';

  @override
  String get testModeNote =>
      'Тестовая версия: уровни переключаются бесплатно, без оплаты. Настоящие покупки появятся вместе с магазинами приложений.';

  @override
  String get storeSoon => 'Покупки откроются с выходом в магазинах приложений.';

  @override
  String get likedYou => 'Тебя лайкнули';

  @override
  String likedYouCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'Тебя лайкнули $count человек',
      few: 'Тебя лайкнули $count человека',
      one: 'Тебя лайкнул $count человек',
      zero: 'Пока новых лайков нет',
    );
    return '$_temp0';
  }

  @override
  String get likedYouUpsell => 'С Gold видно, кто это.';

  @override
  String get seePlans => 'Смотреть уровни';

  @override
  String get rewind => 'Вернуть';

  @override
  String get rewindDone => 'Снова в списке';

  @override
  String personaCountVip(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'У человека $count профилей',
      few: 'У человека $count профиля',
      one: 'У человека $count профиль',
    );
    return '$_temp0';
  }

  @override
  String get moreSoulsUpsell =>
      'Хочешь больше людей в день? В Gold — 50, в VIP — без лимита.';

  @override
  String get personasVipNote =>
      'Участники VIP видят, сколько у тебя профилей, но никогда — какие именно.';

  @override
  String get passed => 'Пропущено';

  @override
  String get todayHidden =>
      'Показ тебя выключен, поэтому и тебе мы никого не показываем: подбор работает в обе стороны.';

  @override
  String get showMe => 'Показывать меня';

  @override
  String get todayNeedsPhoto =>
      'Добавь фото: тогда тебя увидят, а ты увидишь других.';

  @override
  String get addPhoto2 => 'Добавить фото';

  @override
  String get viewCards => 'Карточки';

  @override
  String get viewList => 'Лента';

  @override
  String get dobLocked =>
      'Дату рождения потом нельзя изменить, проверь её внимательно.';

  @override
  String get notNowHint =>
      'Если не показывать себя, тебе тоже никого не покажут: подбор работает в обе стороны. Включить можно в Настройках.';

  @override
  String get swipeHint =>
      'Свайп вправо — нравится, влево — пропустить. Нажми на фото, чтобы открыть профиль.';

  @override
  String get gotIt => 'Понятно';

  @override
  String get menuProfile => 'Профиль';

  @override
  String get menuAccount => 'Аккаунт';

  @override
  String get menuHelp => 'Помощь';

  @override
  String get menuPhotos => 'Фото';

  @override
  String get menuInterests => 'Интересы и о себе';

  @override
  String get refineTitle => 'Уточнить профиль';

  @override
  String refineBody(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'Ещё $count вопросов',
      few: 'Ещё $count вопроса',
      one: 'Ещё $count вопрос',
    );
    return '$_temp0: чем больше ответов, тем точнее подбор и отчёты.';
  }

  @override
  String get refineDone => 'Профиль уточнён';

  @override
  String get finishTitle => 'Всё готово!';

  @override
  String get finishBody =>
      'Мы уже подобрали людей, с которыми у тебя может сложиться. Подходящие люди тоже увидят тебя в «Душах дня».';

  @override
  String get startDating => 'Начать знакомиться';

  @override
  String get startHidden => 'Пока не показывать меня';

  @override
  String get stepMissing => 'Остался один шаг, открываем его.';

  @override
  String get scanDoneTitle => 'Первый этап пройден!';

  @override
  String get scanDoneBody =>
      'Ты ответил(а) на все 10 вопросов. Дальше — твой результат. Остальные вопросы можно пройти позже во вкладке «Душа», чтобы подбор был точнее.';

  @override
  String get scanDoneCta => 'Смотреть результат';

  @override
  String get refineDoneBody => 'Спасибо! Подбор и отчёты стали точнее.';

  @override
  String get moreInfo => 'Подробнее';

  @override
  String get switchOrAdd => 'Сменить или добавить профиль';

  @override
  String get profilesSubtitle =>
      'Второй и третий профиль: другая анкета, фото и знакомства';

  @override
  String get profileCreateHint =>
      'Ты сразу перейдёшь в новый профиль: 10 вопросов, имя и фото. Вернуться в основной можно в любой момент: «Я» → «Мои профили».';

  @override
  String profileFilling(String name) {
    return 'Профиль: $name';
  }

  @override
  String get personGone => 'Этот человек больше недоступен.';

  @override
  String get create => 'Создать';

  @override
  String matchPercent(int n) {
    return '$n% совпадение';
  }

  @override
  String moreReasons(int count) {
    return 'И ещё $count общих черт: узнайте их друг о друге в разговоре.';
  }

  @override
  String refineNudge(int count) {
    return 'Ты прошёл(а) 10 вопросов о себе 🎉 Ещё $count — и подбор станет точнее. Можно по чуть-чуть, ответы сохраняются.';
  }

  @override
  String get refineNudgeCta => 'Продолжить';

  @override
  String get cardTemplateOther => 'Составлено по ответам в анкете';

  @override
  String get cardAiOther => 'Написано AI по ответам в анкете';

  @override
  String get adLabel => 'Реклама';

  @override
  String get adTestLabel => 'Тестовая реклама';

  @override
  String get adHide => 'Скрыть';

  @override
  String get featNoAds => 'Без рекламы';

  @override
  String get writeFirst => 'Написать';

  @override
  String get writeFirstTitle => 'Написать первым';

  @override
  String get writeFirstHint =>
      'Человек увидит сообщение и решит, отвечать ли. До 5 человек в день. VIP.';

  @override
  String get writeFirstSent =>
      'Сообщение отправлено. Если ответят, откроется чат.';

  @override
  String get requestsTitle => 'Тебе написали первыми';

  @override
  String requestsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count сообщений ждут ответа',
      few: '$count сообщения ждут ответа',
      one: '$count сообщение ждёт ответа',
    );
    return '$_temp0';
  }

  @override
  String get reply => 'Ответить';

  @override
  String get decline => 'Отклонить';

  @override
  String get featMessageFirst =>
      'Написать первым, без взаимного лайка (5 в день)';

  @override
  String get appLogo => 'Логотип';

  @override
  String get logoSoul => 'Основной';

  @override
  String get logoPair => 'Две души';

  @override
  String get logoHeart => 'Сердце';

  @override
  String get breakTitle => 'Пауза: узнай себя';

  @override
  String breakBody(int count) {
    return 'Ты посмотрел(а) уже $count человек. Ответь на несколько вопросов о себе — и следующие «Души дня» подойдут тебе ещё точнее.';
  }

  @override
  String get breakGo => 'Пройти';

  @override
  String get breakSkip => 'Пропустить';

  @override
  String get adPlaces => 'Где это';

  @override
  String get openInMaps => 'На карте';

  @override
  String get mapTitle => 'Карта';

  @override
  String get mapOpen => 'Матчи на карте';

  @override
  String get mapShowMe => 'Показывать меня матчам';

  @override
  String mapSharingUntil(String time) {
    return 'Включено до $time';
  }

  @override
  String get mapSharingForever => 'Включено, пока не выключишь';

  @override
  String get mapGhost => 'Выключено: тебя нет на карте';

  @override
  String get mapPrivacy =>
      'Матчи видят примерный район (около 300–500 м), а не твой адрес. Люди без матча с тобой никогда не видят тебя на карте. Выключить можно в любой момент.';

  @override
  String get map1h => 'На 1 час';

  @override
  String get map4h => 'На 4 часа';

  @override
  String get mapUntilOff => 'Пока не выключу';

  @override
  String get mapTurnOff => 'Выключить';

  @override
  String mapMeters(int n) {
    return '≈ $n м';
  }

  @override
  String mapKm(String km) {
    return '≈ $km км';
  }

  @override
  String mapUpdatedMin(int n) {
    return 'обновлено $n мин назад';
  }

  @override
  String mapUpdatedH(int n) {
    return 'обновлено $n ч назад';
  }

  @override
  String get mapEmpty =>
      'Пока никого из матчей нет на карте. Когда матч включит «Показывать меня», он появится здесь.';

  @override
  String get mapNoLocation =>
      'Разреши геолокацию, чтобы видеть, как далеко твои матчи.';

  @override
  String get mapAllow => 'Разрешить';

  @override
  String get mapPickPlace => 'Выбрать место (тест)';

  @override
  String get mapWrite => 'Написать';

  @override
  String mapCount(int n) {
    return '$n на карте';
  }

  @override
  String get mapYou => 'Ты';

  @override
  String get verifiedBadge => 'Фото проверены';

  @override
  String get verifyMenu => 'Подтвердить фото';

  @override
  String get verifyMenuSub => 'Синяя галочка: одно селфи, 30 секунд';

  @override
  String get verifyDone => 'Фото подтверждены';

  @override
  String get verifyDoneBody =>
      'Рядом с твоим именем видна синяя галочка. Это значит, что на фото действительно ты.';

  @override
  String get verifyTitle => 'Проверка фото';

  @override
  String get verifyHeadline => 'Покажи, что это правда ты';

  @override
  String get verifyIntro =>
      'Сделай одно селфи, повторив жест ниже. Мы сравним его с фото профиля и поставим синюю галочку.';

  @override
  String get verifyPoseLabel => 'Жест на сегодня';

  @override
  String get verifyStep1 =>
      'Лицом к камере, при хорошем свете, без тёмных очков';

  @override
  String get verifyStep2 => 'Повтори жест так, чтобы его было хорошо видно';

  @override
  String get verifyStep3 => 'На фото профиля должно быть видно твоё лицо';

  @override
  String get verifyTake => 'Сделать селфи';

  @override
  String get verifyPrivacy =>
      'Селфи никто не увидит, оно удаляется сразу после проверки. Мы не создаём биометрических шаблонов лица.';

  @override
  String get verifyAlphaNote =>
      'Тестовая версия: проверка одобряется автоматически.';

  @override
  String get verifyPending => 'Проверяем селфи';

  @override
  String get verifyPendingBody =>
      'Обычно это занимает меньше суток. Мы сообщим.';

  @override
  String get verifyApproved => 'Фото подтверждены ✓';

  @override
  String get verifyRejected => 'Проверка фото не прошла';

  @override
  String get verifyTryAgain =>
      'Попробуй ещё раз при хорошем свете и с хорошо видным жестом.';

  @override
  String get posePeace => 'Покажи знак мира ✌️ у лица';

  @override
  String get poseThumb => 'Покажи большой палец вверх';

  @override
  String get poseThree => 'Покажи три пальца';

  @override
  String get poseWave => 'Помаши рукой в камеру';

  @override
  String get poseEar => 'Дотронься до уха';

  @override
  String get poseChin => 'Подопри подбородок рукой';

  @override
  String get checkShareText =>
      'Насколько мы совместимы? Проверь наши души в NearSoul ✨';

  @override
  String get checkLinkCopied => 'Ссылка скопирована: вставь её куда угодно';

  @override
  String get checkCardTitle => 'Насколько ты совместим(а) с…?';

  @override
  String get checkCardBody =>
      'Отправь ссылку друзьям, крашу или в общий чат. Они отвечают на 10 вопросов, и вы оба видите совместимость — по науке, а не по звёздам.';

  @override
  String get checkStory => 'Сторис для Instagram';

  @override
  String get checkShareLink => 'Поделиться ссылкой';

  @override
  String get checkWho => 'Кто проверял';

  @override
  String get checkSaved => 'Сохранено: выложи в сторис';

  @override
  String get checkShareStory => 'Поделиться в сторис';

  @override
  String get storyMySoul => 'МОЙ ТИП ДУШИ';

  @override
  String get storyAsk => 'Насколько мы совместимы? 👀';

  @override
  String get checkTitle => 'Проверка совместимости';

  @override
  String get checkOwnLink =>
      'Это твоя ссылка. Отправь её друзьям и узнай, кто тебе подходит больше всех.';

  @override
  String checkInvite(String name) {
    return 'Ты и $name: насколько вы совместимы?';
  }

  @override
  String get checkHow =>
      'По ответам на 10 коротких вопросов: характер, ценности и как вы любите проводить время. Твои ответы никто не увидит.';

  @override
  String get checkGo => 'Проверить совместимость';

  @override
  String get checkPrivacy =>
      'Вы оба увидите только процент и почему. Это не матч и не открывает чат.';

  @override
  String checkYouAnd(String name) {
    return 'Ты и $name';
  }

  @override
  String checkVerdict(String level) {
    String _temp0 = intl.Intl.selectLogic(level, {
      'high': 'Редкое совпадение душ 🔥',
      'good': 'Вы правда на одной волне ✨',
      'other': 'Разные — и это может быть интересно 🌗',
    });
    return '$_temp0';
  }

  @override
  String get checkYou => 'Ты';

  @override
  String get checkWhy => 'Почему вы совпадаете';

  @override
  String checkMore(int n) {
    return '…и ещё $n общих черт — узнайте вместе';
  }

  @override
  String get checkShareMine => 'Отправить свою ссылку другим';

  @override
  String get checkNone =>
      'Пока никто не проверял. Поделись ссылкой и узнай, кто тебе подходит больше всех.';

  @override
  String get checkSomeone => 'Кто-то';

  @override
  String get checkTheyChecked => 'проверил(а) по твоей ссылке';

  @override
  String get checkYouChecked => 'ты проверил(а) по ссылке';

  @override
  String get checkNotif => 'Кто-то проверил совместимость с тобой 💫';

  @override
  String matchWith(String name) {
    return 'Ты и $name понравились друг другу';
  }

  @override
  String get matchMiniReport => 'Вы двое — коротко';

  @override
  String matchTheirType(String name, String type) {
    return '$name — «$type»';
  }

  @override
  String get matchHowToStart => 'С чего начать';

  @override
  String get matchTapStarter =>
      'Нажми на тему: она появится в поле сообщения, отправишь сам(а).';

  @override
  String get socialApple => 'Продолжить с Apple';

  @override
  String get socialGoogle => 'Продолжить с Google';

  @override
  String get socialVk => 'Войти с VK ID';

  @override
  String get continueEmail => 'Продолжить с email';

  @override
  String get or => 'или';

  @override
  String socialSoon(String name) {
    return 'Вход через $name скоро появится. Пока войди по email.';
  }

  @override
  String get socialNative =>
      'В приложении пока входи по email. Google, Apple и VK работают на сайте.';

  @override
  String get socialPopupBlocked =>
      'Браузер заблокировал окно входа. Разреши всплывающие окна и попробуй ещё раз.';

  @override
  String get socialFailed => 'Не получилось войти. Попробуй ещё раз.';
}
