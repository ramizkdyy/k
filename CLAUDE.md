# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KiraX is a React Native rental property mobile application built with Expo that connects landlords ("EVSAHIBI") and tenants ("KIRACI"). The app features property listings, user matching, real-time chat via SignalR, and an offer system.

## Development Commands

```bash
# Start development server
npm start
# or
expo start

# Run on specific platforms
npm run android    # Android device/emulator
npm run ios        # iOS device/simulator  
npm run web        # Web browser
```

## Architecture Overview

### Core Technologies
- **React Native with Expo**: Mobile app framework
- **Redux Toolkit**: State management with RTK Query for API calls
- **React Navigation**: Navigation with stack, drawer, and tab navigators
- **NativeWind**: Tailwind CSS for React Native styling
- **SignalR**: Real-time chat functionality
- **Redux Persist**: Persisted state storage using AsyncStorage

### State Management Structure
Redux store organized into slices:
- `authSlice`: Authentication, user roles (EVSAHIBI/KIRACI), token management
- `postSlice`: Property listings and filtering
- `offerSlice`: Rental offers between users
- `profileSlice`: User profiles and preferences
- `expectationSlice`: User preferences and matching criteria
- `apiSlice`: Main RTK Query API endpoints
- `chatApiSlice`: Chat-specific API endpoints

### Navigation Architecture
- **Role-based navigation**: Different tab structures for landlords vs tenants
- **Drawer navigation**: Side menu with animated screen transitions
- **Stack navigators**: Individual feature navigation flows
- **Authentication flow**: Login → Role Selection → Profile Creation → Main App

### Key Components & Screens

#### Authentication Flow
- `LoginScreen` → `RegisterScreen` → `RoleSelectionScreen` → `CreateProfileScreen`

#### Landlord Features
- `HomeScreen`: Dashboard with nearby properties and matching tenants
- `PostsScreen`: Property management (create, edit, view own listings)
- `OffersScreen`: Received rental offers
- `ProfileScreen`: Profile management and expectations

#### Tenant Features  
- `HomeScreen`: Property search and recommendations
- `PostsScreen`: Browse available properties
- `OffersScreen`: Sent rental offers
- `ProfileScreen`: Profile and preferences

#### Shared Features
- `MessagesScreen` + `ChatDetailScreen`: Real-time chat via SignalR
- `UserProfileScreen`: View other users' profiles
- `PostDetailScreen`: Detailed property view

### Real-time Features (SignalR)
- Chat messaging with typing indicators
- Online user status tracking
- Message read receipts
- Automatic reconnection with exponential backoff

### Styling System
- **NativeWind**: Tailwind CSS classes in React Native
- **Global styles**: `global.css` with Tailwind configuration
- **FontAwesome Pro icons**: Comprehensive icon system with different weights

## Important File Locations

- Navigation: `src/navigation/AppNavigator.js`
- Redux setup: `src/redux/store.js` 
- SignalR context: `src/contexts/SignalRContext.js`
- Main app entry: `App.js`
- Styling: `tailwind.config.js`, `global.css`

## Development Notes

- The app uses role-based rendering (`EVSAHIBI` vs `KIRACI`) throughout
- Profile creation is mandatory after authentication
- Real-time features require SignalR backend connection
- All navigation screens are wrapped with authentication and profile checks
- Redux state is persisted except for API cache slices