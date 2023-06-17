const KEEP_ALIVE_INTERVAL = 20e3;
const FETCH_URL = 'https://api.worldstone.io/world-bosses';
const FIVE_MINUTES_MS = 300000;
const ONE_MINUTE_MS = 60000;
const EVENT_ICONS = {
  'Ashava': 'icons/ashava.png',
  'Avarice': 'icons/avarice.png',
  'Wandering Death': 'icons/death.png',
  default: 'icons/icon.png',
};

let TIMEOUT_TIME = ONE_MINUTE_MS;
let NOTIFICATION_THRESHOLD = 10;
let isNotificationPlayed = false;
let nextBossName = null;
let nextBossTime = null;
let fetchTimer = null;

chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'updateBadgeText') checkBossSpawn();
});

backgroundInit();

async function backgroundInit() {
  await chrome.action.setBadgeBackgroundColor({ color: '#CCCCCC' });
  await updateBadgeText('?');
  checkBossSpawn();
}

async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error occurred while fetching data:', error);
    throw error;
  }
}

async function processBossData(data) {
  clearTimeout(fetchTimer);
  const { time: remainingTime, name: upcomingBossName } = data;
  nextBossName = upcomingBossName;
  nextBossTime = remainingTime;
  await updateBadgeText(remainingTime);
  updateIcon(upcomingBossName);
  await handleNotification(remainingTime, upcomingBossName);
  TIMEOUT_TIME = remainingTime > 60 ? FIVE_MINUTES_MS : ONE_MINUTE_MS;
  await chrome.storage.sync.set({ nextBossName, nextBossTime });
  fetchTimer = setTimeout(checkBossSpawn, TIMEOUT_TIME);
}

async function updateBadgeText(remainingTime) {
  const { badgeDisabled, badgeColor } = await chrome.storage.sync.get(['badgeDisabled', 'badgeColor']);
  if (!badgeDisabled) {
    const color = badgeColor || '#CCCCCC';
    chrome.action.setBadgeBackgroundColor({ color });
    let displayTime = `${remainingTime}m`;
    if (remainingTime > 60) displayTime = `${Math.floor(remainingTime / 60)}h`;
    if (remainingTime <= 1) displayTime = 'NOW';
    chrome.action.setBadgeText({ text: displayTime });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

function updateIcon(upcomingBossName) {
  chrome.action.setIcon({ path: { "128": `${getIcon(upcomingBossName)}` } });
}

async function handleNotification(remainingTime, upcomingBossName) {
  const { notificationsEnabled, notificationTime } = await chrome.storage.sync.get(['notificationsEnabled', 'notificationTime']);
  if (notificationsEnabled) {
    NOTIFICATION_THRESHOLD = notificationTime || NOTIFICATION_THRESHOLD;
    if (remainingTime <= NOTIFICATION_THRESHOLD && !isNotificationPlayed) {
      showNotification(upcomingBossName, remainingTime);
      isNotificationPlayed = true;
    } else if (remainingTime > NOTIFICATION_THRESHOLD) {
      isNotificationPlayed = false;
    }
  }
}

function getIcon(upcomingBossName) {
  const bossName = Object.keys(EVENT_ICONS).find(name => upcomingBossName.includes(name));
  return EVENT_ICONS[bossName] || EVENT_ICONS.default;
}

function showNotification(upcomingBossName, upcomingBossTime) {
  const options = {
    type: 'basic',
    iconUrl: getIcon(upcomingBossName),
    title: 'Diablo IV World Boss',
    message: getNotificationMessage(upcomingBossName, upcomingBossTime),
  };
  chrome.notifications.create(options);
}

function getNotificationMessage(upcomingBossName, upcomingBossTime) {
  return upcomingBossName+' will be spawning in Sanctuary within the next '+upcomingBossTime+' minute'+(upcomingBossTime === 1 ? '' : 's')+'.';
}

function checkBossSpawn() {
  fetchData(FETCH_URL)
    .then(data => processBossData(data))
    .catch(error => console.error('Error occurred while fetching data:', error));
}

function keepAlive() {
  setInterval(chrome.runtime.getPlatformInfo, KEEP_ALIVE_INTERVAL);
}