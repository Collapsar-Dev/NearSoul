import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_ru.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'gen/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('ru'),
  ];

  /// No description provided for @appName.
  ///
  /// In en, this message translates to:
  /// **'NearSoul'**
  String get appName;

  /// No description provided for @tagline.
  ///
  /// In en, this message translates to:
  /// **'Get to know yourself. Discover someone compatible.'**
  String get tagline;

  /// No description provided for @welcome1.
  ///
  /// In en, this message translates to:
  /// **'Find out who you are in love, in 6 minutes.'**
  String get welcome1;

  /// No description provided for @welcome2.
  ///
  /// In en, this message translates to:
  /// **'Meet people who truly fit you, even nearby, right now.'**
  String get welcome2;

  /// No description provided for @welcome3.
  ///
  /// In en, this message translates to:
  /// **'Your exact location is never shared. Ever.'**
  String get welcome3;

  /// No description provided for @getStarted.
  ///
  /// In en, this message translates to:
  /// **'Get started'**
  String get getStarted;

  /// No description provided for @haveAccount.
  ///
  /// In en, this message translates to:
  /// **'I have an account'**
  String get haveAccount;

  /// No description provided for @continueBtn.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get continueBtn;

  /// No description provided for @back.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get back;

  /// No description provided for @skip.
  ///
  /// In en, this message translates to:
  /// **'Skip'**
  String get skip;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @done.
  ///
  /// In en, this message translates to:
  /// **'Done'**
  String get done;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Try again'**
  String get retry;

  /// No description provided for @close.
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get close;

  /// No description provided for @loading.
  ///
  /// In en, this message translates to:
  /// **'Loading…'**
  String get loading;

  /// No description provided for @somethingWrong.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong.'**
  String get somethingWrong;

  /// No description provided for @offline.
  ///
  /// In en, this message translates to:
  /// **'You’re offline. We’ll retry when you’re back.'**
  String get offline;

  /// No description provided for @emailTitle.
  ///
  /// In en, this message translates to:
  /// **'What’s your email?'**
  String get emailTitle;

  /// No description provided for @emailHint.
  ///
  /// In en, this message translates to:
  /// **'We’ll send you a 6-digit code. No passwords.'**
  String get emailHint;

  /// No description provided for @emailLabel.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get emailLabel;

  /// No description provided for @emailInvalid.
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid email.'**
  String get emailInvalid;

  /// No description provided for @termsNote.
  ///
  /// In en, this message translates to:
  /// **'By continuing you agree to our Terms and Privacy Policy.'**
  String get termsNote;

  /// No description provided for @codeTitle.
  ///
  /// In en, this message translates to:
  /// **'Enter your code'**
  String get codeTitle;

  /// No description provided for @codeSent.
  ///
  /// In en, this message translates to:
  /// **'We sent a code to {email}'**
  String codeSent(String email);

  /// No description provided for @codeLabel.
  ///
  /// In en, this message translates to:
  /// **'6-digit code'**
  String get codeLabel;

  /// No description provided for @resendIn.
  ///
  /// In en, this message translates to:
  /// **'Resend in {seconds}s'**
  String resendIn(int seconds);

  /// No description provided for @resend.
  ///
  /// In en, this message translates to:
  /// **'Send a new code'**
  String get resend;

  /// No description provided for @checkSpam.
  ///
  /// In en, this message translates to:
  /// **'Can’t find it? Check your spam folder.'**
  String get checkSpam;

  /// No description provided for @inviteLabel.
  ///
  /// In en, this message translates to:
  /// **'Invite code'**
  String get inviteLabel;

  /// No description provided for @inviteHint.
  ///
  /// In en, this message translates to:
  /// **'NearSoul is invite-only right now. Ask the person who shared it with you.'**
  String get inviteHint;

  /// No description provided for @dobTitle.
  ///
  /// In en, this message translates to:
  /// **'When were you born?'**
  String get dobTitle;

  /// No description provided for @dobHint.
  ///
  /// In en, this message translates to:
  /// **'You must be 18 or older. We only show your age, never your birthday.'**
  String get dobHint;

  /// No description provided for @dobPick.
  ///
  /// In en, this message translates to:
  /// **'Choose date'**
  String get dobPick;

  /// No description provided for @dobConfirm.
  ///
  /// In en, this message translates to:
  /// **'You are {age}. Is that right?'**
  String dobConfirm(int age);

  /// No description provided for @blockedTitle.
  ///
  /// In en, this message translates to:
  /// **'Sorry, NearSoul is for adults only'**
  String get blockedTitle;

  /// No description provided for @blockedBody.
  ///
  /// In en, this message translates to:
  /// **'You need to be 18 or older to use NearSoul.'**
  String get blockedBody;

  /// No description provided for @consentTitle.
  ///
  /// In en, this message translates to:
  /// **'A few agreements'**
  String get consentTitle;

  /// No description provided for @consentTerms.
  ///
  /// In en, this message translates to:
  /// **'I agree to the Terms and Privacy Policy (required)'**
  String get consentTerms;

  /// No description provided for @consentAlpha.
  ///
  /// In en, this message translates to:
  /// **'I understand this is a test version: things may break, test data may be reset with 48 h notice, and I won’t share screenshots of other testers’ profiles (required)'**
  String get consentAlpha;

  /// No description provided for @consentAi.
  ///
  /// In en, this message translates to:
  /// **'Let AI write my personality card from my answers'**
  String get consentAi;

  /// No description provided for @consentAiHint.
  ///
  /// In en, this message translates to:
  /// **'Only trait results are sent, never your email, photos or location. Without it we use a template.'**
  String get consentAiHint;

  /// No description provided for @consentAnalytics.
  ///
  /// In en, this message translates to:
  /// **'Help improve NearSoul with anonymous usage analytics'**
  String get consentAnalytics;

  /// No description provided for @consentEmails.
  ///
  /// In en, this message translates to:
  /// **'Product news by email'**
  String get consentEmails;

  /// No description provided for @scanIntroTitle.
  ///
  /// In en, this message translates to:
  /// **'Let’s meet your soul'**
  String get scanIntroTitle;

  /// No description provided for @scanIntroBody.
  ///
  /// In en, this message translates to:
  /// **'About 6 minutes. No right or wrong answers. Just be honest with yourself.'**
  String get scanIntroBody;

  /// No description provided for @scanStart.
  ///
  /// In en, this message translates to:
  /// **'Start'**
  String get scanStart;

  /// No description provided for @blockA.
  ///
  /// In en, this message translates to:
  /// **'How you are'**
  String get blockA;

  /// No description provided for @blockB.
  ///
  /// In en, this message translates to:
  /// **'How you love'**
  String get blockB;

  /// No description provided for @blockC.
  ///
  /// In en, this message translates to:
  /// **'What matters'**
  String get blockC;

  /// No description provided for @blockD.
  ///
  /// In en, this message translates to:
  /// **'How you live'**
  String get blockD;

  /// No description provided for @blockX.
  ///
  /// In en, this message translates to:
  /// **'Hard no\'s'**
  String get blockX;

  /// No description provided for @scanHowAccurate.
  ///
  /// In en, this message translates to:
  /// **'How accurately does this describe you?'**
  String get scanHowAccurate;

  /// No description provided for @scanProgress.
  ///
  /// In en, this message translates to:
  /// **'{done} of {total}'**
  String scanProgress(int done, int total);

  /// No description provided for @scanInterlude.
  ///
  /// In en, this message translates to:
  /// **'Nice. Next: {block}'**
  String scanInterlude(String block);

  /// No description provided for @untranslated.
  ///
  /// In en, this message translates to:
  /// **'Shown in English until the official translation is approved.'**
  String get untranslated;

  /// No description provided for @pickUpTo.
  ///
  /// In en, this message translates to:
  /// **'Pick up to {n}'**
  String pickUpTo(int n);

  /// No description provided for @pickExactly.
  ///
  /// In en, this message translates to:
  /// **'Pick exactly {n}'**
  String pickExactly(int n);

  /// No description provided for @revealTitle.
  ///
  /// In en, this message translates to:
  /// **'Meet your soul'**
  String get revealTitle;

  /// No description provided for @revealStrengths.
  ///
  /// In en, this message translates to:
  /// **'Your strengths'**
  String get revealStrengths;

  /// No description provided for @revealRate.
  ///
  /// In en, this message translates to:
  /// **'How accurate does this feel?'**
  String get revealRate;

  /// No description provided for @revealRateThanks.
  ///
  /// In en, this message translates to:
  /// **'Thanks! This helps us tune the engine.'**
  String get revealRateThanks;

  /// No description provided for @revealOff.
  ///
  /// In en, this message translates to:
  /// **'What felt off? (optional)'**
  String get revealOff;

  /// No description provided for @lowConfidence.
  ///
  /// In en, this message translates to:
  /// **'Answer a few more questions to sharpen this.'**
  String get lowConfidence;

  /// No description provided for @cardTitle.
  ///
  /// In en, this message translates to:
  /// **'Your personality card'**
  String get cardTitle;

  /// No description provided for @cardAi.
  ///
  /// In en, this message translates to:
  /// **'Written with AI from your answers'**
  String get cardAi;

  /// No description provided for @cardTemplate.
  ///
  /// In en, this message translates to:
  /// **'Written from your answers'**
  String get cardTemplate;

  /// No description provided for @cardShow.
  ///
  /// In en, this message translates to:
  /// **'Show on profile'**
  String get cardShow;

  /// No description provided for @cardEdit.
  ///
  /// In en, this message translates to:
  /// **'Edit'**
  String get cardEdit;

  /// No description provided for @cardHide.
  ///
  /// In en, this message translates to:
  /// **'Hide'**
  String get cardHide;

  /// No description provided for @cardGenerating.
  ///
  /// In en, this message translates to:
  /// **'Writing your card…'**
  String get cardGenerating;

  /// No description provided for @cardHeadline.
  ///
  /// In en, this message translates to:
  /// **'Headline'**
  String get cardHeadline;

  /// No description provided for @cardSummary.
  ///
  /// In en, this message translates to:
  /// **'Summary'**
  String get cardSummary;

  /// No description provided for @cardComm.
  ///
  /// In en, this message translates to:
  /// **'Communication style'**
  String get cardComm;

  /// No description provided for @cardDate.
  ///
  /// In en, this message translates to:
  /// **'Ideal first date'**
  String get cardDate;

  /// No description provided for @visibilityEveryone.
  ///
  /// In en, this message translates to:
  /// **'Everyone'**
  String get visibilityEveryone;

  /// No description provided for @visibilityMatches.
  ///
  /// In en, this message translates to:
  /// **'Matches only'**
  String get visibilityMatches;

  /// No description provided for @visibilityHidden.
  ///
  /// In en, this message translates to:
  /// **'Hidden'**
  String get visibilityHidden;

  /// No description provided for @shareTitle.
  ///
  /// In en, this message translates to:
  /// **'How much can your matches learn about you?'**
  String get shareTitle;

  /// No description provided for @shareReciprocity.
  ///
  /// In en, this message translates to:
  /// **'You see as deep as you share.'**
  String get shareReciprocity;

  /// No description provided for @shareMinimal.
  ///
  /// In en, this message translates to:
  /// **'Minimal'**
  String get shareMinimal;

  /// No description provided for @shareMinimalDesc.
  ///
  /// In en, this message translates to:
  /// **'Only your compatibility tier and what you have in common.'**
  String get shareMinimalDesc;

  /// No description provided for @shareStandard.
  ///
  /// In en, this message translates to:
  /// **'Standard (recommended)'**
  String get shareStandard;

  /// No description provided for @shareStandardDesc.
  ///
  /// In en, this message translates to:
  /// **'Plus where you might differ and tips on how to talk to you.'**
  String get shareStandardDesc;

  /// No description provided for @shareDeep.
  ///
  /// In en, this message translates to:
  /// **'Deep'**
  String get shareDeep;

  /// No description provided for @shareDeepDesc.
  ///
  /// In en, this message translates to:
  /// **'Plus your Big Five bands side by side.'**
  String get shareDeepDesc;

  /// No description provided for @basicsTitle.
  ///
  /// In en, this message translates to:
  /// **'A little about you'**
  String get basicsTitle;

  /// No description provided for @firstName.
  ///
  /// In en, this message translates to:
  /// **'First name'**
  String get firstName;

  /// No description provided for @iAm.
  ///
  /// In en, this message translates to:
  /// **'I am'**
  String get iAm;

  /// No description provided for @interestedIn.
  ///
  /// In en, this message translates to:
  /// **'Interested in'**
  String get interestedIn;

  /// No description provided for @lookingFor.
  ///
  /// In en, this message translates to:
  /// **'Looking for'**
  String get lookingFor;

  /// No description provided for @genderWoman.
  ///
  /// In en, this message translates to:
  /// **'Woman'**
  String get genderWoman;

  /// No description provided for @genderMan.
  ///
  /// In en, this message translates to:
  /// **'Man'**
  String get genderMan;

  /// No description provided for @genderNonBinary.
  ///
  /// In en, this message translates to:
  /// **'Non-binary'**
  String get genderNonBinary;

  /// No description provided for @women.
  ///
  /// In en, this message translates to:
  /// **'Women'**
  String get women;

  /// No description provided for @men.
  ///
  /// In en, this message translates to:
  /// **'Men'**
  String get men;

  /// No description provided for @nonBinaryPeople.
  ///
  /// In en, this message translates to:
  /// **'Non-binary people'**
  String get nonBinaryPeople;

  /// No description provided for @intentLong.
  ///
  /// In en, this message translates to:
  /// **'A long-term relationship'**
  String get intentLong;

  /// No description provided for @intentOpen.
  ///
  /// In en, this message translates to:
  /// **'Dating, open to long-term'**
  String get intentOpen;

  /// No description provided for @intentCasual.
  ///
  /// In en, this message translates to:
  /// **'Something casual'**
  String get intentCasual;

  /// No description provided for @intentNotSure.
  ///
  /// In en, this message translates to:
  /// **'Not sure yet'**
  String get intentNotSure;

  /// No description provided for @ageRange.
  ///
  /// In en, this message translates to:
  /// **'Age range: {min}–{max}'**
  String ageRange(int min, int max);

  /// No description provided for @city.
  ///
  /// In en, this message translates to:
  /// **'City'**
  String get city;

  /// No description provided for @photosTitle.
  ///
  /// In en, this message translates to:
  /// **'Add your photos'**
  String get photosTitle;

  /// No description provided for @photosHint.
  ///
  /// In en, this message translates to:
  /// **'At least one photo. A clear, recent one of you works best.'**
  String get photosHint;

  /// No description provided for @addPhoto.
  ///
  /// In en, this message translates to:
  /// **'Add photo'**
  String get addPhoto;

  /// No description provided for @fromGallery.
  ///
  /// In en, this message translates to:
  /// **'Choose from gallery'**
  String get fromGallery;

  /// No description provided for @fromCamera.
  ///
  /// In en, this message translates to:
  /// **'Take a photo'**
  String get fromCamera;

  /// No description provided for @uploading.
  ///
  /// In en, this message translates to:
  /// **'Uploading…'**
  String get uploading;

  /// No description provided for @interestsTitle.
  ///
  /// In en, this message translates to:
  /// **'What do you enjoy?'**
  String get interestsTitle;

  /// No description provided for @interestsCount.
  ///
  /// In en, this message translates to:
  /// **'{n} of 3–10 selected'**
  String interestsCount(int n);

  /// No description provided for @bio.
  ///
  /// In en, this message translates to:
  /// **'Bio (optional)'**
  String get bio;

  /// No description provided for @bioHint.
  ///
  /// In en, this message translates to:
  /// **'A few words about you. No links or contacts.'**
  String get bioHint;

  /// No description provided for @discoveryTitle.
  ///
  /// In en, this message translates to:
  /// **'Show me to compatible people?'**
  String get discoveryTitle;

  /// No description provided for @discoveryBody.
  ///
  /// In en, this message translates to:
  /// **'You’ll appear in other people’s Today’s Souls. You can turn this off any time.'**
  String get discoveryBody;

  /// No description provided for @discoveryOn.
  ///
  /// In en, this message translates to:
  /// **'Yes, show me'**
  String get discoveryOn;

  /// No description provided for @notNow.
  ///
  /// In en, this message translates to:
  /// **'Not now'**
  String get notNow;

  /// No description provided for @tabToday.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get tabToday;

  /// No description provided for @tabNearby.
  ///
  /// In en, this message translates to:
  /// **'Nearby'**
  String get tabNearby;

  /// No description provided for @tabSoul.
  ///
  /// In en, this message translates to:
  /// **'Soul'**
  String get tabSoul;

  /// No description provided for @tabMatches.
  ///
  /// In en, this message translates to:
  /// **'Matches'**
  String get tabMatches;

  /// No description provided for @tabMe.
  ///
  /// In en, this message translates to:
  /// **'Me'**
  String get tabMe;

  /// No description provided for @todayTitle.
  ///
  /// In en, this message translates to:
  /// **'Today’s Souls'**
  String get todayTitle;

  /// No description provided for @todayLeft.
  ///
  /// In en, this message translates to:
  /// **'{n} left'**
  String todayLeft(int n);

  /// No description provided for @todayDone.
  ///
  /// In en, this message translates to:
  /// **'That’s today’s set. New souls at 12:00.'**
  String get todayDone;

  /// No description provided for @todayEmpty.
  ///
  /// In en, this message translates to:
  /// **'No one new right now. Try Open to meet or widen your preferences.'**
  String get todayEmpty;

  /// No description provided for @tryNearby.
  ///
  /// In en, this message translates to:
  /// **'Try Nearby'**
  String get tryNearby;

  /// No description provided for @like.
  ///
  /// In en, this message translates to:
  /// **'Like'**
  String get like;

  /// No description provided for @pass.
  ///
  /// In en, this message translates to:
  /// **'Pass'**
  String get pass;

  /// No description provided for @later.
  ///
  /// In en, this message translates to:
  /// **'Later'**
  String get later;

  /// No description provided for @undo.
  ///
  /// In en, this message translates to:
  /// **'Undo'**
  String get undo;

  /// No description provided for @whyClick.
  ///
  /// In en, this message translates to:
  /// **'Why you might click'**
  String get whyClick;

  /// No description provided for @oneDifference.
  ///
  /// In en, this message translates to:
  /// **'One difference'**
  String get oneDifference;

  /// No description provided for @demoBadge.
  ///
  /// In en, this message translates to:
  /// **'DEMO'**
  String get demoBadge;

  /// No description provided for @tierStrong.
  ///
  /// In en, this message translates to:
  /// **'Strong match'**
  String get tierStrong;

  /// No description provided for @tierGood.
  ///
  /// In en, this message translates to:
  /// **'Good match'**
  String get tierGood;

  /// No description provided for @tierSome.
  ///
  /// In en, this message translates to:
  /// **'Some common ground'**
  String get tierSome;

  /// No description provided for @tierLow.
  ///
  /// In en, this message translates to:
  /// **'Different vibes'**
  String get tierLow;

  /// No description provided for @sharedInterest.
  ///
  /// In en, this message translates to:
  /// **'Shared'**
  String get sharedInterest;

  /// No description provided for @aboutPerson.
  ///
  /// In en, this message translates to:
  /// **'About'**
  String get aboutPerson;

  /// No description provided for @interests.
  ///
  /// In en, this message translates to:
  /// **'Interests'**
  String get interests;

  /// No description provided for @itsMatch.
  ///
  /// In en, this message translates to:
  /// **'It’s a match!'**
  String get itsMatch;

  /// No description provided for @bothNearby.
  ///
  /// In en, this message translates to:
  /// **'You’re both nearby, say hi 👋'**
  String get bothNearby;

  /// No description provided for @sayHi.
  ///
  /// In en, this message translates to:
  /// **'Say hi'**
  String get sayHi;

  /// No description provided for @keepExploring.
  ///
  /// In en, this message translates to:
  /// **'Keep exploring'**
  String get keepExploring;

  /// No description provided for @likeLimit.
  ///
  /// In en, this message translates to:
  /// **'You’ve reached today’s like limit. New likes tomorrow.'**
  String get likeLimit;

  /// No description provided for @nearbyOffTitle.
  ///
  /// In en, this message translates to:
  /// **'Open to meet'**
  String get nearbyOffTitle;

  /// No description provided for @nearbyOffBody.
  ///
  /// In en, this message translates to:
  /// **'Turn it on for 1–4 hours. If someone compatible who’s also open is nearby, you’ll both get one private alert.'**
  String get nearbyOffBody;

  /// No description provided for @nearbySafety.
  ///
  /// In en, this message translates to:
  /// **'Others only ever see a distance range, never where you are.'**
  String get nearbySafety;

  /// No description provided for @openToMeetCta.
  ///
  /// In en, this message translates to:
  /// **'I’m open to meet'**
  String get openToMeetCta;

  /// No description provided for @locationTitle.
  ///
  /// In en, this message translates to:
  /// **'Your location stays private'**
  String get locationTitle;

  /// No description provided for @locationBody.
  ///
  /// In en, this message translates to:
  /// **'NearSoul uses your approximate area only while the app is open. Others see a range like “Under 1 km”, never where you are. We keep only your latest approximate area and delete it within 24 hours.'**
  String get locationBody;

  /// No description provided for @allowLocation.
  ///
  /// In en, this message translates to:
  /// **'Allow location'**
  String get allowLocation;

  /// No description provided for @locationDenied.
  ///
  /// In en, this message translates to:
  /// **'Location is off. Nearby needs it; everything else works without it.'**
  String get locationDenied;

  /// No description provided for @locationDesktop.
  ///
  /// In en, this message translates to:
  /// **'Nearby works best on your phone.'**
  String get locationDesktop;

  /// No description provided for @duration.
  ///
  /// In en, this message translates to:
  /// **'For how long?'**
  String get duration;

  /// No description provided for @hours.
  ///
  /// In en, this message translates to:
  /// **'{n} h'**
  String hours(int n);

  /// No description provided for @radius.
  ///
  /// In en, this message translates to:
  /// **'How far?'**
  String get radius;

  /// No description provided for @activity.
  ///
  /// In en, this message translates to:
  /// **'Up for (optional)'**
  String get activity;

  /// No description provided for @actCoffee.
  ///
  /// In en, this message translates to:
  /// **'☕ Coffee'**
  String get actCoffee;

  /// No description provided for @actWalk.
  ///
  /// In en, this message translates to:
  /// **'🚶 Walk'**
  String get actWalk;

  /// No description provided for @actDrinks.
  ///
  /// In en, this message translates to:
  /// **'🍷 Drinks'**
  String get actDrinks;

  /// No description provided for @actChat.
  ///
  /// In en, this message translates to:
  /// **'💬 Just chat'**
  String get actChat;

  /// No description provided for @start.
  ///
  /// In en, this message translates to:
  /// **'Start'**
  String get start;

  /// No description provided for @stop.
  ///
  /// In en, this message translates to:
  /// **'Stop'**
  String get stop;

  /// No description provided for @openLeft.
  ///
  /// In en, this message translates to:
  /// **'Open to meet · {time} left'**
  String openLeft(String time);

  /// No description provided for @nearbyWaiting.
  ///
  /// In en, this message translates to:
  /// **'We’ll let you know when someone compatible is close.'**
  String get nearbyWaiting;

  /// No description provided for @nearbyList.
  ///
  /// In en, this message translates to:
  /// **'Nearby now'**
  String get nearbyList;

  /// No description provided for @simulated.
  ///
  /// In en, this message translates to:
  /// **'Simulated location (test mode)'**
  String get simulated;

  /// No description provided for @soulTitle.
  ///
  /// In en, this message translates to:
  /// **'Your soul'**
  String get soulTitle;

  /// No description provided for @profileDepth.
  ///
  /// In en, this message translates to:
  /// **'Profile depth {n}%'**
  String profileDepth(int n);

  /// No description provided for @selfReport.
  ///
  /// In en, this message translates to:
  /// **'Your full report'**
  String get selfReport;

  /// No description provided for @retakeScan.
  ///
  /// In en, this message translates to:
  /// **'Retake the Quick Scan'**
  String get retakeScan;

  /// No description provided for @retakeConfirm.
  ///
  /// In en, this message translates to:
  /// **'Retake the personality part? Your matches will update.'**
  String get retakeConfirm;

  /// No description provided for @comingSoon.
  ///
  /// In en, this message translates to:
  /// **'Coming soon'**
  String get comingSoon;

  /// No description provided for @soulTalk.
  ///
  /// In en, this message translates to:
  /// **'Soul Talk'**
  String get soulTalk;

  /// No description provided for @deepPersonality.
  ///
  /// In en, this message translates to:
  /// **'Deep Personality'**
  String get deepPersonality;

  /// No description provided for @freeBeta.
  ///
  /// In en, this message translates to:
  /// **'Free during beta'**
  String get freeBeta;

  /// No description provided for @locked.
  ///
  /// In en, this message translates to:
  /// **'Unlock with Soul+'**
  String get locked;

  /// No description provided for @needs.
  ///
  /// In en, this message translates to:
  /// **'What you need from a partner'**
  String get needs;

  /// No description provided for @growth.
  ///
  /// In en, this message translates to:
  /// **'Growth edges'**
  String get growth;

  /// No description provided for @reflect.
  ///
  /// In en, this message translates to:
  /// **'Questions to reflect on'**
  String get reflect;

  /// No description provided for @values.
  ///
  /// In en, this message translates to:
  /// **'Your values'**
  String get values;

  /// No description provided for @relationshipStyle.
  ///
  /// In en, this message translates to:
  /// **'You in relationships'**
  String get relationshipStyle;

  /// No description provided for @inDating.
  ///
  /// In en, this message translates to:
  /// **'In dating'**
  String get inDating;

  /// No description provided for @matchesTitle.
  ///
  /// In en, this message translates to:
  /// **'Matches'**
  String get matchesTitle;

  /// No description provided for @newMatches.
  ///
  /// In en, this message translates to:
  /// **'New matches'**
  String get newMatches;

  /// No description provided for @conversations.
  ///
  /// In en, this message translates to:
  /// **'Conversations'**
  String get conversations;

  /// No description provided for @noMatches.
  ///
  /// In en, this message translates to:
  /// **'No matches yet. Like a few people in Today’s Souls to get started.'**
  String get noMatches;

  /// No description provided for @deletedUser.
  ///
  /// In en, this message translates to:
  /// **'Deleted user'**
  String get deletedUser;

  /// No description provided for @typeMessage.
  ///
  /// In en, this message translates to:
  /// **'Message'**
  String get typeMessage;

  /// No description provided for @send.
  ///
  /// In en, this message translates to:
  /// **'Send'**
  String get send;

  /// No description provided for @notSent.
  ///
  /// In en, this message translates to:
  /// **'Not sent · Tap to retry'**
  String get notSent;

  /// No description provided for @conversationEnded.
  ///
  /// In en, this message translates to:
  /// **'This conversation has ended.'**
  String get conversationEnded;

  /// No description provided for @safetyTip.
  ///
  /// In en, this message translates to:
  /// **'Be careful with links and numbers from people you haven’t met yet.'**
  String get safetyTip;

  /// No description provided for @starters.
  ///
  /// In en, this message translates to:
  /// **'Conversation starters'**
  String get starters;

  /// No description provided for @youTwo.
  ///
  /// In en, this message translates to:
  /// **'You two'**
  String get youTwo;

  /// No description provided for @pairAccuracy.
  ///
  /// In en, this message translates to:
  /// **'Did this match your impression?'**
  String get pairAccuracy;

  /// No description provided for @frictions.
  ///
  /// In en, this message translates to:
  /// **'Where you might differ'**
  String get frictions;

  /// No description provided for @tips.
  ///
  /// In en, this message translates to:
  /// **'How to talk to {name}'**
  String tips(String name);

  /// No description provided for @firstDate.
  ///
  /// In en, this message translates to:
  /// **'First date ideas'**
  String get firstDate;

  /// No description provided for @layers.
  ///
  /// In en, this message translates to:
  /// **'Your layers side by side'**
  String get layers;

  /// No description provided for @unmatch.
  ///
  /// In en, this message translates to:
  /// **'Unmatch'**
  String get unmatch;

  /// No description provided for @unmatchConfirm.
  ///
  /// In en, this message translates to:
  /// **'Unmatch {name}? You won’t see each other again.'**
  String unmatchConfirm(String name);

  /// No description provided for @block.
  ///
  /// In en, this message translates to:
  /// **'Block'**
  String get block;

  /// No description provided for @blockConfirm.
  ///
  /// In en, this message translates to:
  /// **'Block {name}? They won’t be able to see or contact you. They won’t be notified.'**
  String blockConfirm(String name);

  /// No description provided for @report.
  ///
  /// In en, this message translates to:
  /// **'Report'**
  String get report;

  /// No description provided for @reportTitle.
  ///
  /// In en, this message translates to:
  /// **'What’s wrong?'**
  String get reportTitle;

  /// No description provided for @reportComment.
  ///
  /// In en, this message translates to:
  /// **'Anything else we should know? (optional)'**
  String get reportComment;

  /// No description provided for @reportAlsoBlock.
  ///
  /// In en, this message translates to:
  /// **'Also block this person'**
  String get reportAlsoBlock;

  /// No description provided for @reportDone.
  ///
  /// In en, this message translates to:
  /// **'Thanks for telling us. We’ve hidden this person from you and our team will review it.'**
  String get reportDone;

  /// No description provided for @catHarassment.
  ///
  /// In en, this message translates to:
  /// **'Harassment'**
  String get catHarassment;

  /// No description provided for @catScam.
  ///
  /// In en, this message translates to:
  /// **'Scam or spam'**
  String get catScam;

  /// No description provided for @catFake.
  ///
  /// In en, this message translates to:
  /// **'Fake profile'**
  String get catFake;

  /// No description provided for @catUnderage.
  ///
  /// In en, this message translates to:
  /// **'May be under 18'**
  String get catUnderage;

  /// No description provided for @catPhotos.
  ///
  /// In en, this message translates to:
  /// **'Inappropriate photos'**
  String get catPhotos;

  /// No description provided for @catThreats.
  ///
  /// In en, this message translates to:
  /// **'Threats or violence'**
  String get catThreats;

  /// No description provided for @catOffline.
  ///
  /// In en, this message translates to:
  /// **'Behaviour on a date'**
  String get catOffline;

  /// No description provided for @catOther.
  ///
  /// In en, this message translates to:
  /// **'Something else'**
  String get catOther;

  /// No description provided for @meTitle.
  ///
  /// In en, this message translates to:
  /// **'Me'**
  String get meTitle;

  /// No description provided for @editProfile.
  ///
  /// In en, this message translates to:
  /// **'Edit profile'**
  String get editProfile;

  /// No description provided for @settings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// No description provided for @notifications.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notifications;

  /// No description provided for @noNotifications.
  ///
  /// In en, this message translates to:
  /// **'Nothing new.'**
  String get noNotifications;

  /// No description provided for @markAllRead.
  ///
  /// In en, this message translates to:
  /// **'Mark all as read'**
  String get markAllRead;

  /// No description provided for @sendFeedback.
  ///
  /// In en, this message translates to:
  /// **'Send feedback'**
  String get sendFeedback;

  /// No description provided for @feedbackTitle.
  ///
  /// In en, this message translates to:
  /// **'Help us improve'**
  String get feedbackTitle;

  /// No description provided for @feedbackSent.
  ///
  /// In en, this message translates to:
  /// **'Thanks! We read every message.'**
  String get feedbackSent;

  /// No description provided for @fbBug.
  ///
  /// In en, this message translates to:
  /// **'Something broke'**
  String get fbBug;

  /// No description provided for @fbIdea.
  ///
  /// In en, this message translates to:
  /// **'An idea'**
  String get fbIdea;

  /// No description provided for @fbConfusing.
  ///
  /// In en, this message translates to:
  /// **'Confusing'**
  String get fbConfusing;

  /// No description provided for @fbEngine.
  ///
  /// In en, this message translates to:
  /// **'The engine felt wrong'**
  String get fbEngine;

  /// No description provided for @fbOther.
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get fbOther;

  /// No description provided for @invites.
  ///
  /// In en, this message translates to:
  /// **'Invite friends'**
  String get invites;

  /// No description provided for @invitesLeft.
  ///
  /// In en, this message translates to:
  /// **'{n} invites left'**
  String invitesLeft(int n);

  /// No description provided for @createInvite.
  ///
  /// In en, this message translates to:
  /// **'Create invite link'**
  String get createInvite;

  /// No description provided for @copied.
  ///
  /// In en, this message translates to:
  /// **'Copied'**
  String get copied;

  /// No description provided for @alphaTools.
  ///
  /// In en, this message translates to:
  /// **'Test tools'**
  String get alphaTools;

  /// No description provided for @simulateLocation.
  ///
  /// In en, this message translates to:
  /// **'Simulate location'**
  String get simulateLocation;

  /// No description provided for @resetToday.
  ///
  /// In en, this message translates to:
  /// **'Reset Today’s Souls'**
  String get resetToday;

  /// No description provided for @engineDebug.
  ///
  /// In en, this message translates to:
  /// **'Engine debug'**
  String get engineDebug;

  /// No description provided for @blockedUsers.
  ///
  /// In en, this message translates to:
  /// **'Blocked users'**
  String get blockedUsers;

  /// No description provided for @unblock.
  ///
  /// In en, this message translates to:
  /// **'Unblock'**
  String get unblock;

  /// No description provided for @safetyCentre.
  ///
  /// In en, this message translates to:
  /// **'Safety centre'**
  String get safetyCentre;

  /// No description provided for @safety1.
  ///
  /// In en, this message translates to:
  /// **'Meet in a public place the first few times.'**
  String get safety1;

  /// No description provided for @safety2.
  ///
  /// In en, this message translates to:
  /// **'Tell a friend where you’re going and who you’re meeting.'**
  String get safety2;

  /// No description provided for @safety3.
  ///
  /// In en, this message translates to:
  /// **'Keep conversations in NearSoul until you trust someone.'**
  String get safety3;

  /// No description provided for @safety4.
  ///
  /// In en, this message translates to:
  /// **'Never send money or financial details to someone you met online.'**
  String get safety4;

  /// No description provided for @safety5.
  ///
  /// In en, this message translates to:
  /// **'Use Block and Report any time. Reports are confidential.'**
  String get safety5;

  /// No description provided for @emergency.
  ///
  /// In en, this message translates to:
  /// **'In an emergency, call 112.'**
  String get emergency;

  /// No description provided for @about.
  ///
  /// In en, this message translates to:
  /// **'About'**
  String get about;

  /// No description provided for @version.
  ///
  /// In en, this message translates to:
  /// **'Version {v}'**
  String version(String v);

  /// No description provided for @environment.
  ///
  /// In en, this message translates to:
  /// **'Environment: {e}'**
  String environment(String e);

  /// No description provided for @ipipNote.
  ///
  /// In en, this message translates to:
  /// **'Personality items from the International Personality Item Pool (public domain).'**
  String get ipipNote;

  /// No description provided for @logout.
  ///
  /// In en, this message translates to:
  /// **'Sign out'**
  String get logout;

  /// No description provided for @deleteAccount.
  ///
  /// In en, this message translates to:
  /// **'Delete account'**
  String get deleteAccount;

  /// No description provided for @deleteBody.
  ///
  /// In en, this message translates to:
  /// **'Your profile, photos, answers and matches will be deleted. You’ll be signed out and invisible immediately. Some safety records are kept anonymised as required by law.'**
  String get deleteBody;

  /// No description provided for @deleteConfirm.
  ///
  /// In en, this message translates to:
  /// **'Delete my account'**
  String get deleteConfirm;

  /// No description provided for @discoverySetting.
  ///
  /// In en, this message translates to:
  /// **'Show me in Today’s Souls'**
  String get discoverySetting;

  /// No description provided for @hideDistance.
  ///
  /// In en, this message translates to:
  /// **'Hide my distance'**
  String get hideDistance;

  /// No description provided for @readReceipts.
  ///
  /// In en, this message translates to:
  /// **'Read receipts'**
  String get readReceipts;

  /// No description provided for @cardVisibility.
  ///
  /// In en, this message translates to:
  /// **'Personality card visible to'**
  String get cardVisibility;

  /// No description provided for @shareLevel.
  ///
  /// In en, this message translates to:
  /// **'Report sharing level'**
  String get shareLevel;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @testVersion.
  ///
  /// In en, this message translates to:
  /// **'TEST'**
  String get testVersion;

  /// No description provided for @sessionExpired.
  ///
  /// In en, this message translates to:
  /// **'Please sign in again.'**
  String get sessionExpired;

  /// No description provided for @photoMin.
  ///
  /// In en, this message translates to:
  /// **'Keep at least 2 photos while you’re discoverable.'**
  String get photoMin;

  /// No description provided for @rateLimited.
  ///
  /// In en, this message translates to:
  /// **'Too many tries. Please wait a moment.'**
  String get rateLimited;

  /// No description provided for @downloadTitle.
  ///
  /// In en, this message translates to:
  /// **'Get NearSoul'**
  String get downloadTitle;

  /// No description provided for @downloadWeb.
  ///
  /// In en, this message translates to:
  /// **'Open in your browser'**
  String get downloadWeb;

  /// No description provided for @downloadWebHint.
  ///
  /// In en, this message translates to:
  /// **'Works on any phone or computer. To install: Chrome/Edge → menu → “Install app”; iPhone Safari → Share → “Add to Home Screen”.'**
  String get downloadWebHint;

  /// No description provided for @downloadAndroid.
  ///
  /// In en, this message translates to:
  /// **'Android app (APK)'**
  String get downloadAndroid;

  /// No description provided for @downloadAndroidHint.
  ///
  /// In en, this message translates to:
  /// **'Download, open the file and allow installs from this source when asked.'**
  String get downloadAndroidHint;

  /// No description provided for @downloadIos.
  ///
  /// In en, this message translates to:
  /// **'iPhone (TestFlight)'**
  String get downloadIos;

  /// No description provided for @downloadDesktop.
  ///
  /// In en, this message translates to:
  /// **'Desktop apps (Windows, macOS, Linux)'**
  String get downloadDesktop;

  /// No description provided for @downloadDesktopHint.
  ///
  /// In en, this message translates to:
  /// **'Test builds are unsigned. On macOS: right-click the app → Open.'**
  String get downloadDesktopHint;

  /// No description provided for @notAvailableYet.
  ///
  /// In en, this message translates to:
  /// **'Not available yet'**
  String get notAvailableYet;

  /// No description provided for @deepIntro.
  ///
  /// In en, this message translates to:
  /// **'4 short parts, about 4 minutes each. Each part unlocks more facets of your personality.'**
  String get deepIntro;

  /// No description provided for @deepPart.
  ///
  /// In en, this message translates to:
  /// **'Part {n} of 4'**
  String deepPart(int n);

  /// No description provided for @deepPartDone.
  ///
  /// In en, this message translates to:
  /// **'Part complete! New facets unlocked.'**
  String get deepPartDone;

  /// No description provided for @deepAllDone.
  ///
  /// In en, this message translates to:
  /// **'All parts done. Your profile now uses all 116 questions.'**
  String get deepAllDone;

  /// No description provided for @facets.
  ///
  /// In en, this message translates to:
  /// **'Facets'**
  String get facets;

  /// No description provided for @soulTalkIntroTitle.
  ///
  /// In en, this message translates to:
  /// **'Get to know yourself'**
  String get soulTalkIntroTitle;

  /// No description provided for @soulTalkIntroBody.
  ///
  /// In en, this message translates to:
  /// **'Short, guided conversations about what you want, what gives you energy and how you connect. Only you can see them.'**
  String get soulTalkIntroBody;

  /// No description provided for @soulNotTherapy.
  ///
  /// In en, this message translates to:
  /// **'This is self-reflection, not therapy.'**
  String get soulNotTherapy;

  /// No description provided for @soulPrivacy.
  ///
  /// In en, this message translates to:
  /// **'Your Soul Talk is private and encrypted. Nobody at NearSoul can read it. Conversations are deleted after 90 days unless you choose to keep them.'**
  String get soulPrivacy;

  /// No description provided for @soulConsentCta.
  ///
  /// In en, this message translates to:
  /// **'I agree, let\'s start'**
  String get soulConsentCta;

  /// No description provided for @soulTopics.
  ///
  /// In en, this message translates to:
  /// **'Topics'**
  String get soulTopics;

  /// No description provided for @soulSuggested.
  ///
  /// In en, this message translates to:
  /// **'Suggested for you'**
  String get soulSuggested;

  /// No description provided for @soulDoneBadge.
  ///
  /// In en, this message translates to:
  /// **'Done'**
  String get soulDoneBadge;

  /// No description provided for @soulResume.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get soulResume;

  /// No description provided for @soulEnd.
  ///
  /// In en, this message translates to:
  /// **'End session'**
  String get soulEnd;

  /// No description provided for @soulThinking.
  ///
  /// In en, this message translates to:
  /// **'Thinking…'**
  String get soulThinking;

  /// No description provided for @soulRetry.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Tap to try again.'**
  String get soulRetry;

  /// No description provided for @soulWrapTitle.
  ///
  /// In en, this message translates to:
  /// **'What you discovered today'**
  String get soulWrapTitle;

  /// No description provided for @soulKeep.
  ///
  /// In en, this message translates to:
  /// **'Keep'**
  String get soulKeep;

  /// No description provided for @soulDiscard.
  ///
  /// In en, this message translates to:
  /// **'Discard'**
  String get soulDiscard;

  /// No description provided for @soulBasedOn.
  ///
  /// In en, this message translates to:
  /// **'Based on what you said: {evidence}'**
  String soulBasedOn(String evidence);

  /// No description provided for @soulVisPrivate.
  ///
  /// In en, this message translates to:
  /// **'Only me'**
  String get soulVisPrivate;

  /// No description provided for @soulVisMatching.
  ///
  /// In en, this message translates to:
  /// **'Use for matching'**
  String get soulVisMatching;

  /// No description provided for @soulVisCard.
  ///
  /// In en, this message translates to:
  /// **'Show on my card'**
  String get soulVisCard;

  /// No description provided for @soulQuestion.
  ///
  /// In en, this message translates to:
  /// **'A question to sit with'**
  String get soulQuestion;

  /// No description provided for @soulMap.
  ///
  /// In en, this message translates to:
  /// **'Soul Map'**
  String get soulMap;

  /// No description provided for @soulMapEmpty.
  ///
  /// In en, this message translates to:
  /// **'Your map grows with every Soul Talk.'**
  String get soulMapEmpty;

  /// No description provided for @soulKeepConversations.
  ///
  /// In en, this message translates to:
  /// **'Keep my conversations'**
  String get soulKeepConversations;

  /// No description provided for @soulDeleteAll.
  ///
  /// In en, this message translates to:
  /// **'Delete all Soul Talk data'**
  String get soulDeleteAll;

  /// No description provided for @soulDeleteAllConfirm.
  ///
  /// In en, this message translates to:
  /// **'Delete all your Soul Talk conversations and insights? This can\'t be undone.'**
  String get soulDeleteAllConfirm;

  /// No description provided for @soulSafetyContinue.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get soulSafetyContinue;

  /// No description provided for @soulSafetyEnd.
  ///
  /// In en, this message translates to:
  /// **'End session'**
  String get soulSafetyEnd;

  /// No description provided for @soulTooShort.
  ///
  /// In en, this message translates to:
  /// **'This conversation was too short for insights. That\'s okay.'**
  String get soulTooShort;

  /// No description provided for @soulAffectsMatching.
  ///
  /// In en, this message translates to:
  /// **'Can improve your matches'**
  String get soulAffectsMatching;

  /// No description provided for @catValue.
  ///
  /// In en, this message translates to:
  /// **'Values'**
  String get catValue;

  /// No description provided for @catNeed.
  ///
  /// In en, this message translates to:
  /// **'Needs'**
  String get catNeed;

  /// No description provided for @catPattern.
  ///
  /// In en, this message translates to:
  /// **'Patterns'**
  String get catPattern;

  /// No description provided for @catStrength.
  ///
  /// In en, this message translates to:
  /// **'Strengths'**
  String get catStrength;

  /// No description provided for @catPreference.
  ///
  /// In en, this message translates to:
  /// **'Preferences'**
  String get catPreference;

  /// No description provided for @catGrowth.
  ///
  /// In en, this message translates to:
  /// **'Growth'**
  String get catGrowth;

  /// No description provided for @exportData.
  ///
  /// In en, this message translates to:
  /// **'Download my data'**
  String get exportData;

  /// No description provided for @exportRequested.
  ///
  /// In en, this message translates to:
  /// **'We\'re preparing your data. You\'ll get an email with a download link.'**
  String get exportRequested;

  /// No description provided for @exportReady.
  ///
  /// In en, this message translates to:
  /// **'Your data is ready'**
  String get exportReady;

  /// No description provided for @exportPending.
  ///
  /// In en, this message translates to:
  /// **'Preparing your data…'**
  String get exportPending;

  /// No description provided for @paywallTitle.
  ///
  /// In en, this message translates to:
  /// **'Understand yourself and your matches deeply'**
  String get paywallTitle;

  /// No description provided for @paywallB1.
  ///
  /// In en, this message translates to:
  /// **'Full self report with all facets'**
  String get paywallB1;

  /// No description provided for @paywallB2.
  ///
  /// In en, this message translates to:
  /// **'Full \"You two\" report for every match'**
  String get paywallB2;

  /// No description provided for @paywallB3.
  ///
  /// In en, this message translates to:
  /// **'Unlimited Soul Talk'**
  String get paywallB3;

  /// No description provided for @paywallMonthly.
  ///
  /// In en, this message translates to:
  /// **'€7.99 / month'**
  String get paywallMonthly;

  /// No description provided for @paywallYearly.
  ///
  /// In en, this message translates to:
  /// **'€39.99 / year'**
  String get paywallYearly;

  /// No description provided for @paywallRenewal.
  ///
  /// In en, this message translates to:
  /// **'Renews automatically until cancelled. Cancel anytime in your store settings.'**
  String get paywallRenewal;

  /// No description provided for @paywallRestore.
  ///
  /// In en, this message translates to:
  /// **'Restore purchases'**
  String get paywallRestore;

  /// No description provided for @paywallSoon.
  ///
  /// In en, this message translates to:
  /// **'Purchases open after the beta.'**
  String get paywallSoon;

  /// No description provided for @soulPlus.
  ///
  /// In en, this message translates to:
  /// **'Soul+'**
  String get soulPlus;

  /// No description provided for @soulPlusActive.
  ///
  /// In en, this message translates to:
  /// **'Active until {date}'**
  String soulPlusActive(String date);

  /// No description provided for @soulPlusInactive.
  ///
  /// In en, this message translates to:
  /// **'Not active'**
  String get soulPlusInactive;

  /// No description provided for @pushNotifications.
  ///
  /// In en, this message translates to:
  /// **'Push notifications'**
  String get pushNotifications;

  /// No description provided for @pushOnHint.
  ///
  /// In en, this message translates to:
  /// **'On for this browser. Texts never show names or messages.'**
  String get pushOnHint;

  /// No description provided for @pushOffHint.
  ///
  /// In en, this message translates to:
  /// **'Get notified about matches and new messages.'**
  String get pushOffHint;

  /// No description provided for @pushBlocked.
  ///
  /// In en, this message translates to:
  /// **'Blocked in browser settings. Allow notifications for this site to turn them on.'**
  String get pushBlocked;

  /// No description provided for @pushUnsupported.
  ///
  /// In en, this message translates to:
  /// **'Not available here. On iPhone, add NearSoul to the Home Screen first.'**
  String get pushUnsupported;

  /// No description provided for @pushEnabled.
  ///
  /// In en, this message translates to:
  /// **'Notifications are on'**
  String get pushEnabled;

  /// No description provided for @notifyTypes.
  ///
  /// In en, this message translates to:
  /// **'What to notify me about'**
  String get notifyTypes;

  /// No description provided for @notifyNewMatch.
  ///
  /// In en, this message translates to:
  /// **'New matches'**
  String get notifyNewMatch;

  /// No description provided for @notifyNewMessage.
  ///
  /// In en, this message translates to:
  /// **'New messages'**
  String get notifyNewMessage;

  /// No description provided for @notifyDailySet.
  ///
  /// In en, this message translates to:
  /// **'Today’s Souls are ready (12:00)'**
  String get notifyDailySet;

  /// No description provided for @notifyNearby.
  ///
  /// In en, this message translates to:
  /// **'Someone compatible nearby'**
  String get notifyNearby;

  /// No description provided for @notifyOpenEnding.
  ///
  /// In en, this message translates to:
  /// **'Open to meet is ending'**
  String get notifyOpenEnding;

  /// No description provided for @notifyReport.
  ///
  /// In en, this message translates to:
  /// **'Updates on my reports'**
  String get notifyReport;

  /// No description provided for @notifyRulesNote.
  ///
  /// In en, this message translates to:
  /// **'Quiet from 23:00 to 08:00, except messages. At most one reminder a day. Everything still appears in the bell.'**
  String get notifyRulesNote;

  /// No description provided for @testCodeBanner.
  ///
  /// In en, this message translates to:
  /// **'Test version: no emails are sent. Your code is {code}.'**
  String testCodeBanner(String code);

  /// No description provided for @scaleLean.
  ///
  /// In en, this message translates to:
  /// **'More like: {side}'**
  String scaleLean(String side);

  /// No description provided for @scaleMiddle.
  ///
  /// In en, this message translates to:
  /// **'In between'**
  String get scaleMiddle;

  /// No description provided for @appearance.
  ///
  /// In en, this message translates to:
  /// **'Appearance'**
  String get appearance;

  /// No description provided for @themeSystem.
  ///
  /// In en, this message translates to:
  /// **'System'**
  String get themeSystem;

  /// No description provided for @themeLight.
  ///
  /// In en, this message translates to:
  /// **'Light'**
  String get themeLight;

  /// No description provided for @themeDark.
  ///
  /// In en, this message translates to:
  /// **'Dark'**
  String get themeDark;

  /// No description provided for @paletteNeutral.
  ///
  /// In en, this message translates to:
  /// **'Neutral'**
  String get paletteNeutral;

  /// No description provided for @paletteSage.
  ///
  /// In en, this message translates to:
  /// **'Sage'**
  String get paletteSage;

  /// No description provided for @paletteSand.
  ///
  /// In en, this message translates to:
  /// **'Sand'**
  String get paletteSand;

  /// No description provided for @paletteCoral.
  ///
  /// In en, this message translates to:
  /// **'Coral'**
  String get paletteCoral;

  /// No description provided for @profiles.
  ///
  /// In en, this message translates to:
  /// **'My profiles'**
  String get profiles;

  /// No description provided for @profilesHint.
  ///
  /// In en, this message translates to:
  /// **'Each profile is separate: its own questions, photos, matches and chats. Your age is the same in all of them, and your profiles never see each other.'**
  String get profilesHint;

  /// No description provided for @profileOwner.
  ///
  /// In en, this message translates to:
  /// **'Main profile'**
  String get profileOwner;

  /// No description provided for @profileCurrent.
  ///
  /// In en, this message translates to:
  /// **'Current'**
  String get profileCurrent;

  /// No description provided for @profileSwitch.
  ///
  /// In en, this message translates to:
  /// **'Switch'**
  String get profileSwitch;

  /// No description provided for @profileAdd.
  ///
  /// In en, this message translates to:
  /// **'Add a profile'**
  String get profileAdd;

  /// No description provided for @profileLabel.
  ///
  /// In en, this message translates to:
  /// **'Name for yourself (only you see it)'**
  String get profileLabel;

  /// No description provided for @profileRename.
  ///
  /// In en, this message translates to:
  /// **'Rename'**
  String get profileRename;

  /// No description provided for @profileNew.
  ///
  /// In en, this message translates to:
  /// **'New profile'**
  String get profileNew;

  /// No description provided for @profileUnfinished.
  ///
  /// In en, this message translates to:
  /// **'Not finished yet'**
  String get profileUnfinished;

  /// No description provided for @profileMax.
  ///
  /// In en, this message translates to:
  /// **'You have the maximum of {max} profiles.'**
  String profileMax(int max);

  /// No description provided for @todayNeedsAnswers.
  ///
  /// In en, this message translates to:
  /// **'You skipped most of the questions, so we have nothing to match you on yet. Answer them and your Today’s Souls will fill up.'**
  String get todayNeedsAnswers;

  /// No description provided for @answerQuestions.
  ///
  /// In en, this message translates to:
  /// **'Answer the questions'**
  String get answerQuestions;

  /// No description provided for @subscription.
  ///
  /// In en, this message translates to:
  /// **'Subscription'**
  String get subscription;

  /// No description provided for @tierFree.
  ///
  /// In en, this message translates to:
  /// **'Free'**
  String get tierFree;

  /// No description provided for @tierPlus.
  ///
  /// In en, this message translates to:
  /// **'Soul+'**
  String get tierPlus;

  /// No description provided for @tierGold.
  ///
  /// In en, this message translates to:
  /// **'Gold'**
  String get tierGold;

  /// No description provided for @tierVip.
  ///
  /// In en, this message translates to:
  /// **'VIP'**
  String get tierVip;

  /// No description provided for @tierCurrent.
  ///
  /// In en, this message translates to:
  /// **'Your level'**
  String get tierCurrent;

  /// No description provided for @featDaily.
  ///
  /// In en, this message translates to:
  /// **'Today’s Souls: {count} a day'**
  String featDaily(int count);

  /// No description provided for @featDailyUnlimited.
  ///
  /// In en, this message translates to:
  /// **'Today’s Souls: no daily limit'**
  String get featDailyUnlimited;

  /// No description provided for @featReports.
  ///
  /// In en, this message translates to:
  /// **'Full self and pair reports'**
  String get featReports;

  /// No description provided for @featLikes.
  ///
  /// In en, this message translates to:
  /// **'See who liked you and like back'**
  String get featLikes;

  /// No description provided for @featLikesCount.
  ///
  /// In en, this message translates to:
  /// **'See how many people liked you'**
  String get featLikesCount;

  /// No description provided for @featRewind.
  ///
  /// In en, this message translates to:
  /// **'Undo your last pass'**
  String get featRewind;

  /// No description provided for @featPersonas.
  ///
  /// In en, this message translates to:
  /// **'See how many profiles someone has'**
  String get featPersonas;

  /// No description provided for @featLikeLimit.
  ///
  /// In en, this message translates to:
  /// **'Likes: {count} a day'**
  String featLikeLimit(int count);

  /// No description provided for @featLikeUnlimited.
  ///
  /// In en, this message translates to:
  /// **'Likes: no daily limit'**
  String get featLikeUnlimited;

  /// No description provided for @perMonth.
  ///
  /// In en, this message translates to:
  /// **'{price} / month'**
  String perMonth(String price);

  /// No description provided for @activateTest.
  ///
  /// In en, this message translates to:
  /// **'Activate (test, free)'**
  String get activateTest;

  /// No description provided for @backToFree.
  ///
  /// In en, this message translates to:
  /// **'Back to Free'**
  String get backToFree;

  /// No description provided for @testModeNote.
  ///
  /// In en, this message translates to:
  /// **'Test version: levels switch for free, no payment. Real purchases come with the app stores.'**
  String get testModeNote;

  /// No description provided for @storeSoon.
  ///
  /// In en, this message translates to:
  /// **'Purchases open with the app store release.'**
  String get storeSoon;

  /// No description provided for @likedYou.
  ///
  /// In en, this message translates to:
  /// **'Liked you'**
  String get likedYou;

  /// No description provided for @likedYouCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{No new likes yet} =1{1 person liked you} other{{count} people liked you}}'**
  String likedYouCount(int count);

  /// No description provided for @likedYouUpsell.
  ///
  /// In en, this message translates to:
  /// **'See who they are with Gold.'**
  String get likedYouUpsell;

  /// No description provided for @seePlans.
  ///
  /// In en, this message translates to:
  /// **'See levels'**
  String get seePlans;

  /// No description provided for @rewind.
  ///
  /// In en, this message translates to:
  /// **'Undo'**
  String get rewind;

  /// No description provided for @rewindDone.
  ///
  /// In en, this message translates to:
  /// **'Back in your list'**
  String get rewindDone;

  /// No description provided for @personaCountVip.
  ///
  /// In en, this message translates to:
  /// **'Has {count, plural, =1{1 profile} other{{count} profiles}}'**
  String personaCountVip(int count);

  /// No description provided for @moreSoulsUpsell.
  ///
  /// In en, this message translates to:
  /// **'Want more people a day? Gold has 50, VIP has no limit.'**
  String get moreSoulsUpsell;

  /// No description provided for @personasVipNote.
  ///
  /// In en, this message translates to:
  /// **'VIP members can see how many profiles you have, never which ones.'**
  String get personasVipNote;

  /// No description provided for @passed.
  ///
  /// In en, this message translates to:
  /// **'Passed'**
  String get passed;

  /// No description provided for @todayHidden.
  ///
  /// In en, this message translates to:
  /// **'You’re hidden from Today’s Souls, so we can’t show you anyone either: matching works both ways.'**
  String get todayHidden;

  /// No description provided for @showMe.
  ///
  /// In en, this message translates to:
  /// **'Show me'**
  String get showMe;

  /// No description provided for @todayNeedsPhoto.
  ///
  /// In en, this message translates to:
  /// **'Add a photo so people can see you, and you’ll see them too.'**
  String get todayNeedsPhoto;

  /// No description provided for @addPhoto2.
  ///
  /// In en, this message translates to:
  /// **'Add a photo'**
  String get addPhoto2;

  /// No description provided for @viewCards.
  ///
  /// In en, this message translates to:
  /// **'Cards'**
  String get viewCards;

  /// No description provided for @viewList.
  ///
  /// In en, this message translates to:
  /// **'List'**
  String get viewList;

  /// No description provided for @dobLocked.
  ///
  /// In en, this message translates to:
  /// **'Your date of birth can’t be changed later, so please check it.'**
  String get dobLocked;

  /// No description provided for @notNowHint.
  ///
  /// In en, this message translates to:
  /// **'If you hide yourself, we can’t show you anyone either: matching works both ways. You can turn it on in Settings.'**
  String get notNowHint;

  /// No description provided for @swipeHint.
  ///
  /// In en, this message translates to:
  /// **'Swipe right to like, left to pass. Tap the photo to open the profile.'**
  String get swipeHint;

  /// No description provided for @gotIt.
  ///
  /// In en, this message translates to:
  /// **'Got it'**
  String get gotIt;

  /// No description provided for @menuProfile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get menuProfile;

  /// No description provided for @menuAccount.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get menuAccount;

  /// No description provided for @menuHelp.
  ///
  /// In en, this message translates to:
  /// **'Help'**
  String get menuHelp;

  /// No description provided for @menuPhotos.
  ///
  /// In en, this message translates to:
  /// **'Photos'**
  String get menuPhotos;

  /// No description provided for @menuInterests.
  ///
  /// In en, this message translates to:
  /// **'Interests and bio'**
  String get menuInterests;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'ru'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'ru':
      return AppLocalizationsRu();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
