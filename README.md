# StyleSavvy

A cross‑platform Flutter app to organize your wardrobe, capture your style profile, and get daily outfit suggestions. Built with Material 3 and a clean beige/white aesthetic.

## Features
- **Onboarding**: Guided steps to choose palette, vibe, body shape, and basic measurements.
- **Wardrobe**: Manage items you have vs. items you want, with quick add and remove.
- **Dashboard**: "Style me today" outfit suggestions filtered by vibe/occasion.
- **Theme**: Material 3 with polished buttons, cards, tabs, and inputs in a beige/white premium style.
- **Platforms**: Mobile (Android/iOS), Web, and Desktop (Windows, macOS, Linux).

## Tech Stack
- **Flutter** (Dart)
- **State management**: Provider (`AppState`)
- **UI**: Material 3 components with custom theming

## Getting Started
1. Install Flutter (stable channel) and set up your toolchains.
2. Fetch dependencies:
   ```sh
   flutter pub get
   ```
3. Run on your preferred device:
   - Windows: `flutter run -d windows`
   - Web (Chrome): `flutter run -d chrome`
   - Android: `flutter run -d <android-device-id>`
   - iOS (macOS only): `flutter run -d <ios-simulator>`

If you’re using VS Code, use "Run and Debug" → Flutter.

## Project Structure (high level)
```
lib/
  main.dart                 # App entry, theme, routes
  models/
    clothing_item.dart
    user_profile.dart
  providers/
    app_state.dart          # Global app state (Provider)
  screens/
    login_screen.dart
    onboarding_screen.dart
    dashboard_screen.dart
    wardrobe_screen.dart
```

## Development
- Analyze and format:
  ```sh
  flutter analyze
  dart format .
  ```
- Run tests:
  ```sh
  flutter test
  ```

## Troubleshooting
- If you see deprecations or analyzer warnings after Flutter upgrades:
  - Run `flutter clean && flutter pub get`.
  - Re-run `flutter analyze` and update APIs as guided by messages.
- If web images don’t load or flicker: the onboarding now uses local gradients (no network images required).

## Roadmap Ideas
- **Image attachments** for wardrobe items
- **Outfit history** and favorites
- **Cloud sync** and multi-device profiles
- **Export/Import** wardrobe data

## Contributing
Pull requests are welcome. Please keep changes focused and include a brief description of the intent.

## License
No license specified yet. If you plan to open-source, consider MIT or Apache-2.0.