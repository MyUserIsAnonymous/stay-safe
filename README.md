# SafeTrack - Location Tracker PWA

A Progressive Web App for safely tracking your loved ones' locations with emergency help functionality.

## Features

- 📍 **Real-time Location Tracking**: Get accurate GPS coordinates
- 🆘 **Emergency Help Button**: One-tap emergency alerts with location sharing
- 📱 **PWA Support**: Install as a native app on your device
- 📱 **Offline Capability**: Works with poor or no internet connection
- 🔔 **Notifications**: Alerts and updates
- 📋 **Location History**: View past locations
- 👥 **Emergency Contacts**: Manage contact list for emergency alerts
- ⚙️ **Customizable Settings**: Adjust tracking frequency and preferences

## How to Use

### Installation
1. Visit the app URL on your mobile device
2. Tap "Install App" or "Add to Home Screen"
3. Grant location permissions when prompted

### Adding Emergency Contacts
1. Tap "Add Contact" in the Emergency Help section
2. Enter name and phone number
3. Save contact

### Using Emergency Help
1. Tap the red HELP button
2. Confirm sending emergency alert
3. Location will be shared via SMS with all emergency contacts

## Privacy & Security

- All location data is stored locally on your device
- No data is sent to external servers (except for address lookup)
- Emergency alerts are sent directly from your device
- You control who receives your location data

## Technical Details

- **Framework**: Pure HTML/CSS/JavaScript
- **PWA Features**: Service Worker, Web App Manifest
- **Storage**: LocalStorage for data persistence
- **APIs Used**: 
  - Geolocation API
  - Web Share API
  - OpenStreetMap Nominatim API (for reverse geocoding)

## Setup for Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/location-tracker-pwa.git
