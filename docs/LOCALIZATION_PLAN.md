# Localization Plan

## Current reality

Localization is not yet complete. The app should not present itself as fully translated while core page content remains English.

## Required behavior

- Centralize UI strings into translation keys.
- English must be complete.
- Uzbek must cover core flows: landing, login/signup, onboarding, dashboard labels, skill tree labels, practice labels, labs labels, pilot form labels, errors, and feedback form.
- Russian should be either complete or visibly marked partial/beta.
- Missing keys must fall back to English and be reported in development/test logs.

## Test requirements

- Language switch does not crash.
- Core pages render in English and Uzbek.
- Missing translation keys are reported.
- Partial languages display an explicit beta/incomplete label.
