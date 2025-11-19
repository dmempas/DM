# FindMyStuff

A React Native mobile app that connects people who have lost items with those who have found them, making it easy to reunite lost belongings with their rightful owners.

## Features

- **Report Lost Items**: Users can report lost items with details like description, last seen location, and contact info
- **Report Found Items**: Users can report found items with details and location information
- **Intelligent Matching**: Advanced matching algorithm based on location, category, and description similarity
- **In-App Messaging**: Real-time chat system for users to communicate about item returns
- **User Profiles**: User profiles with ratings, history, and preferences
- **Push Notifications**: Instant notifications for matches and messages
- **Map Integration**: Location-based search and item placement

## Tech Stack

### Mobile App
- **React Native**: Cross-platform mobile development
- **TypeScript**: Type-safe development
- **Firebase Authentication**: User authentication
- **Firebase Firestore**: Real-time database
- **Firebase Storage**: Image storage
- **React Navigation**: App navigation
- **Google Maps**: Location services and maps

### Backend
- **Firebase Cloud Functions**: Server-side logic and matching algorithm
- **Firebase Security Rules**: Data access control
- **Firebase Cloud Messaging**: Push notifications

## Getting Started

### Prerequisites
- Node.js 16+
- React Native CLI
- Firebase CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FindMyStuff
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install iOS dependencies (iOS only)**
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Set up Firebase**
   - Create a new Firebase project at https://console.firebase.google.com
   - Enable Authentication, Firestore, Storage, and Cloud Functions
   - Add your app to the Firebase project
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Place them in the root of the project

5. **Configure Firebase Security Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

6. **Deploy Cloud Functions**
   ```bash
   cd functions
   npm install
   firebase deploy --only functions
   cd ..
   ```

7. **Run the app**
   ```bash
   # For Android
   npm run android

   # For iOS
   npm run ios

   # Start Metro bundler
   npm start
   ```

## Project Structure

```
FindMyStuff/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Main app screens
│   │   ├── auth/           # Authentication screens
│   │   ├── main/           # Main app screens (tabs)
│   │   ├── items/          # Item-related screens
│   │   └── messages/       # Messaging screens
│   ├── navigation/         # React Navigation setup
│   ├── services/           # Firebase and API services
│   ├── store/              # State management (Context API)
│   ├── types/              # TypeScript type definitions
│   ├── constants/          # App constants and configurations
│   └── utils/              # Helper functions and utilities
├── functions/              # Firebase Cloud Functions
├── android/                # Android-specific code
├── ios/                    # iOS-specific code
└── docs/                   # Documentation
```

## Database Schema

### Collections

#### Users
- User profiles, preferences, and ratings
- Authentication integration

#### Lost Items
- Reports of lost items with location, description, and photos
- Status tracking (active, resolved, expired)

#### Found Items
- Reports of found items with details and location
- Status tracking (available, claimed, expired)

#### Matches
- Algorithm-generated matches between lost and found items
- Confidence scoring and match factors

#### Messages
- Real-time messaging between users
- Message types: text, images, location sharing

#### Ratings
- User ratings and reviews for completed transactions
- Trust and reputation system

## Matching Algorithm

The matching algorithm uses a weighted scoring system:

- **Location Score (40%)**: Distance-based scoring with geographic relevance
- **Category Score (25%)**: Exact category matching and subcategory relevance
- **Description Score (25%)**: Text similarity and keyword analysis
- **Time Score (10%)**: Temporal proximity of when items were lost/found

## Security & Privacy

- Firebase Security Rules for data access control
- User authentication with email verification
- Encrypted communication channels
- Privacy-focused data handling
- User consent for location sharing

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Build & Deployment

### Development
```bash
# Development build
npm run android:dev  # Android
npm run ios:dev      # iOS
```

### Production
```bash
# Production build
npm run android:release  # Android
npm run ios:release      # iOS
```

### App Store Deployment
- Follow platform-specific guidelines for app submission
- Ensure all Firebase services are properly configured
- Test thoroughly in production environment

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation

## Roadmap

- [ ] Machine learning-based matching improvements
- [ ] Advanced search filters
- [ ] Multi-language support
- [ ] Web dashboard for management
- [ ] Integration with lost and found departments
- [ ] AI-powered image recognition
- [ ] Blockchain-based verification system