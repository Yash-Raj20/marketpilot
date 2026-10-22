# Flutter mobile starter

The mobile client includes a branded sign-in screen and market dashboard connected to the same REST API used by the web app. It uses `API_BASE_URL` at build time and stores the JWT in SharedPreferences for this starter.

To generate Android/iOS platform folders, install Flutter and run `flutter create .` from this folder, then run `flutter pub get`.

- Android emulator: `flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api`
- iOS simulator: `flutter run --dart-define=API_BASE_URL=http://localhost:4000/api`
- Physical device: use the development machine's LAN IP and allow the API port through the firewall.

For production, use secure token storage, TLS only, app signing, device testing, privacy disclosures and a mobile security review. No broker orders are submitted by this app.
