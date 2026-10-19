// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'NearSoul';

  @override
  String get tagline => 'Get to know yourself. Discover someone compatible.';

  @override
  String get welcome1 => 'Find out who you are in love, in 2 minutes.';

  @override
  String get welcome2 =>
      'Meet people who truly fit you, even nearby, right now.';

  @override
  String get welcome3 => 'Your exact location is never shared. Ever.';

  @override
  String get getStarted => 'Get started';

  @override
  String get haveAccount => 'I have an account';

  @override
  String get continueBtn => 'Continue';

  @override
  String get back => 'Back';

  @override
  String get skip => 'Skip';

  @override
  String get save => 'Save';

  @override
  String get cancel => 'Cancel';

  @override
  String get done => 'Done';

  @override
  String get retry => 'Try again';

  @override
  String get close => 'Close';

  @override
  String get loading => 'Loading…';

  @override
  String get somethingWrong => 'Something went wrong.';

  @override
  String get offline => 'You’re offline. We’ll retry when you’re back.';

  @override
  String get emailTitle => 'What’s your email?';

  @override
  String get emailHint => 'We’ll send you a 6-digit code. No passwords.';

  @override
  String get emailLabel => 'Email';

  @override
  String get emailInvalid => 'Please enter a valid email.';

  @override
  String get termsNote =>
      'By continuing you agree to our Terms and Privacy Policy.';

  @override
  String get codeTitle => 'Enter your code';

  @override
  String codeSent(String email) {
    return 'We sent a code to $email';
  }

  @override
  String get codeLabel => '6-digit code';

  @override
  String resendIn(int seconds) {
    return 'Resend in ${seconds}s';
  }

  @override
  String get resend => 'Send a new code';

  @override
  String get checkSpam => 'Can’t find it? Check your spam folder.';

  @override
  String get inviteLabel => 'Invite code';

  @override
  String get inviteHint =>
      'NearSoul is invite-only right now. Ask the person who shared it with you.';

  @override
  String get dobTitle => 'When were you born?';

  @override
  String get dobHint =>
      'You must be 18 or older. We only show your age, never your birthday.';

  @override
  String get dobPick => 'Choose date';

  @override
  String dobConfirm(int age) {
    return 'You are $age. Is that right?';
  }

  @override
  String get blockedTitle => 'Sorry, NearSoul is for adults only';

  @override
  String get blockedBody => 'You need to be 18 or older to use NearSoul.';

  @override
  String get consentTitle => 'A few agreements';

  @override
  String get consentTerms =>
      'I agree to the Terms and Privacy Policy (required)';

  @override
  String get consentAlpha =>
      'I understand this is a test version: things may break, test data may be reset with 48 h notice, and I won’t share screenshots of other testers’ profiles (required)';

  @override
  String get consentAi => 'Let AI write my personality card from my answers';

  @override
  String get consentAiHint =>
      'Only trait results are sent, never your email, photos or location. Without it we use a template.';

  @override
  String get consentAnalytics =>
      'Help improve NearSoul with anonymous usage analytics';

  @override
  String get consentEmails => 'Product news by email';

  @override
  String get scanIntroTitle => 'Let’s meet your soul';

  @override
  String get scanIntroBody =>
      '10 questions, about 2 minutes. No right or wrong answers. Just be honest with yourself.';

  @override
  String get scanStart => 'Start';

  @override
  String get blockA => 'How you are';

  @override
  String get blockB => 'How you love';

  @override
  String get blockC => 'What matters';

  @override
  String get blockD => 'How you live';

  @override
  String get blockX => 'Hard no\'s';

  @override
  String get scanHowAccurate => 'How accurately does this describe you?';

  @override
  String scanProgress(int done, int total) {
    return '$done of $total';
  }

  @override
  String scanInterlude(String block) {
    return 'Nice. Next: $block';
  }

  @override
  String get untranslated =>
      'Shown in English until the official translation is approved.';

  @override
  String pickUpTo(int n) {
    return 'Pick up to $n';
  }

  @override
  String pickExactly(int n) {
    return 'Pick exactly $n';
  }

  @override
  String get revealTitle => 'Meet your soul';

  @override
  String get revealStrengths => 'Your strengths';

  @override
  String get revealRate => 'How accurate does this feel?';

  @override
  String get revealRateThanks => 'Thanks! This helps us tune the engine.';

  @override
  String get revealOff => 'What felt off? (optional)';

  @override
  String get lowConfidence => 'Answer a few more questions to sharpen this.';

  @override
  String get cardTitle => 'Your personality card';

  @override
  String get cardAi => 'Written with AI from your answers';

  @override
  String get cardTemplate => 'Written from your answers';

  @override
  String get cardShow => 'Show on profile';

  @override
  String get cardEdit => 'Edit';

  @override
  String get cardHide => 'Hide';

  @override
  String get cardGenerating => 'Writing your card…';

  @override
  String get cardHeadline => 'Headline';

  @override
  String get cardSummary => 'Summary';

  @override
  String get cardComm => 'Communication style';

  @override
  String get cardDate => 'Ideal first date';

  @override
  String get visibilityEveryone => 'Everyone';

  @override
  String get visibilityMatches => 'Matches only';

  @override
  String get visibilityHidden => 'Hidden';

  @override
  String get shareTitle => 'How much can your matches learn about you?';

  @override
  String get shareReciprocity => 'You see as deep as you share.';

  @override
  String get shareMinimal => 'Minimal';

  @override
  String get shareMinimalDesc =>
      'Only your compatibility tier and what you have in common.';

  @override
  String get shareStandard => 'Standard (recommended)';

  @override
  String get shareStandardDesc =>
      'Plus where you might differ and tips on how to talk to you.';

  @override
  String get shareDeep => 'Deep';

  @override
  String get shareDeepDesc => 'Plus your Big Five bands side by side.';

  @override
  String get basicsTitle => 'A little about you';

  @override
  String get firstName => 'First name';

  @override
  String get iAm => 'I am';

  @override
  String get interestedIn => 'Interested in';

  @override
  String get lookingFor => 'Looking for';

  @override
  String get genderWoman => 'Woman';

  @override
  String get genderMan => 'Man';

  @override
  String get genderNonBinary => 'Non-binary';

  @override
  String get women => 'Women';

  @override
  String get men => 'Men';

  @override
  String get nonBinaryPeople => 'Non-binary people';

  @override
  String get intentLong => 'A long-term relationship';

  @override
  String get intentOpen => 'Dating, open to long-term';

  @override
  String get intentCasual => 'Something casual';

  @override
  String get intentNotSure => 'Not sure yet';

  @override
  String ageRange(int min, int max) {
    return 'Age range: $min–$max';
  }

  @override
  String get city => 'City';

  @override
  String get photosTitle => 'Add your photos';

  @override
  String get photosHint =>
      'At least one photo. A clear, recent one of you works best.';

  @override
  String get addPhoto => 'Add photo';

  @override
  String get fromGallery => 'Choose from gallery';

  @override
  String get fromCamera => 'Take a photo';

  @override
  String get uploading => 'Uploading…';

  @override
  String get interestsTitle => 'What do you enjoy?';

  @override
  String interestsCount(int n) {
    return '$n of 3–10 selected';
  }

  @override
  String get bio => 'Bio (optional)';

  @override
  String get bioHint => 'A few words about you. No links or contacts.';

  @override
  String get discoveryTitle => 'Show me to compatible people?';

  @override
  String get discoveryBody =>
      'You’ll appear in other people’s Today’s Souls. You can turn this off any time.';

  @override
  String get discoveryOn => 'Yes, show me';

  @override
  String get notNow => 'Not now';

  @override
  String get tabToday => 'Today';

  @override
  String get tabNearby => 'Nearby';

  @override
  String get tabSoul => 'Soul';

  @override
  String get tabMatches => 'Matches';

  @override
  String get tabMe => 'Me';

  @override
  String get todayTitle => 'Today’s Souls';

  @override
  String todayLeft(int n) {
    return '$n left';
  }

  @override
  String get todayDone => 'That’s today’s set. New souls at 12:00.';

  @override
  String get todayEmpty =>
      'No one new right now. Try Open to meet or widen your preferences.';

  @override
  String get tryNearby => 'Try Nearby';

  @override
  String get like => 'Like';

  @override
  String get pass => 'Pass';

  @override
  String get later => 'Later';

  @override
  String get undo => 'Undo';

  @override
  String get whyClick => 'Why you might click';

  @override
  String get oneDifference => 'One difference';

  @override
  String get demoBadge => 'DEMO';

  @override
  String get tierStrong => 'Strong match';

  @override
  String get tierGood => 'Good match';

  @override
  String get tierSome => 'Some common ground';

  @override
  String get tierLow => 'Different vibes';

  @override
  String get sharedInterest => 'Shared';

  @override
  String get aboutPerson => 'About';

  @override
  String get interests => 'Interests';

  @override
  String get itsMatch => 'It’s a match!';

  @override
  String get bothNearby => 'You’re both nearby, say hi 👋';

  @override
  String get sayHi => 'Say hi';

  @override
  String get keepExploring => 'Keep exploring';

  @override
  String get likeLimit =>
      'You’ve reached today’s like limit. New likes tomorrow.';

  @override
  String get nearbyOffTitle => 'Open to meet';

  @override
  String get nearbyOffBody =>
      'Turn it on for 1–4 hours. If someone compatible who’s also open is nearby, you’ll both get one private alert.';

  @override
  String get nearbySafety =>
      'Others only ever see a distance range, never where you are.';

  @override
  String get openToMeetCta => 'I’m open to meet';

  @override
  String get locationTitle => 'Your location stays private';

  @override
  String get locationBody =>
      'NearSoul uses your approximate area only while the app is open. Others see a range like “Under 1 km”, never where you are. We keep only your latest approximate area and delete it within 24 hours.';

  @override
  String get allowLocation => 'Allow location';

  @override
  String get locationDenied =>
      'Location is off. Nearby needs it; everything else works without it.';

  @override
  String get locationDesktop => 'Nearby works best on your phone.';

  @override
  String get duration => 'For how long?';

  @override
  String hours(int n) {
    return '$n h';
  }

  @override
  String get radius => 'How far?';

  @override
  String get activity => 'Up for (optional)';

  @override
  String get actCoffee => '☕ Coffee';

  @override
  String get actWalk => '🚶 Walk';

  @override
  String get actDrinks => '🍷 Drinks';

  @override
  String get actChat => '💬 Just chat';

  @override
  String get start => 'Start';

  @override
  String get stop => 'Stop';

  @override
  String openLeft(String time) {
    return 'Open to meet · $time left';
  }

  @override
  String get nearbyWaiting =>
      'We’ll let you know when someone compatible is close.';

  @override
  String get nearbyList => 'Nearby now';

  @override
  String get simulated => 'Simulated location (test mode)';

  @override
  String get soulTitle => 'Your soul';

  @override
  String profileDepth(int n) {
    return 'Profile depth $n%';
  }

  @override
  String get selfReport => 'Your full report';

  @override
  String get retakeScan => 'Retake the Quick Scan';

  @override
  String get retakeConfirm =>
      'Retake the personality part? Your matches will update.';

  @override
  String get comingSoon => 'Coming soon';

  @override
  String get soulTalk => 'Soul Talk';

  @override
  String get deepPersonality => 'Deep Personality';

  @override
  String get freeBeta => 'Free during beta';

  @override
  String get locked => 'Unlock with Soul+';

  @override
  String get needs => 'What you need from a partner';

  @override
  String get growth => 'Growth edges';

  @override
  String get reflect => 'Questions to reflect on';

  @override
  String get values => 'Your values';

  @override
  String get relationshipStyle => 'You in relationships';

  @override
  String get inDating => 'In dating';

  @override
  String get matchesTitle => 'Matches';

  @override
  String get newMatches => 'New matches';

  @override
  String get conversations => 'Conversations';

  @override
  String get noMatches =>
      'No matches yet. Like a few people in Today’s Souls to get started.';

  @override
  String get deletedUser => 'Deleted user';

  @override
  String get typeMessage => 'Message';

  @override
  String get send => 'Send';

  @override
  String get notSent => 'Not sent · Tap to retry';

  @override
  String get conversationEnded => 'This conversation has ended.';

  @override
  String get safetyTip =>
      'Be careful with links and numbers from people you haven’t met yet.';

  @override
  String get starters => 'Conversation starters';

  @override
  String get youTwo => 'You two';

  @override
  String get pairAccuracy => 'Did this match your impression?';

  @override
  String get frictions => 'Where you might differ';

  @override
  String tips(String name) {
    return 'How to talk to $name';
  }

  @override
  String get firstDate => 'First date ideas';

  @override
  String get layers => 'Your layers side by side';

  @override
  String get unmatch => 'Unmatch';

  @override
  String unmatchConfirm(String name) {
    return 'Unmatch $name? You won’t see each other again.';
  }

  @override
  String get block => 'Block';

  @override
  String blockConfirm(String name) {
    return 'Block $name? They won’t be able to see or contact you. They won’t be notified.';
  }

  @override
  String get report => 'Report';

  @override
  String get reportTitle => 'What’s wrong?';

  @override
  String get reportComment => 'Anything else we should know? (optional)';

  @override
  String get reportAlsoBlock => 'Also block this person';

  @override
  String get reportDone =>
      'Thanks for telling us. We’ve hidden this person from you and our team will review it.';

  @override
  String get catHarassment => 'Harassment';

  @override
  String get catScam => 'Scam or spam';

  @override
  String get catFake => 'Fake profile';

  @override
  String get catUnderage => 'May be under 18';

  @override
  String get catPhotos => 'Inappropriate photos';

  @override
  String get catThreats => 'Threats or violence';

  @override
  String get catOffline => 'Behaviour on a date';

  @override
  String get catOther => 'Something else';

  @override
  String get meTitle => 'Me';

  @override
  String get editProfile => 'Edit profile';

  @override
  String get settings => 'Settings';

  @override
  String get notifications => 'Notifications';

  @override
  String get noNotifications => 'Nothing new.';

  @override
  String get markAllRead => 'Mark all as read';

  @override
  String get sendFeedback => 'Send feedback';

  @override
  String get feedbackTitle => 'Help us improve';

  @override
  String get feedbackSent => 'Thanks! We read every message.';

  @override
  String get fbBug => 'Something broke';

  @override
  String get fbIdea => 'An idea';

  @override
  String get fbConfusing => 'Confusing';

  @override
  String get fbEngine => 'The engine felt wrong';

  @override
  String get fbOther => 'Other';

  @override
  String get invites => 'Invite friends';

  @override
  String invitesLeft(int n) {
    return '$n invites left';
  }

  @override
  String get createInvite => 'Create invite link';

  @override
  String get copied => 'Copied';

  @override
  String get alphaTools => 'Test tools';

  @override
  String get simulateLocation => 'Simulate location';

  @override
  String get resetToday => 'Reset Today’s Souls';

  @override
  String get engineDebug => 'Engine debug';

  @override
  String get blockedUsers => 'Blocked users';

  @override
  String get unblock => 'Unblock';

  @override
  String get safetyCentre => 'Safety centre';

  @override
  String get safety1 => 'Meet in a public place the first few times.';

  @override
  String get safety2 =>
      'Tell a friend where you’re going and who you’re meeting.';

  @override
  String get safety3 =>
      'Keep conversations in NearSoul until you trust someone.';

  @override
  String get safety4 =>
      'Never send money or financial details to someone you met online.';

  @override
  String get safety5 =>
      'Use Block and Report any time. Reports are confidential.';

  @override
  String get emergency => 'In an emergency, call 112.';

  @override
  String get about => 'About';

  @override
  String version(String v) {
    return 'Version $v';
  }

  @override
  String environment(String e) {
    return 'Environment: $e';
  }

  @override
  String get ipipNote =>
      'Personality items from the International Personality Item Pool (public domain).';

  @override
  String get logout => 'Sign out';

  @override
  String get deleteAccount => 'Delete account';

  @override
  String get deleteBody =>
      'Your profile, photos, answers and matches will be deleted. You’ll be signed out and invisible immediately. Some safety records are kept anonymised as required by law.';

  @override
  String get deleteConfirm => 'Delete my account';

  @override
  String get discoverySetting => 'Show me in Today’s Souls';

  @override
  String get hideDistance => 'Hide my distance';

  @override
  String get readReceipts => 'Read receipts';

  @override
  String get cardVisibility => 'Personality card visible to';

  @override
  String get shareLevel => 'Report sharing level';

  @override
  String get language => 'Language';

  @override
  String get testVersion => 'TEST';

  @override
  String get sessionExpired => 'Please sign in again.';

  @override
  String get photoMin => 'Keep at least 2 photos while you’re discoverable.';

  @override
  String get rateLimited => 'Too many tries. Please wait a moment.';

  @override
  String get downloadTitle => 'Get NearSoul';

  @override
  String get downloadWeb => 'Open in your browser';

  @override
  String get downloadWebHint =>
      'Works on any phone or computer. To install: Chrome/Edge → menu → “Install app”; iPhone Safari → Share → “Add to Home Screen”.';

  @override
  String get downloadAndroid => 'Android app (APK)';

  @override
  String get downloadAndroidHint =>
      'Download, open the file and allow installs from this source when asked.';

  @override
  String get downloadIos => 'iPhone (TestFlight)';

  @override
  String get downloadDesktop => 'Desktop apps (Windows, macOS, Linux)';

  @override
  String get downloadDesktopHint =>
      'Test builds are unsigned. On macOS: right-click the app → Open.';

  @override
  String get notAvailableYet => 'Not available yet';

  @override
  String get deepIntro =>
      '4 short parts, about 4 minutes each. Each part unlocks more facets of your personality.';

  @override
  String deepPart(int n) {
    return 'Part $n of 4';
  }

  @override
  String get deepPartDone => 'Part complete! New facets unlocked.';

  @override
  String get deepAllDone =>
      'All parts done. Your profile now uses all 116 questions.';

  @override
  String get facets => 'Facets';

  @override
  String get soulTalkIntroTitle => 'Get to know yourself';

  @override
  String get soulTalkIntroBody =>
      'Short, guided conversations about what you want, what gives you energy and how you connect. Only you can see them.';

  @override
  String get soulNotTherapy => 'This is self-reflection, not therapy.';

  @override
  String get soulPrivacy =>
      'Your Soul Talk is private and encrypted. Nobody at NearSoul can read it. Conversations are deleted after 90 days unless you choose to keep them.';

  @override
  String get soulConsentCta => 'I agree, let\'s start';

  @override
  String get soulTopics => 'Topics';

  @override
  String get soulSuggested => 'Suggested for you';

  @override
  String get soulDoneBadge => 'Done';

  @override
  String get soulResume => 'Continue';

  @override
  String get soulEnd => 'End session';

  @override
  String get soulThinking => 'Thinking…';

  @override
  String get soulRetry => 'Something went wrong. Tap to try again.';

  @override
  String get soulWrapTitle => 'What you discovered today';

  @override
  String get soulKeep => 'Keep';

  @override
  String get soulDiscard => 'Discard';

  @override
  String soulBasedOn(String evidence) {
    return 'Based on what you said: $evidence';
  }

  @override
  String get soulVisPrivate => 'Only me';

  @override
  String get soulVisMatching => 'Use for matching';

  @override
  String get soulVisCard => 'Show on my card';

  @override
  String get soulQuestion => 'A question to sit with';

  @override
  String get soulMap => 'Soul Map';

  @override
  String get soulMapEmpty => 'Your map grows with every Soul Talk.';

  @override
  String get soulKeepConversations => 'Keep my conversations';

  @override
  String get soulDeleteAll => 'Delete all Soul Talk data';

  @override
  String get soulDeleteAllConfirm =>
      'Delete all your Soul Talk conversations and insights? This can\'t be undone.';

  @override
  String get soulSafetyContinue => 'Continue';

  @override
  String get soulSafetyEnd => 'End session';

  @override
  String get soulTooShort =>
      'This conversation was too short for insights. That\'s okay.';

  @override
  String get soulAffectsMatching => 'Can improve your matches';

  @override
  String get catValue => 'Values';

  @override
  String get catNeed => 'Needs';

  @override
  String get catPattern => 'Patterns';

  @override
  String get catStrength => 'Strengths';

  @override
  String get catPreference => 'Preferences';

  @override
  String get catGrowth => 'Growth';

  @override
  String get exportData => 'Download my data';

  @override
  String get exportRequested =>
      'We\'re preparing your data. You\'ll get an email with a download link.';

  @override
  String get exportReady => 'Your data is ready';

  @override
  String get exportPending => 'Preparing your data…';

  @override
  String get paywallTitle => 'Understand yourself and your matches deeply';

  @override
  String get paywallB1 => 'Full self report with all facets';

  @override
  String get paywallB2 => 'Full \"You two\" report for every match';

  @override
  String get paywallB3 => 'Unlimited Soul Talk';

  @override
  String get paywallMonthly => '€7.99 / month';

  @override
  String get paywallYearly => '€39.99 / year';

  @override
  String get paywallRenewal =>
      'Renews automatically until cancelled. Cancel anytime in your store settings.';

  @override
  String get paywallRestore => 'Restore purchases';

  @override
  String get paywallSoon => 'Purchases open after the beta.';

  @override
  String get soulPlus => 'Soul+';

  @override
  String soulPlusActive(String date) {
    return 'Active until $date';
  }

  @override
  String get soulPlusInactive => 'Not active';

  @override
  String get pushNotifications => 'Push notifications';

  @override
  String get pushOnHint =>
      'On for this browser. Texts never show names or messages.';

  @override
  String get pushOffHint => 'Get notified about matches and new messages.';

  @override
  String get pushBlocked =>
      'Blocked in browser settings. Allow notifications for this site to turn them on.';

  @override
  String get pushUnsupported =>
      'Not available here. On iPhone, add NearSoul to the Home Screen first.';

  @override
  String get pushEnabled => 'Notifications are on';

  @override
  String get notifyTypes => 'What to notify me about';

  @override
  String get notifyNewMatch => 'New matches';

  @override
  String get notifyNewMessage => 'New messages';

  @override
  String get notifyDailySet => 'Today’s Souls are ready (12:00)';

  @override
  String get notifyNearby => 'Someone compatible nearby';

  @override
  String get notifyOpenEnding => 'Open to meet is ending';

  @override
  String get notifyReport => 'Updates on my reports';

  @override
  String get notifyRulesNote =>
      'Quiet from 23:00 to 08:00, except messages. At most one reminder a day. Everything still appears in the bell.';

  @override
  String testCodeBanner(String code) {
    return 'Test version: no emails are sent. Your code is $code.';
  }

  @override
  String scaleLean(String side) {
    return 'More like: $side';
  }

  @override
  String get scaleMiddle => 'In between';

  @override
  String get appearance => 'Appearance';

  @override
  String get themeSystem => 'System';

  @override
  String get themeLight => 'Light';

  @override
  String get themeDark => 'Dark';

  @override
  String get paletteNeutral => 'Neutral';

  @override
  String get paletteSage => 'Sage';

  @override
  String get paletteSand => 'Sand';

  @override
  String get paletteCoral => 'Coral';

  @override
  String get profiles => 'My profiles';

  @override
  String get profilesHint =>
      'Each profile is separate: its own questions, photos, matches and chats. Your age is the same in all of them, and your profiles never see each other.';

  @override
  String get profileOwner => 'Main profile';

  @override
  String get profileCurrent => 'Current';

  @override
  String get profileSwitch => 'Switch';

  @override
  String get profileAdd => 'Add a profile';

  @override
  String get profileLabel => 'Name for yourself (only you see it)';

  @override
  String get profileRename => 'Rename';

  @override
  String get profileNew => 'New profile';

  @override
  String get profileUnfinished => 'Not finished yet';

  @override
  String profileMax(int max) {
    return 'You have the maximum of $max profiles.';
  }

  @override
  String get todayNeedsAnswers =>
      'You skipped most of the questions, so we have nothing to match you on yet. Answer them and your Today’s Souls will fill up.';

  @override
  String get answerQuestions => 'Answer the questions';

  @override
  String get subscription => 'Subscription';

  @override
  String get tierFree => 'Free';

  @override
  String get tierPlus => 'Soul+';

  @override
  String get tierGold => 'Gold';

  @override
  String get tierVip => 'VIP';

  @override
  String get tierCurrent => 'Your level';

  @override
  String featDaily(int count) {
    return 'Today’s Souls: $count a day';
  }

  @override
  String get featDailyUnlimited => 'Today’s Souls: no daily limit';

  @override
  String get featReports => 'Full self and pair reports';

  @override
  String get featLikes => 'See who liked you and like back';

  @override
  String get featLikesCount => 'See how many people liked you';

  @override
  String get featRewind => 'Undo your last pass';

  @override
  String get featPersonas => 'See how many profiles someone has';

  @override
  String featLikeLimit(int count) {
    return 'Likes: $count a day';
  }

  @override
  String get featLikeUnlimited => 'Likes: no daily limit';

  @override
  String perMonth(String price) {
    return '$price / month';
  }

  @override
  String get activateTest => 'Activate (test, free)';

  @override
  String get backToFree => 'Back to Free';

  @override
  String get testModeNote =>
      'Test version: levels switch for free, no payment. Real purchases come with the app stores.';

  @override
  String get storeSoon => 'Purchases open with the app store release.';

  @override
  String get likedYou => 'Liked you';

  @override
  String likedYouCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count people liked you',
      one: '1 person liked you',
      zero: 'No new likes yet',
    );
    return '$_temp0';
  }

  @override
  String get likedYouUpsell => 'See who they are with Gold.';

  @override
  String get seePlans => 'See levels';

  @override
  String get rewind => 'Undo';

  @override
  String get rewindDone => 'Back in your list';

  @override
  String personaCountVip(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count profiles',
      one: '1 profile',
    );
    return 'Has $_temp0';
  }

  @override
  String get moreSoulsUpsell =>
      'Want more people a day? Gold has 50, VIP has no limit.';

  @override
  String get personasVipNote =>
      'VIP members can see how many profiles you have, never which ones.';

  @override
  String get passed => 'Passed';

  @override
  String get todayHidden =>
      'You’re hidden from Today’s Souls, so we can’t show you anyone either: matching works both ways.';

  @override
  String get showMe => 'Show me';

  @override
  String get todayNeedsPhoto =>
      'Add a photo so people can see you, and you’ll see them too.';

  @override
  String get addPhoto2 => 'Add a photo';

  @override
  String get viewCards => 'Cards';

  @override
  String get viewList => 'List';

  @override
  String get dobLocked =>
      'Your date of birth can’t be changed later, so please check it.';

  @override
  String get notNowHint =>
      'If you hide yourself, we can’t show you anyone either: matching works both ways. You can turn it on in Settings.';

  @override
  String get swipeHint =>
      'Swipe right to like, left to pass. Tap the photo to open the profile.';

  @override
  String get gotIt => 'Got it';

  @override
  String get menuProfile => 'Profile';

  @override
  String get menuAccount => 'Account';

  @override
  String get menuHelp => 'Help';

  @override
  String get menuPhotos => 'Photos';

  @override
  String get menuInterests => 'Interests and bio';

  @override
  String get refineTitle => 'Refine your profile';

  @override
  String refineBody(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count more questions',
      one: '$count more question',
    );
    return '$_temp0: the more you answer, the better your matches and reports.';
  }

  @override
  String get refineDone => 'Profile refined';

  @override
  String get finishTitle => 'You’re all set!';

  @override
  String get finishBody =>
      'We’ve already picked people you could click with. People who fit you will see you in their Today’s Souls too.';

  @override
  String get startDating => 'Start meeting people';

  @override
  String get startHidden => 'Don’t show me yet';

  @override
  String get stepMissing => 'One step is still missing, opening it.';

  @override
  String get scanDoneTitle => 'First step done!';

  @override
  String get scanDoneBody =>
      'You’ve answered all 10 questions. Next up: your result. You can answer more later in the Soul tab to make your matches sharper.';

  @override
  String get scanDoneCta => 'See my result';

  @override
  String get refineDoneBody =>
      'Thanks! Your matches and reports are now more precise.';

  @override
  String get moreInfo => 'More';

  @override
  String get switchOrAdd => 'Switch or add a profile';

  @override
  String get profilesSubtitle =>
      'A second or third profile: separate questions, photos and dating';

  @override
  String get profileCreateHint =>
      'You’ll switch to the new profile right away: 10 questions, a name and a photo. You can go back any time: Me → My profiles.';

  @override
  String profileFilling(String name) {
    return 'Profile: $name';
  }

  @override
  String get personGone => 'This person is no longer available.';

  @override
  String get create => 'Create';

  @override
  String matchPercent(int n) {
    return '$n% match';
  }

  @override
  String moreReasons(int count) {
    return 'Plus $count more things in common: find them out together.';
  }

  @override
  String refineNudge(int count) {
    return 'You’ve answered 10 questions about yourself 🎉 $count more make your matches sharper. A few at a time is fine, answers are saved.';
  }

  @override
  String get refineNudgeCta => 'Continue';

  @override
  String get cardTemplateOther => 'Based on their answers';

  @override
  String get cardAiOther => 'Written by AI from their answers';

  @override
  String get adLabel => 'Sponsored';

  @override
  String get adTestLabel => 'Test ad';

  @override
  String get adHide => 'Hide';

  @override
  String get featNoAds => 'No ads';

  @override
  String get writeFirst => 'Message';

  @override
  String get writeFirstTitle => 'Write first';

  @override
  String get writeFirstHint =>
      'They’ll see your message and decide whether to reply. Up to 5 people a day. VIP.';

  @override
  String get writeFirstSent => 'Message sent. If they reply, the chat opens.';

  @override
  String get requestsTitle => 'They wrote to you first';

  @override
  String requestsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count messages are waiting',
      one: '1 message is waiting',
    );
    return '$_temp0';
  }

  @override
  String get reply => 'Reply';

  @override
  String get decline => 'Decline';

  @override
  String get featMessageFirst => 'Write first, no mutual like needed (5 a day)';

  @override
  String get appLogo => 'Logo';

  @override
  String get logoSoul => 'Main';

  @override
  String get logoPair => 'Two souls';

  @override
  String get logoHeart => 'Heart';

  @override
  String get breakTitle => 'A pause to know yourself';

  @override
  String breakBody(int count) {
    return 'You’ve seen $count people. Answer a few questions about yourself and your next Today’s Souls will fit you even better.';
  }

  @override
  String get breakGo => 'Let’s go';

  @override
  String get breakSkip => 'Skip';

  @override
  String get adPlaces => 'Places';

  @override
  String get openInMaps => 'Open in Maps';

  @override
  String get mapTitle => 'Map';

  @override
  String get mapOpen => 'Matches on the map';

  @override
  String get mapShowMe => 'Show me to my matches';

  @override
  String mapSharingUntil(String time) {
    return 'On until $time';
  }

  @override
  String get mapSharingForever => 'On until you turn it off';

  @override
  String get mapGhost => 'Off: you\'re not on the map';

  @override
  String get mapPrivacy =>
      'Matches see your approximate area (about 300–500 m), never your address. People you haven\'t matched with never see you on the map. You can turn it off at any time.';

  @override
  String get map1h => 'For 1 hour';

  @override
  String get map4h => 'For 4 hours';

  @override
  String get mapUntilOff => 'Until I turn it off';

  @override
  String get mapTurnOff => 'Turn off';

  @override
  String mapMeters(int n) {
    return '≈ $n m';
  }

  @override
  String mapKm(String km) {
    return '≈ $km km';
  }

  @override
  String mapUpdatedMin(int n) {
    return 'updated $n min ago';
  }

  @override
  String mapUpdatedH(int n) {
    return 'updated $n h ago';
  }

  @override
  String get mapEmpty =>
      'None of your matches is on the map yet. When a match turns on «Show me», they appear here.';

  @override
  String get mapNoLocation => 'Allow location to see how far your matches are.';

  @override
  String get mapAllow => 'Allow';

  @override
  String get mapPickPlace => 'Pick a place (test)';

  @override
  String get mapWrite => 'Message';

  @override
  String mapCount(int n) {
    return '$n on the map';
  }

  @override
  String get mapYou => 'You';

  @override
  String get verifiedBadge => 'Photos verified';

  @override
  String get verifyMenu => 'Verify my photos';

  @override
  String get verifyMenuSub => 'Get the blue check: one selfie, 30 seconds';

  @override
  String get verifyDone => 'Your photos are verified';

  @override
  String get verifyDoneBody =>
      'People see the blue check next to your name. It shows you are the person in your photos.';

  @override
  String get verifyTitle => 'Photo check';

  @override
  String get verifyHeadline => 'Show it\'s really you';

  @override
  String get verifyIntro =>
      'Take one selfie copying the pose below. We compare it with your profile photos and add a blue check to your profile.';

  @override
  String get verifyPoseLabel => 'Today\'s pose';

  @override
  String get verifyStep1 => 'Face the camera in good light, no sunglasses';

  @override
  String get verifyStep2 => 'Copy the pose so it is clearly visible';

  @override
  String get verifyStep3 => 'Make sure your profile photos show your face';

  @override
  String get verifyTake => 'Take a selfie';

  @override
  String get verifyPrivacy =>
      'The selfie is never shown to anyone and is deleted right after the check. We don\'t create face templates.';

  @override
  String get verifyAlphaNote =>
      'Test version: the check is approved automatically.';

  @override
  String get verifyPending => 'We\'re checking your selfie';

  @override
  String get verifyPendingBody =>
      'This usually takes less than a day. We\'ll let you know.';

  @override
  String get verifyApproved => 'Your photos are verified ✓';

  @override
  String get verifyRejected => 'The photo check didn\'t pass';

  @override
  String get verifyTryAgain =>
      'Try again with good light and the pose clearly visible.';

  @override
  String get posePeace => 'Show a peace sign next to your face';

  @override
  String get poseThumb => 'Give a thumbs up';

  @override
  String get poseThree => 'Show three fingers';

  @override
  String get poseWave => 'Wave at the camera';

  @override
  String get poseEar => 'Touch your ear';

  @override
  String get poseChin => 'Rest your chin on your hand';

  @override
  String get checkShareText =>
      'How compatible are we? Check our souls on NearSoul ✨';

  @override
  String get checkLinkCopied => 'Link copied: paste it anywhere';

  @override
  String get checkCardTitle => 'How compatible are you with…?';

  @override
  String get checkCardBody =>
      'Send your link to friends, a crush or your group chat. They answer 10 questions and you both see your compatibility, based on science, not stars.';

  @override
  String get checkStory => 'Story for Instagram';

  @override
  String get checkShareLink => 'Share my link';

  @override
  String get checkWho => 'Who checked';

  @override
  String get checkSaved => 'Saved: post it to your story';

  @override
  String get checkShareStory => 'Share to story';

  @override
  String get storyMySoul => 'MY SOUL TYPE';

  @override
  String get storyAsk => 'How compatible are we? 👀';

  @override
  String get checkTitle => 'Compatibility check';

  @override
  String get checkOwnLink =>
      'This is your own link. Send it to friends and see who fits you best.';

  @override
  String checkInvite(String name) {
    return 'You and $name: how compatible are you?';
  }

  @override
  String get checkHow =>
      'Based on your answers to 10 short questions: character, values and how you like to spend time. Nobody sees your answers.';

  @override
  String get checkGo => 'Check compatibility';

  @override
  String get checkPrivacy =>
      'You both see only the percent and why. It isn\'t a match and doesn\'t open a chat.';

  @override
  String checkYouAnd(String name) {
    return 'You and $name';
  }

  @override
  String checkVerdict(String level) {
    String _temp0 = intl.Intl.selectLogic(level, {
      'high': 'A rare match of souls 🔥',
      'good': 'You really click ✨',
      'other': 'Different, and that can be interesting 🌗',
    });
    return '$_temp0';
  }

  @override
  String get checkYou => 'You';

  @override
  String get checkWhy => 'Why you click';

  @override
  String checkMore(int n) {
    return '…and $n more things in common to find out together';
  }

  @override
  String get checkShareMine => 'Send my link to others';

  @override
  String get checkNone =>
      'Nobody has checked yet. Share your link and see who fits you best.';

  @override
  String get checkSomeone => 'Someone';

  @override
  String get checkTheyChecked => 'checked with your link';

  @override
  String get checkYouChecked => 'you checked their link';

  @override
  String get checkNotif => 'Someone checked compatibility with you 💫';

  @override
  String matchWith(String name) {
    return 'You and $name like each other';
  }

  @override
  String get matchMiniReport => 'You two in a nutshell';

  @override
  String matchTheirType(String name, String type) {
    return '$name is «$type»';
  }

  @override
  String get matchHowToStart => 'How to start';

  @override
  String get matchTapStarter =>
      'Tap one: it goes into the message box, you decide when to send.';

  @override
  String get socialApple => 'Continue with Apple';

  @override
  String get socialGoogle => 'Continue with Google';

  @override
  String get socialVk => 'Sign in with VK ID';

  @override
  String get continueEmail => 'Continue with email';

  @override
  String get or => 'or';

  @override
  String socialSoon(String name) {
    return 'Sign in with $name is coming soon. Use email for now.';
  }

  @override
  String get socialNative =>
      'In the app, sign in with email for now. Google, Apple and VK work on the website.';

  @override
  String get socialPopupBlocked =>
      'Your browser blocked the sign-in window. Allow pop-ups and try again.';

  @override
  String get socialFailed => 'Sign-in didn\'t work. Please try again.';
}
