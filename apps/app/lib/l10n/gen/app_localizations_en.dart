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
  String get welcome1 => 'Find out who you are in love, in 6 minutes.';

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
      'About 6 minutes. No right or wrong answers. Just be honest with yourself.';

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
  String get cardTitle => 'Your Personality DNA';

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
  String get photosHint => 'At least 2. Clear, recent photos of you work best.';

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
}
