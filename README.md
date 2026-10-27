# QR Attend — QR-Based Student Attendance (Expo Go + Firebase)

Mobile app built from *Application Gaps and Proposed Features* (Jonard Masong, BSIT 3A).
Expo SDK 58 · React Native · TypeScript · Firebase Auth + Firestore · Dark blue / light blue / sky blue UI.

## 1. Install and open in VS Code
1. Install **Node.js 20+** and **VS Code**. On your phone install **Expo Go** from the store.
2. Unzip this folder, then in VS Code: **File → Open Folder → attendance-app**.
3. Open the terminal (**Terminal → New Terminal**) and run:
   ```
   npm install
   ```

## 2. Connect Firebase (database)
1. Go to https://console.firebase.google.com → **Add project**.
2. **Build → Authentication → Get started → Sign-in method** → enable **Email/Password** and **Google**. Set a support email for Google.
3. **Build → Firestore Database → Create database** (production mode, any region).
4. Firestore → **Rules** tab → delete everything, paste the contents of `firestore.rules` → **Publish**.
5. **Project settings (gear) → General → Your apps → Web (`</>`)** → register an app → copy the `firebaseConfig` values.
6. Paste them into `src/config/firebaseConfig.ts`. Save.
7. Enable the **Google** provider in Firebase Authentication. The web OAuth client ID is configured as `googleWebClientId` in `src/config/firebaseConfig.ts`; add your local and deployed web origins and the app's OAuth redirect URI in **Google Cloud Console → APIs & Services → Credentials**. Add the deployed domain to Firebase **Authentication → Settings → Authorized domains** as well.
8. For Android Google sign-in, configure an Android OAuth client in **Google Cloud Console → APIs & Services → Credentials** with package `com.qrattend.app` and the Android signing certificate SHA-1. The app uses `@react-native-google-signin/google-signin` with the web OAuth client ID as `webClientId` and `offlineAccess: true`; keep that web client ID in `googleWebClientId` in `src/config/firebaseConfig.ts`. After adding or changing native dependencies, rebuild and reinstall the development build. This native sign-in flow is unavailable in Expo Go.
9. For iOS Google sign-in, create an iOS OAuth client and set `googleIosClientId` in `src/config/firebaseConfig.ts`. Native Google OAuth requires a development build or production app; it is unavailable in Expo Go.
10. The login screen's **Forgot password?** action sends the reset email through Firebase. Configure the reset email template under Firebase **Authentication → Templates** if you want to customize it.

## 3. Run
```
npx expo start
```
Scan the QR in the terminal with **Expo Go** (Android) or the **Camera app** (iPhone). The phone and computer should share the same Wi-Fi network. If the phone shows **“host unreachable”** or cannot load the project, stop the server and run:
```
npm run start:tunnel
```
Scan the new QR code. Tunnel mode avoids direct Wi-Fi/LAN access (which can be blocked by a router, VPN, or computer firewall), but requires internet access. Your Expo Go app must support SDK 58 (update it from the store).

Sign-in is enabled by default. Create an account as a student or teacher, or log in with an existing Firebase Authentication account. Registration validates email format, passwords of at least six characters, matching confirmation, and a five-digit student number. The login screen supports password-reset emails and Google sign-in; Google registration is also available from the registration screen. Firebase Auth persists sessions across app launches (AsyncStorage on native and browser persistence on web). For a temporary student UI preview without signing in, set `DEMO_MODE` to `true` in `src/config/appConfig.ts`; demo mode uses a local sample profile and does not write attendance or join classes in Firebase.

## 4. Try it (needs 2 phones, or 1 phone + Expo web/emulator)
1. Phone A: **Sign up as Teacher** → *New class* → note the class code.
2. Phone B: **Sign up as Student** → *Classes* tab → enter the code.
3. Teacher: open the class → **Start class session** → QR appears and refreshes every 30 s.
4. Student: **Scan** tab (opens first) → scan. Marked Present, or Late after the cut-off.
5. Teacher: **End session** → unscanned students become Absent and get an alert (Alerts tab).

## Features ↔ gaps (from the document)
| Gap | Feature | Where |
|---|---|---|
| 1 Check-in not faster | One-Scan QR Check-In | Student → Scan tab; user stays logged in |
| 2 Proxy attendance | Refreshing QR + personal login | Teacher → Live session (30 s token); token is unreadable by students and enforced by `firestore.rules`; one record per student per session |
| 3 Only present/absent | Present / Late / Absent / Excused | Late cut-off per class (auto-Late); teacher taps a student to set Excused etc. |
| 4 Slow, error-prone records | Automatic records + summary dashboard | Teacher → class dashboard (counts, % per student); Student → My Records |
| 5 No absence reporting | Absence Alert | Alerts tab; warning when absences reach the class limit (default 3) |

Attendance % = (Present + Late) ÷ (Present + Late + Absent). Excused is not counted against the student.

## Notes
- Out of scope by design (Part IV of the document): facial recognition, offline sync, online/hybrid mode, school-system integration. Optional email alerts are not included; alerts are in-app.
- The proxy protection tolerates the current and previous code (up to ~60 s) so slow scans still work.
- Anyone can choose "Teacher" when signing up (fine for a class project; restrict it before real use).

## Troubleshooting
- **`permission-denied`**: rules not published (step 2.4) or the wrong Firebase project in the config.
- **Blank "Connect Firebase" screen**: config still has `YOUR_...` placeholders.
- **Camera black**: allow camera permission for Expo Go.
- **Expo Go says “host unreachable”**: stop Expo, run `npm run start:tunnel`, and scan the newly displayed QR code. Make sure the phone has internet access and is not using a VPN that blocks the tunnel. This applies when loading the app from Expo's development server; it does not repair a standalone build's connection to Firebase.
