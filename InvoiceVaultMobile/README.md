# InvoiceVault Mobile App

A React Native mobile application for InvoiceVault - Professional Invoice Management & Task Tracking.

## Features

- 📱 **Native Mobile Experience** - Built with React Native for iOS and Android
- 🎨 **Modern UI/UX** - Beautiful, intuitive interface with smooth animations
- 📊 **Dashboard Overview** - Real-time statistics and quick actions
- 📄 **Invoice Management** - Create, view, and manage invoices
- 👥 **Customer Database** - Store and manage customer information
- ✅ **Task Tracking** - Kanban-style task management
- ⚙️ **Settings & Preferences** - Customizable app settings
- 🔐 **Authentication** - Secure login and signup system

## Screenshots

The app includes the following screens:
- **Home Screen** - Welcome screen with app introduction
- **Login/Signup** - Authentication screens
- **Dashboard** - Overview with statistics and quick actions
- **Invoices** - Invoice listing and management
- **Customers** - Customer database
- **Tasks** - Kanban board for task management
- **Settings** - App preferences and account settings

## Tech Stack

- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and tools
- **React Navigation** - Navigation between screens
- **Expo Vector Icons** - Icon library
- **Expo Linear Gradient** - Beautiful gradients
- **Supabase** - Backend and authentication (to be integrated)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd InvoiceVaultMobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run eject` - Eject from Expo managed workflow

## Project Structure

```
src/
├── screens/          # Screen components
│   ├── HomeScreen.js
│   ├── LoginScreen.js
│   ├── SignupScreen.js
│   ├── OverviewScreen.js
│   ├── InvoicesScreen.js
│   ├── CustomersScreen.js
│   ├── TasksScreen.js
│   └── SettingsScreen.js
├── components/       # Reusable components
├── utils/           # Utility functions
└── navigation/      # Navigation configuration
```

## Features in Detail

### 1. Authentication
- Login with email/password
- Sign up for new accounts
- Form validation
- Secure password handling

### 2. Dashboard
- Business statistics overview
- Quick action buttons
- Recent activity feed
- Responsive design

### 3. Invoice Management
- List all invoices
- Invoice status tracking
- Customer information
- Amount and date display

### 4. Customer Management
- Customer database
- Contact information
- Avatar display
- Easy navigation

### 5. Task Management
- Kanban board layout
- Task status tracking
- Priority indicators
- Drag and drop (planned)

### 6. Settings
- User preferences
- Notification settings
- Theme options
- Account management

## Integration with Web App

This mobile app is designed to work with the existing InvoiceVault web application:

- **Shared Backend** - Uses the same Supabase backend
- **Consistent UI** - Matches the web app's design language
- **Data Sync** - Real-time data synchronization
- **Cross-platform** - Seamless experience across devices

## Development Roadmap

### Phase 1 (Current)
- ✅ Basic navigation structure
- ✅ Authentication screens
- ✅ Dashboard overview
- ✅ Core screens implementation

### Phase 2 (Next)
- 🔄 Supabase integration
- 🔄 Real data fetching
- 🔄 Offline support
- 🔄 Push notifications

### Phase 3 (Future)
- 📋 Advanced features
- 📋 Performance optimization
- 📋 App store deployment
- 📋 Analytics integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**InvoiceVault Mobile** - Professional invoice management in your pocket! 📱