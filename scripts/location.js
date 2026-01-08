class LocationTracker {
    constructor() {
        this.currentLocation = null;
        this.locationHistory = [];
        this.watchId = null;
        this.updateInterval = 60000; // 1 minute default
        this.isTracking = false;
        this.geocoder = null;
        
        this.initialize();
    }
    
    initialize() {
        // Check if browser supports geolocation
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by your browser');
            return;
        }
        
        this.geocoder = new google.maps.Geocoder();
        this.loadSettings();
        this.loadHistory();
    }
    
    startTracking() {
        if (this.isTracking) return;
        
        // Get initial location
        this.getCurrentLocation();
        
        // Set up periodic updates
        this.watchId = setInterval(() => {
            this.getCurrentLocation();
        }, this.updateInterval);
        
        this.isTracking = true;
        this.updateStatus(true);
    }
    
    stopTracking() {
        if (this.watchId) {
            clearInterval(this.watchId);
            this.watchId = null;
        }
        this.isTracking = false;
        this.updateStatus(false);
    }
    
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.handleLocationSuccess(position);
                    resolve(position);
                },
                (error) => {
                    this.handleLocationError(error);
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }
    
    handleLocationSuccess(position) {
        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp)
        };
        
        this.currentLocation = location;
        this.saveToHistory(location);
        this.updateUI(location);
        this.updateTimestamp();
        
        // Get address from coordinates
        this.reverseGeocode(location.latitude, location.longitude);
    }
    
    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            
            if (data && data.display_name) {
                const address = data.display_name.split(',').slice(0, 3).join(',');
                document.getElementById('address').textContent = address;
                
                // Update share message
                const shareMessage = `My current location is: ${address} (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
                document.getElementById('locationMessage').value = shareMessage;
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
        }
    }
    
    handleLocationError(error) {
        let message = '';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = 'Location permission denied. Please enable location services.';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Location information is unavailable.';
                break;
            case error.TIMEOUT:
                message = 'Location request timed out.';
                break;
            default:
                message = 'An unknown error occurred.';
                break;
        }
        
        this.showError(message);
    }
    
    updateUI(location) {
        const coordsElement = document.getElementById('coordinates');
        coordsElement.textContent = `Lat: ${location.latitude.toFixed(6)} Lon: ${location.longitude.toFixed(6)}`;
        coordsElement.innerHTML += ` <span style="color: var(--success-color);">(±${Math.round(location.accuracy)}m)</span>`;
    }
    
    updateTimestamp() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        document.getElementById('lastUpdate').textContent = timeString;
    }
    
    updateStatus(isActive) {
        const statusCircle = document.querySelector('.status-circle');
        const statusText = document.querySelector('.status-indicator span');
        
        if (isActive) {
            statusCircle.style.backgroundColor = 'var(--success-color)';
            statusCircle.style.animation = 'pulse 2s infinite';
            statusText.textContent = 'Live Tracking Active';
        } else {
            statusCircle.style.backgroundColor = 'var(--gray-color)';
            statusCircle.style.animation = 'none';
            statusText.textContent = 'Tracking Paused';
        }
    }
    
    saveToHistory(location) {
        // Keep last 10 locations
        this.locationHistory.unshift(location);
        if (this.locationHistory.length > 10) {
            this.locationHistory.pop();
        }
        
        this.saveHistory();
        this.updateHistoryUI();
    }
    
    updateHistoryUI() {
        const historyList = document.getElementById('locationHistory');
        historyList.innerHTML = '';
        
        this.locationHistory.forEach((loc, index) => {
            const time = loc.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <div>
                    <strong>${time}</strong>
                    <div style="font-size: 0.9rem; color: var(--gray-color);">
                        ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}
                    </div>
                </div>
                <div style="color: var(--success-color); font-weight: bold;">
                    ±${Math.round(loc.accuracy)}m
                </div>
            `;
            historyList.appendChild(item);
        });
    }
    
    getLocationForSharing() {
        if (!this.currentLocation) return null;
        
        const mapsUrl = `https://www.google.com/maps?q=${this.currentLocation.latitude},${this.currentLocation.longitude}`;
        return {
            coordinates: this.currentLocation,
            mapsUrl: mapsUrl,
            message: document.getElementById('locationMessage').value
        };
    }
    
    async sendEmergencyAlert() {
        if (!this.currentLocation) {
            await this.getCurrentLocation();
        }
        
        const locationData = this.getLocationForSharing();
        const message = `🚨 EMERGENCY ALERT 🚨\nI need help!\nMy location: ${locationData.mapsUrl}`;
        
        // Try to send SMS via Web Share API
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Emergency Alert',
                    text: message,
                    url: locationData.mapsUrl
                });
                this.showNotification('Emergency alert sent!', 'success');
            } catch (error) {
                this.fallbackSMS(message);
            }
        } else {
            this.fallbackSMS(message);
        }
        
        // Also save this as an emergency log
        this.saveEmergencyLog(locationData);
    }
    
    fallbackSMS(message) {
        const phoneNumbers = this.getEmergencyContacts();
        const smsUrl = `sms:${phoneNumbers.join(',')}?body=${encodeURIComponent(message)}`;
        window.open(smsUrl, '_blank');
    }
    
    getEmergencyContacts() {
        // Load from localStorage
        const contacts = JSON.parse(localStorage.getItem('emergencyContacts') || '[]');
        return contacts.map(c => c.phone).filter(phone => phone);
    }
    
    saveEmergencyLog(locationData) {
        const emergencyLogs = JSON.parse(localStorage.getItem('emergencyLogs') || '[]');
        emergencyLogs.push({
            ...locationData,
            timestamp: new Date().toISOString(),
            type: 'emergency'
        });
        localStorage.setItem('emergencyLogs', JSON.stringify(emergencyLogs.slice(-50)));
    }
    
    saveHistory() {
        localStorage.setItem('locationHistory', JSON.stringify(this.locationHistory));
    }
    
    loadHistory() {
        const saved = localStorage.getItem('locationHistory');
        if (saved) {
            this.locationHistory = JSON.parse(saved).map(loc => ({
                ...loc,
                timestamp: new Date(loc.timestamp)
            }));
            this.updateHistoryUI();
        }
    }
    
    saveSettings() {
        const settings = {
            autoUpdate: document.getElementById('autoUpdate').checked,
            updateFrequency: document.getElementById('updateFrequency').value
        };
        localStorage.setItem('trackerSettings', JSON.stringify(settings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('trackerSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            document.getElementById('autoUpdate').checked = settings.autoUpdate;
            document.getElementById('updateFrequency').value = settings.updateFrequency;
            this.updateInterval = parseInt(settings.updateFrequency);
            
            if (settings.autoUpdate) {
                this.startTracking();
            }
        } else {
            this.startTracking();
        }
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--danger-color);
            color: white;
            padding: 15px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(errorDiv);
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : 'var(--primary-color)'};
            color: white;
            padding: 15px 25px;
            border-radius: 12px;
            z-index: 10000;
            animation: slideInUp 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize location tracker
const tracker = new LocationTracker();
