# Mobile App - Study Pro Global

This folder contains the mobile application for both Android and iOS platforms.

## Overview

The Study Pro Global mobile app provides students with on-the-go access to the EdTech portal for university applications, scholarship searches, and application tracking.

## Recommended Tech Stack

### Option 1: React Native (Recommended)
```
Mobile/
├── src/
│   ├── screens/        # App screens
│   ├── components/     # Reusable components
│   ├── navigation/     # Navigation setup
│   ├── services/       # API services
│   ├── store/          # State management (Redux/Context)
│   ├── hooks/          # Custom hooks
│   ├── utils/          # Helper functions
│   └── assets/         # Images, fonts, etc.
├── android/            # Android native code
├── ios/                # iOS native code
├── package.json
└── app.json
```

### Option 2: Flutter
```
Mobile/
├── lib/
│   ├── screens/        # App screens
│   ├── widgets/        # Reusable widgets
│   ├── models/         # Data models
│   ├── services/       # API services
│   ├── providers/      # State management
│   └── utils/          # Helper functions
├── android/            # Android configuration
├── ios/                # iOS configuration
├── pubspec.yaml
└── README.md
```

## Key Features

### 1. Authentication
- User registration
- Login with email/password
- Social login (Google, Facebook)
- Biometric authentication (fingerprint, Face ID)
- Secure token storage

### 2. User Profile
- Profile management
- Document upload (camera + gallery)
- Progress tracking
- Subscription status

### 3. University Search
- Advanced search and filters
- University profiles
- Program details
- Save favorites
- Compare universities

### 4. Application Management
- Submit applications
- Track application status
- Upload documents
- Receive notifications
- Application history

### 5. Scholarships
- Browse scholarships
- Filter by country/level
- Auto-match (premium)
- Application deadlines
- Bookmark scholarships

### 6. Payments
- Subscription purchase
- **$myxn Token payment integration** (Cryptocurrency)
- Credit card payments (Visa, Mastercard, American Express)
- Payment history
- Invoice downloads

### 7. AI Chat Support
- 24/7 AI assistant
- Chat history
- Quick replies
- Premium human support

### 8. Courses
- Browse free resources
- Paid course catalog
- Course enrollment
- Progress tracking
- Download materials (offline)

### 9. Notifications
- Push notifications
- In-app notifications
- Email notifications
- Application updates
- Deadline reminders

### 10. Settings
- Language selection (English, Bengali)
- Theme (Light/Dark mode)
- Notification preferences
- Privacy settings
- Help & Support

## Screen Structure

### Authentication Flow
- Splash Screen
- Onboarding
- Login
- Register
- Forgot Password

### Main App Flow
- Home/Dashboard
- Universities
  - Search
  - University Details
  - Program Details
  - Compare
- Applications
  - My Applications
  - New Application
  - Application Details
  - Document Upload
- Scholarships
  - Browse
  - Scholarship Details
  - My Scholarships
- Courses
  - Free Resources
  - Paid Courses
  - My Courses
  - Course Player
- Profile
  - View Profile
  - Edit Profile
  - Subscription
  - Documents
  - Settings
- Chat
  - AI Chat
  - Support Tickets

## Tech Requirements

### React Native
- React Native 0.72+
- Node.js 18+
- Xcode 14+ (for iOS)
- Android Studio (for Android)
- CocoaPods (for iOS dependencies)

### Flutter
- Flutter 3.10+
- Dart 3.0+
- Xcode 14+ (for iOS)
- Android Studio (for Android)

## Getting Started

### React Native

#### Installation
```bash
npm install
# or
yarn install

# iOS only
cd ios && pod install && cd ..
```

#### Running the App
```bash
# iOS
npm run ios
# or
yarn ios

# Android
npm run android
# or
yarn android
```

### Flutter

#### Installation
```bash
flutter pub get
```

#### Running the App
```bash
# iOS
flutter run -d ios

# Android
flutter run -d android
```

## Key Dependencies

### React Native
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-native": "^0.72.0",
    "react-navigation": "^6.0.0",
    "@react-navigation/native": "^6.0.0",
    "@react-navigation/stack": "^6.0.0",
    "react-native-vector-icons": "^10.0.0",
    "axios": "^1.4.0",
    "react-native-async-storage": "^1.19.0",
    "@react-native-firebase/app": "^18.0.0",
    "@react-native-firebase/messaging": "^18.0.0",
    "react-native-image-picker": "^5.0.0",
    "react-native-document-picker": "^9.0.0",
    "react-native-biometrics": "^3.0.0",
    "react-native-web3": "^1.0.0"
  }
}
```

### Flutter
```yaml
dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.2
  http: ^1.0.0
  provider: ^6.0.0
  shared_preferences: ^2.2.0
  firebase_core: ^2.15.0
  firebase_messaging: ^14.6.5
  image_picker: ^1.0.0
  file_picker: ^5.3.0
  local_auth: ^2.1.6
  web3dart: ^2.7.0
```

## API Integration

Connect to the Backend API (see `../API` folder):

```javascript
// React Native Example
import axios from 'axios';

const API_BASE_URL = 'https://api.studyproglobal.com/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

## Payment Integration

### $myxn Token Payment
```javascript
// Integration with myxenpay-dapp
import { MyXenPay } from '@myxen/payment-sdk';

const initiatePayment = async (amount, subscriptionId) => {
  try {
    const payment = await MyXenPay.createPayment({
      amount,
      currency: 'MYXN',
      reference: subscriptionId,
      callbackUrl: 'studypro://payment-success',
    });
    
    // Open payment gateway
    Linking.openURL(payment.paymentUrl);
  } catch (error) {
    console.error('Payment error:', error);
  }
};
```

## Push Notifications

```javascript
// Firebase Cloud Messaging setup
import messaging from '@react-native-firebase/messaging';

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    getFCMToken();
  }
}

async function getFCMToken() {
  const fcmToken = await messaging().getToken();
  // Send token to backend
  await apiClient.post('/users/fcm-token', { token: fcmToken });
}
```

## Build & Release

### Android
```bash
# Generate release APK
cd android && ./gradlew assembleRelease

# Generate AAB for Play Store
cd android && ./gradlew bundleRelease
```

### iOS
```bash
# Archive for App Store
# Use Xcode -> Product -> Archive
# Or use fastlane
fastlane ios release
```

## App Store Requirements

### Android (Google Play Store)
- Target SDK: Android 13 (API 33)+
- Min SDK: Android 8.0 (API 26)+
- Privacy Policy URL required
- App content rating
- Screenshots (phone & tablet)

### iOS (Apple App Store)
- iOS 13.0+
- Privacy Policy
- App Privacy details
- Screenshots (iPhone & iPad)
- App Store Connect submission

## Testing

```bash
# React Native
npm test
# or
yarn test

# Flutter
flutter test
```

## Performance Optimization

- Use FlatList/SectionList for long lists
- Implement pagination
- Image optimization and caching
- Code splitting
- Reduce bundle size
- Optimize re-renders

## Security

- Secure storage for tokens
- Certificate pinning for API
- Code obfuscation
- ProGuard (Android)
- App Transport Security (iOS)
- Biometric authentication
- Jailbreak/Root detection

## Deployment

### Beta Testing
- TestFlight (iOS)
- Google Play Internal Testing (Android)
- Firebase App Distribution

### Production
- App Store Connect (iOS)
- Google Play Console (Android)

## Support

For mobile app development support:
- Email: mobile-dev@studyproglobal.com
- Slack: #mobile-team
