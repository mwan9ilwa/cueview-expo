# CueView

CueView is a personalized TV show tracking app built with React Native and Expo. Track your watching progress, discover new shows, manage your library, and stay updated on releases.

## Features

### 🎬 Core Features
- **Personal Library Management**: Track shows as "Watching," "Want to Watch," or "Watched"
- **Episode-Level Progress Tracking**: Mark individual episodes as watched
- **Show Discovery**: Browse trending, popular, and top-rated shows
- **Search & Filters**: Find shows by title, genre, or network
- **Detailed Show Information**: View synopses, cast, trailers, and ratings
- **Personal Ratings & Notes**: Rate shows and add private notes

### 📱 Cross-Platform
- iOS and Android support through React Native
- Consistent user experience across devices
- Offline access with local data caching

### 🔔 Smart Notifications
- New episode alerts for tracked shows
- Season premiere reminders
- Custom episode reminders

### 📊 Insights (Coming Soon)
- Watch time statistics
- Genre preferences
- Monthly progress tracking

## Tech Stack

- **Frontend**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore + SQLite (offline)
- **External API**: The Movie Database (TMDb)
- **Notifications**: Expo Notifications

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio & Emulator (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd CueView
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   - Get Firebase config from [Firebase Console](https://console.firebase.google.com/)
   - Get TMDb API key from [TMDb API](https://www.themoviedb.org/settings/api)

4. **Set up Firebase**
   - Create a new Firebase project
   - Enable Authentication (Email/Password, Google, Apple)
   - Create a Firestore database
   - Update `config/firebase.ts` with your Firebase config

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Run on device/simulator**
   ```bash
   npm run ios     # iOS
   npm run android # Android
   npm run web     # Web
   ```

## Project Structure

```
CueView/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home screen
│   │   ├── library.tsx    # My Shows library
│   │   ├── discover.tsx   # Show discovery
│   │   ├── calendar.tsx   # Episode calendar
│   │   └── profile.tsx    # User profile
│   ├── _layout.tsx        # Root layout
│   └── +not-found.tsx     # 404 screen
├── components/            # Reusable UI components
├── config/               # Configuration files
│   └── firebase.ts       # Firebase configuration
├── contexts/             # React contexts
│   └── AppContext.tsx    # Global app state
├── services/             # API and database services
│   ├── auth.ts          # Authentication service
│   ├── database.ts      # Local SQLite database
│   └── tmdb.ts          # TMDb API service
├── types/               # TypeScript type definitions
│   └── index.ts         # App-wide types
├── constants/           # App constants
├── hooks/              # Custom React hooks
└── assets/             # Images, fonts, etc.
```

## Development Phases

### Phase 1: Core Infrastructure ✅
- [x] Project setup with Expo and TypeScript
- [x] Firebase configuration
- [x] TMDb API integration
- [x] Basic navigation structure
- [x] Database services (SQLite + Firestore)
- [x] Authentication service
- [x] Global state management

### Phase 2: Core Features (In Progress)
- [ ] Authentication screens (Sign In, Sign Up, etc.)
- [ ] Home screen with Continue Watching
- [ ] Show discovery and search
- [ ] Show details screen
- [ ] Library management
- [ ] Episode tracking

### Phase 3: Advanced Features
- [ ] Push notifications
- [ ] Offline support
- [ ] Personalized recommendations
- [ ] Calendar view
- [ ] Statistics and insights

### Phase 4: Polish & Launch
- [ ] Testing and bug fixes
- [ ] Performance optimization
- [ ] App store preparation
- [ ] Beta testing

## API Keys Setup

### Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Go to Project Settings > General > Your apps
4. Add your app and copy the config values to `.env`

### TMDb API
1. Create account at [TMDb](https://www.themoviedb.org/)
2. Go to Settings > API
3. Request an API key
4. Add to `.env` as `EXPO_PUBLIC_TMDB_API_KEY`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [The Movie Database (TMDb)](https://www.themoviedb.org/) for show data
- [Expo](https://expo.dev/) for the amazing development platform
- [Firebase](https://firebase.google.com/) for backend services
