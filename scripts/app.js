document.addEventListener('DOMContentLoaded', function() {
    // Initialize service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateNotification();
                        }
                    });
                });
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    }
    
    // Install PWA prompt
    let deferredPrompt;
    const installBtn = document.getElementById('installBtn');
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'flex';
        
        installBtn.addEventListener('click', () => {
            installBtn.style.display = 'none';
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(choiceResult => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted install');
                }
                deferredPrompt = null;
            });
        });
    });
    
    // Hide install button if app is already installed
    window.addEventListener('appinstalled', () => {
        installBtn.style.display = 'none';
        deferredPrompt = null;
        tracker.showNotification('App installed successfully!', 'success');
    });
    
    // Event Listeners
    document.getElementById('helpBtn').addEventListener('click', () => {
        if (confirm('Send emergency alert to your contacts?')) {
            tracker.sendEmergencyAlert();
            
            // Visual feedback
            const helpBtn = document.getElementById('helpBtn');
            helpBtn.style.backgroundColor = 'var(--warning-color)';
            helpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>SENDING...</span>';
            
            setTimeout(() => {
                helpBtn.style.backgroundColor = 'var(--danger-color)';
                helpBtn.innerHTML = '<div class="pulse-ring"></div><i class="fas fa-sos"></i><span>HELP</span>';
            }, 2000);
        }
    });
    
    document.getElementById('updateLocation').addEventListener('click', () => {
        tracker.getCurrentLocation();
        tracker.showNotification('Location updated!', 'success');
    });
    
    document.getElementById('shareLocation').addEventListener('click', () => {
        const shareModal = document.getElementById('shareModal');
        shareModal.style.display = 'flex';
    });
    
    document.getElementById('copyLocation').addEventListener('click', () => {
        const message = document.getElementById('locationMessage');
        message.select();
        document.execCommand('copy');
        tracker.showNotification('Location copied to clipboard!', 'success');
    });
    
    document.getElementById('sendSMS').addEventListener('click', () => {
        const message = document.getElementById('locationMessage').value;
        const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
        window.open(smsUrl, '_blank');
    });
    
    document.getElementById('addContact').addEventListener('click', () => {
        document.getElementById('addContactModal').style.display = 'flex';
    });
    
    document.getElementById('saveContact').addEventListener('click', saveEmergencyContact);
    document.getElementById('cancelContact').addEventListener('click', () => {
        document.getElementById('addContactModal').style.display = 'none';
    });
    
    // Settings changes
    document.getElementById('autoUpdate').addEventListener('change', handleSettingsChange);
    document.getElementById('updateFrequency').addEventListener('change', handleSettingsChange);
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Initialize emergency contacts display
    loadEmergencyContacts();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        setTimeout(() => {
            Notification.requestPermission();
        }, 2000);
    }
});

function handleSettingsChange() {
    tracker.saveSettings();
    
    if (document.getElementById('autoUpdate').checked) {
        tracker.startTracking();
    } else {
        tracker.stopTracking();
    }
    
    tracker.updateInterval = parseInt(document.getElementById('updateFrequency').value);
}

function saveEmergencyContact() {
    const name = document.getElementById('contactName').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    
    if (!name || !phone) {
        alert('Please enter both name and phone number');
        return;
    }
    
    const contacts = JSON.parse(localStorage.getItem('emergencyContacts') || '[]');
    contacts.push({ name, phone });
    localStorage.setItem('emergencyContacts', JSON.stringify(contacts));
    
    // Clear inputs and close modal
    document.getElementById('contactName').value = '';
    document.getElementById('contactPhone').value = '';
    document.getElementById('addContactModal').style.display = 'none';
    
    // Update UI
    loadEmergencyContacts();
    tracker.showNotification('Contact saved!', 'success');
}

function loadEmergencyContacts() {
    const contacts = JSON.parse(localStorage.getItem('emergencyContacts') || '[]');
    const contactsList = document.querySelector('.contacts-list');
    
    if (contacts.length === 0) {
        contactsList.innerHTML = `
            <div style="text-align: center; color: var(--gray-color); padding: 20px;">
                <i class="fas fa-user-plus" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>No emergency contacts added yet</p>
            </div>
        `;
        return;
    }
    
    contactsList.innerHTML = contacts.map(contact => `
        <div class="contact">
            <i class="fas fa-user"></i>
            <span>${contact.name}: ${contact.phone}</span>
            <button onclick="removeContact('${contact.name}')" style="margin-left: auto; background: none; border: none; color: var(--danger-color); cursor: pointer;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function removeContact(name) {
    if (confirm(`Remove ${name} from emergency contacts?`)) {
        let contacts = JSON.parse(localStorage.getItem('emergencyContacts') || '[]');
        contacts = contacts.filter(c => c.name !== name);
        localStorage.setItem('emergencyContacts', JSON.stringify(contacts));
        loadEmergencyContacts();
        tracker.showNotification('Contact removed', 'success');
    }
}

function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.innerHTML = `
        <div style="background: var(--warning-color); color: white; padding: 15px; border-radius: 12px; margin: 10px;">
            <p style="margin: 0 0 10px 0;">New update available!</p>
            <button onclick="window.location.reload()" style="background: white; color: var(--warning-color); border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer;">
                Refresh Now
            </button>
        </div>
    `;
    document.querySelector('.container').prepend(notification);
}
