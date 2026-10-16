import 'package:flutter_test/flutter_test.dart';
import 'package:nearsoul/core/router.dart';
import 'package:nearsoul/core/session.dart';

Me me(String status, Map<String, bool> onboarding) => Me({'id': 'u', 'status': status, 'role': 'user', 'onboarding': onboarding, 'settings': <String, dynamic>{}, 'consents': <String, dynamic>{}});

void main() {
  const done = {'dob': true, 'terms': true, 'quickScan': true, 'cardReviewed': true, 'shareLevel': true, 'basics': true, 'photos': true, 'interests': true};

  test('onboarding steps follow the PRD order', () {
    expect(onboardingRoute(me('onboarding', {})), '/onboarding/dob');
    expect(onboardingRoute(me('onboarding', {'dob': true})), '/onboarding/consents');
    expect(onboardingRoute(me('onboarding', {'dob': true, 'terms': true})), '/onboarding/scan');
    expect(onboardingRoute(me('onboarding', {'dob': true, 'terms': true, 'quickScan': true})), '/onboarding/reveal');
    expect(onboardingRoute(me('onboarding', {...done, 'photos': false})), '/onboarding/photos');
    expect(onboardingRoute(me('onboarding', done)), '/onboarding/discovery');
  });

  test('active users skip onboarding; under-18 users are blocked', () {
    expect(onboardingRoute(me('active', done)), isNull);
    expect(onboardingRoute(me('blocked_underage', {})), '/blocked');
  });
}
