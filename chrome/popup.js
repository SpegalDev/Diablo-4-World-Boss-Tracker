document.addEventListener('DOMContentLoaded', function () {
    popupInit();

    async function popupInit() {
        const { notificationsEnabled, notificationTime, badgeColor, badgeDisabled, nextBossName, nextBossTime } 
            = await chrome.storage.sync.get(['notificationsEnabled', 'notificationTime', 'badgeColor', 'badgeDisabled', 'nextBossName', 'nextBossTime']);

        setupNotifications(notificationsEnabled);
        setupNotificationTime(notificationTime);
        setupBadgeColor(badgeColor);
        setupBadgeDisabled(badgeDisabled);
        setupBossDetails(nextBossName, nextBossTime);
    }

    function setupNotifications(enabled) {
        const notificationsCheckbox = document.getElementById('notificationsCheckbox');
        notificationsCheckbox.checked = enabled !== false;
        notificationsCheckbox.addEventListener('change', function () {
            chrome.storage.sync.set({ notificationsEnabled: this.checked });
        });
    }

    function setupNotificationTime(time) {
        const notificationTimeElement = document.getElementById('notificationTime');
        notificationTimeElement.value = time || '10';
        notificationTimeElement.addEventListener('change', function() {
            chrome.storage.sync.set({notificationTime: this.value});
        });
    }

    function setupBadgeDisabled(enabled) {
        const badgeCheckbox = document.getElementById('badgeCheckbox');
        badgeCheckbox.checked = enabled;
        badgeCheckbox.addEventListener('change', function () {
            chrome.storage.sync.set({ badgeDisabled: this.checked }, function() {
                chrome.runtime.sendMessage({ action: 'updateBadgeText' });
            });
        });
    }

    function setupBadgeColor(color) {
        const badgeColorElement = document.getElementById('badgeColor');
        badgeColorElement.value = color || '#000000';  // Black color as fallback

        badgeColorElement.addEventListener('change', function() {
            const newColor = this.value;
            chrome.storage.sync.set({ badgeColor: newColor }, function() {
                console.log('Badge color is set to ' + newColor);
                chrome.action.setBadgeBackgroundColor({ color: newColor });
            });
        });

        chrome.storage.sync.get('badgeColor', function(result) {
            const storedColor = result.badgeColor;
            if (storedColor) {
                badgeColorElement.value = storedColor;
                chrome.action.setBadgeBackgroundColor({ color: storedColor });
            }
        });
    }

    function setupBossDetails(bossName, bossTime) {
        const EVENT_DETAILS = {
            'Ashava': {
                link: 'https://worldstone.io/d4/world-bosses/ashava',
                icon: 'icons/ashava.png'
            },
            'Avarice': {
                link: 'https://worldstone.io/d4/world-bosses/avarice',
                icon: 'icons/avarice.png'
            },
            'Wandering Death': {
                link: 'https://worldstone.io/d4/world-bosses/wandering-death',
                icon: 'icons/death.png'
            },
            default: {
                link: 'https://worldstone.io/d4/world-bosses',
                icon: 'icons/icon.png'
            }
        };

        const details = EVENT_DETAILS[bossName] || EVENT_DETAILS.default;
        document.getElementById('bossLink').href = details.link;
        document.getElementById('bossImage').src = details.icon;
        document.getElementById('bossName').textContent = bossName;

        const bossTimeElement = document.getElementById('bossTime');
        bossTimeElement.textContent = bossTime;
        document.getElementById('bossTimeS').textContent = bossTime === 1 ? '' : 's';
    }
});