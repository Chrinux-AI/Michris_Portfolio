// Configuration
const API_BASE = 'http://localhost:5000'; // Backend API base URL
const themes = [
  'theme-warm', 'theme-calm-dark',
  'theme-ocean', 'theme-ocean-dark',
  'theme-forest', 'theme-forest-dark',
  'theme-vibrant', 'theme-vibrant-dark',
  'theme-sunset', 'theme-sunset-dark',
  'theme-lava', 'theme-lava-dark'
];
let currentThemeIndex = 0;
let roadmapData = {};
let currentMonth = "";
let currentDayIndex = 0;
let progress = JSON.parse(localStorage.getItem('cyber_progress')) || {};

// Motivational Quotes
const motivationalQuotes = {
  fundamentals: "The foundation of security is knowledge. Keep building!",
  network_security: "Secure networks are the backbone of safe communication.",
  system_security: "Hardened systems stand strong against threats.",
  linux_security: "Master Linux, master control.",
  scripting: "Automation is the key to efficiency in security.",
  lab_setup: "A good lab is the start of great experiments.",
  governance: "Good governance ensures long-term security.",
  app_security: "Secure code is unbreakable code.",
  ethical_hacking: "Think like an attacker to defend better.",
  exploit_dev: "Understanding exploits prevents them.",
  reverse_engineering: "Unravel the code to reveal the secrets.",
  bug_bounty: "Hunt bugs, reap rewards.",
  forensics: "Every trace tells a story.",
  incident_response: "Quick response minimizes damage.",
  malware_analysis: "Dissect malware to defeat it.",
  cloud_security: "Secure the cloud, secure the future.",
  devsecops: "Integrate security from the start.",
  soc_operations: "Vigilance in operations saves the day.",
  threat_hunting: "Hunt threats before they hunt you.",
  threat_intel: "Intelligence is power in cybersecurity.",
  red_team: "Attack to improve defenses.",
  blue_team: "Defend with strategy and skill.",
  simulation: "Simulate to prepare for reality.",
  capstone: "Apply all you've learned in your capstone.",
  career: "Build your career on strong foundations.",
  review: "Review to reinforce knowledge.",
  reflection: "Reflection leads to growth."
};

// Daily Tips
function getDailyTip(topic) {
  const tips = {
    fundamentals: "Start with the basics: Always update your software.",
    network_security: "Use VPNs for secure connections.",
    system_security: "Enable multi-factor authentication everywhere.",
    linux_security: "Practice chmod commands to secure files.",
    scripting: "Try writing a simple script to automate a task.",
    lab_setup: "Set up a VM to experiment safely.",
    governance: "Review a security policy template today.",
    app_security: "Test for SQL injection on a practice app.",
    ethical_hacking: "Use Nmap to scan a test network.",
    exploit_dev: "Experiment with a buffer overflow demo.",
    reverse_engineering: "Analyze a simple binary with Ghidra.",
    bug_bounty: "Join a bug bounty platform and read guidelines.",
    forensics: "Practice imaging a disk with a tool like FTK Imager.",
    incident_response: "Simulate a small incident response scenario.",
    malware_analysis: "Run a malware sample in a sandbox.",
    cloud_security: "Secure an AWS S3 bucket with a policy.",
    devsecops: "Integrate a SAST tool into a CI pipeline.",
    soc_operations: "Set up a basic alert rule in a SIEM.",
    threat_hunting: "Explore MITRE ATT&CK framework tactics.",
    threat_intel: "Subscribe to a free threat feed.",
    red_team: "Plan a mock phishing attack.",
    blue_team: "Create a detection rule for a known attack.",
    simulation: "Run a red vs blue exercise with a friend.",
    capstone: "Outline your capstone project today.",
    career: "Update your LinkedIn profile with a skill.",
    review: "Revisit last week's notes for reinforcement.",
    reflection: "Write down one lesson learned this week."
  };
  return tips[topic] || "Stay curious and keep learning!";
}

// Setup and Initialization
window.onload = async () => {
  setupPWA();
  try {
    roadmapData = await loadRoadmapData();
    initApp();
  } catch (err) {
    handleLoadError(err);
  }
};

function setupPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker registered', reg))
      .catch(err => console.error('Service Worker registration failed', err));
  }
}

async function loadRoadmapData() {
  const res = await fetch(`${API_BASE}/api/roadmap`);
  if (!res.ok) throw new Error('Failed to fetch roadmap');
  const data = await res.json();
  localStorage.setItem('cachedRoadmap', JSON.stringify(data));
  return data;
}

function handleLoadError(err) {
  console.error('Failed to load roadmap:', err);
  const cached = localStorage.getItem('cachedRoadmap');
  if (cached) {
    roadmapData = JSON.parse(cached);
    console.log('Using cached roadmap data');
    initApp();
  } else {
    document.getElementById("dayTitle").textContent = "Error loading data.";
  }
}

function initApp() {
  const months = Object.keys(roadmapData.months);

  // Update monthSelect
  const select = document.getElementById("monthSelect");
  months.forEach(m => {
    const option = select.querySelector(`option[value="${m}"]`);
    if (option) option.textContent = `${m.substring(0, 3)} — ${roadmapData.months[m].theme.substring(0, 10)}`;
  });

  const now = new Date('2025-10-15T20:42:00+01:00'); // 08:42 PM WAT, October 15, 2025
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  currentMonth = monthNames[now.getMonth()];
  const days = getAllDays(currentMonth);
  currentDayIndex = Math.min(now.getDate() - 1, days.length - 1); // October 15 is day 14 (0-based)

  document.getElementById("monthSelect").value = currentMonth;
  renderCurrentDay();
  loadTheme();

  // Event Listeners
  document.getElementById("monthSelect").addEventListener("change", handleMonthChange);
  document.getElementById("nextDay").onclick = navigateDay.bind(null, 1);
  document.getElementById("prevDay").onclick = navigateDay.bind(null, -1);
  document.getElementById("completeBtn").onclick = handleCompleteDay;
  document.getElementById("openModal").onclick = openReflectionModal;
  document.getElementById("closeModal").onclick = closeReflectionModal;
  document.getElementById("saveReflection").onclick = saveReflectionToNotes;
  document.getElementById("saveNote").onclick = saveNoteToServer;
  document.getElementById("toggleTheme").onclick = openThemeModal;
  document.getElementById("notesArea").addEventListener("input", debounce(autoSaveNote, 500));
  document.getElementById("exportBtn").onclick = exportProgress;
  document.getElementById("clearProgressBtn").onclick = promptClearProgress;
  document.getElementById("askAiBtn").onclick = handleAiQuestion;
  document.getElementById("courseSearchInput").addEventListener("input", debounce(handleCourseSearch, 300));

  // Collapsible sections
  document.querySelectorAll('.collapsible .title').forEach(title => {
    title.addEventListener('click', () => {
      const card = title.closest('.collapsible');
      const list = card.querySelector('.overview-list');
      const toggle = card.querySelector('.toggle');
      list.classList.toggle('hidden');
      card.classList.toggle('open');
      adjustLayout();
    });
  });

  updateOverviews();
  adjustLayout();
}

function handleMonthChange(e) {
  currentMonth = e.target.value;
  currentDayIndex = 0;
  renderCurrentDay();
  saveLastPosition();
  adjustLayout();
}

function handleCompleteDay() {
  markDayComplete();
  navigateDay(1);
  adjustLayout();
}

// Rendering Functions
function getAllDays(month) {
  const monthData = roadmapData.months[month] || { weeks: {} };
  let allDays = [];
  Object.values(monthData.weeks).forEach(week => {
    allDays = allDays.concat(week.days || []);
  });
  return allDays;
}

async function renderCurrentDay() {
  const days = getAllDays(currentMonth);
  if (days.length === 0 || currentDayIndex >= days.length) {
    currentDayIndex = days.length - 1;
  }

  const day = days[currentDayIndex] || { title: 'No Title', topic: 'No Topic', description: 'No description' };
  document.getElementById("dayTitle").textContent = day.title.substring(0, 15);
  document.getElementById("dayTopic").textContent = `Topic: ${day.topic.substring(0, 15)}`;
  document.getElementById("dayDescription").textContent = `What to learn: ${day.description.substring(0, 20)}`;
  document.getElementById("dayQuote").textContent = `Quote: ${motivationalQuotes[day.topic].substring(0, 25) || 'Keep pushing forward!'}`;
  document.getElementById("dayTip").textContent = `Tip: ${getDailyTip(day.topic).substring(0, 25)}`;

  const progKey = `${currentMonth}-${currentDayIndex}`;
  const progValue = progress[progKey] || 0;
  document.getElementById("progressBar").style.width = `${progValue}%`;
  document.getElementById("progressText").textContent = `Progress: ${progValue}%`;

  await loadNoteForDay();
  updateOverviews();
  adjustLayout();
}

// Navigation
function navigateDay(delta) {
  const months = Object.keys(roadmapData.months);
  let monthIndex = months.indexOf(currentMonth);
  let newIndex = currentDayIndex + delta;
  const currentDaysLength = getAllDays(currentMonth).length;

  if (newIndex < 0) {
    if (monthIndex > 0) {
      currentMonth = months[monthIndex - 1];
      const prevDays = getAllDays(currentMonth);
      currentDayIndex = prevDays.length - 1;
    } else {
      return;
    }
  } else if (newIndex >= currentDaysLength) {
    if (monthIndex < months.length - 1) {
      currentMonth = months[monthIndex + 1];
      currentDayIndex = 0;
    } else {
      return;
    }
  } else {
    currentDayIndex = newIndex;
  }

  document.getElementById("monthSelect").value = currentMonth;
  renderCurrentDay();
  saveLastPosition();
  adjustLayout();
}

// Progress Management
function markDayComplete() {
  const progKey = `${currentMonth}-${currentDayIndex}`;
  progress[progKey] = 100;
  localStorage.setItem('cyber_progress', JSON.stringify(progress));
  document.getElementById("progressBar").style.width = "100%";
  document.getElementById("progressText").textContent = "Progress: 100%";
  updateOverviews();
  adjustLayout();
}

function updateCircularProgress(elementId, percentage) {
  const circle = document.getElementById(elementId);
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  circle.style.strokeDashoffset = offset;
}

// Note Management
async function saveNoteToServer() {
  const content = document.getElementById("notesArea").value.trim().substring(0, 100);
  if (!content) {
    document.getElementById("saveStatus").textContent = "Empty.";
    return;
  }

  const days = getAllDays(currentMonth);
  const day = days[currentDayIndex];
  const dayNum = (currentDayIndex + 1).toString().padStart(2, '0');
  const titleAbbrev = day.topic.substring(0, 3).toUpperCase();

  try {
    const res = await fetch(`${API_BASE}/api/notes/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month: currentMonth,
        day: dayNum,
        title: `${day.title.replace(/ /g, '_')}_${titleAbbrev}`,
        content
      })
    });
    if (res.ok) {
      document.getElementById("saveStatus").textContent = "Saved ✔️";
    }
  } catch (err) {
    document.getElementById("saveStatus").textContent = "Failed ❌";
  }
}

async function autoSaveNote() {
  const content = document.getElementById("notesArea").value.substring(0, 100);
  if (!content.trim()) return;

  const days = getAllDays(currentMonth);
  const day = days[currentDayIndex];
  try {
    await fetch(`${API_BASE}/api/notes/autosave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: currentMonth, title: day.title, content })
    });
  } catch (err) {
    console.error('Autosave failed:', err);
  }
}

async function loadNoteForDay() {
  const dayNum = (currentDayIndex + 1).toString().padStart(2, '0');
  const dayStr = `_${dayNum}_`;
  try {
    const res = await fetch(`${API_BASE}/api/notes/list?month=${currentMonth}`);
    const data = await res.json();
    const matches = data.notes.filter(f => f.includes(dayStr));
    if (matches.length === 0) {
      document.getElementById("notesArea").value = "";
      document.getElementById("saveStatus").textContent = "Not saved";
      return;
    }
    matches.sort((a, b) => {
      const dateA = a.split('_')[2];
      const dateB = b.split('_')[2];
      return dateB.localeCompare(dateA);
    });
    const latest = matches[0];
    const readRes = await fetch(`${API_BASE}/api/notes/read?month=${currentMonth}&filename=${latest}`);
    const readData = await res.json();
    document.getElementById("notesArea").value = readData.content.replace(/^Date: .*\nMonth: .*\nDay: .*\nTitle: .*\n\n/, '').substring(0, 100);
    document.getElementById("saveStatus").textContent = `Loaded`;
  } catch (err) {
    document.getElementById("notesArea").value = "";
    document.getElementById("saveStatus").textContent = "Not saved";
  }
}

// Reflection Modal
async function openReflectionModal() {
  const days = getAllDays(currentMonth);
  const topic = days[currentDayIndex].topic;
  try {
    const res = await fetch(`${API_BASE}/api/notes/reflection?topic=${topic}`);
    const data = await res.json();
    document.getElementById("reflectionQuestion").textContent = data.question.substring(0, 30);
    document.getElementById("modal").classList.remove("hidden");
  } catch (err) {
    document.getElementById("reflectionQuestion").textContent = "Reflection unavailable.";
    console.error('Reflection fetch failed:', err);
  }
}

function closeReflectionModal() {
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("reflectionInput").value = "";
}

function saveReflectionToNotes() {
  const answer = document.getElementById("reflectionInput").value.trim().substring(0, 50);
  if (!answer) return;
  const question = document.getElementById("reflectionQuestion").textContent;
  const currentNotes = document.getElementById("notesArea").value;
  document.getElementById("notesArea").value = `${currentNotes ? currentNotes + '\n' : ''}Ref:\n${question}\n${answer}`;
  closeReflectionModal();
  saveNoteToServer();
}

// Overviews
function updateOverviews() {
  updateDailyOverview();
  updateWeeklyOverview();
  updateMonthlyOverview();
  updateYearlyOverview();
}

function updateDailyOverview() {
  const progKey = `${currentMonth}-${currentDayIndex}`;
  const progValue = progress[progKey] || 0;
  document.getElementById("dailyProgressText").textContent = `${progValue}%`;
  updateCircularProgress("dailyProgressCircle", progValue);
}

function updateWeeklyOverview() {
  const monthData = roadmapData.months[currentMonth] || { weeks: {} };
  const weekIndex = Math.floor(currentDayIndex / 7);
  const weekKey = Object.keys(monthData.weeks)[weekIndex] || 'Week';
  const week = monthData.weeks[weekKey] || { focus: '', days: [] };
  const weekStart = weekIndex * 7;
  const weekEnd = Math.min(weekStart + 7, getAllDays(currentMonth).length);
  let completedWeek = 0;
  for (let i = weekStart; i < weekEnd; i++) {
    const key = `${currentMonth}-${i}`;
    if (progress[key] === 100) completedWeek++;
  }
  const weekProgress = (weekEnd - weekStart > 0) ? Math.round((completedWeek / (weekEnd - weekStart)) * 100) : 0;
  document.getElementById("weeklyProgressText").textContent = `${weekProgress}%`;
  updateCircularProgress("weeklyProgressCircle", weekProgress);
}

function updateMonthlyOverview() {
  const days = getAllDays(currentMonth);
  const completedMonth = days.reduce((acc, d, idx) => acc + (progress[`${currentMonth}-${idx}`] === 100 ? 1 : 0), 0);
  const percentMonth = days.length > 0 ? Math.round((completedMonth / days.length) * 100) : 0;
  document.getElementById("monthlyProgressText").textContent = `${percentMonth}%`;
  updateCircularProgress("monthlyProgressCircle", percentMonth);
  const overviewList = document.getElementById("monthOverview");
  overviewList.innerHTML = "";
  const monthData = roadmapData.months[currentMonth] || { weeks: {} };
  let dayCounter = 0;
  Object.keys(monthData.weeks).slice(0, 1).forEach(weekKey => {
    const week = monthData.weeks[weekKey] || { focus: '', days: [] };
    const weekItem = document.createElement('li');
    weekItem.textContent = `${weekKey}: ${week.focus.substring(0, 15)}`;
    weekItem.style.fontWeight = 'bold';
    overviewList.appendChild(weekItem);
    week.days.slice(0, 2).forEach((d) => {
      const dayItem = document.createElement('li');
      dayItem.textContent = d.title.substring(0, 15);
      if (dayCounter === currentDayIndex) dayItem.classList.add('active');
      overviewList.appendChild(dayItem);
      dayCounter++;
    });
  });
}

function updateYearlyOverview() {
  let totalDays = 0;
  let completed = 0;
  const yearList = document.getElementById("yearProgressList");
  yearList.innerHTML = '';
  Object.keys(roadmapData.months).slice(0, 2).forEach(m => {
    const days = getAllDays(m);
    const completedMonth = days.reduce((acc, d, idx) => acc + (progress[`${m}-${idx}`] === 100 ? 1 : 0), 0);
    totalDays += days.length;
    completed += completedMonth;
  });
  const percent = totalDays > 0 ? Math.round((completed / totalDays) * 100) : 0;
  document.getElementById("yearlyProgressText").textContent = `${percent}%`;
  updateCircularProgress("yearlyProgressCircle", percent);
  Object.keys(roadmapData.months).slice(0, 2).forEach(m => {
    const days = getAllDays(m);
    const completedMonth = days.reduce((acc, d, idx) => acc + (progress[`${m}-${idx}`] === 100 ? 1 : 0), 0);
    const percentMonth = days.length > 0 ? Math.round((completedMonth / days.length) * 100) : 0;
    const li = document.createElement('li');
    li.textContent = `${m.substring(0, 3)}: ${percentMonth}%`;
    yearList.appendChild(li);
  });
}

// Storage
function saveLastPosition() {
  localStorage.setItem('lastMonth', currentMonth);
  localStorage.setItem('lastDay', currentDayIndex);
}

// Utilities
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

function exportProgress() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(progress));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `cyber_progress_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Theme Management with Previews
function loadTheme() {
  const saved = localStorage.getItem('cyber_theme');
  if (saved && themes.includes(saved)) {
    currentThemeIndex = themes.indexOf(saved);
  } else {
    currentThemeIndex = 0; // Default to theme-warm
  }
  themes.forEach(t => document.body.classList.remove(t));
  document.body.classList.add(themes[currentThemeIndex]);
}

function openThemeModal() {
  const modal = document.getElementById('themeModal');
  const previews = document.getElementById('themePreviews');
  previews.innerHTML = '';
  modal.classList.remove('hidden');
  themes.forEach((theme, idx) => {
    const preview = document.createElement('div');
    preview.style.background = getThemePreviewColor(theme);
    preview.style.width = '70px';
    preview.style.height = '40px';
    preview.style.borderRadius = 'var(--radius)';
    preview.style.border = '2px solid var(--card)';
    preview.style.cursor = 'pointer';
    preview.onclick = () => {
      currentThemeIndex = idx;
      cycleTheme();
      modal.classList.add('hidden');
      adjustLayout();
    };
    previews.appendChild(preview);
  });
}

function closeThemeModal() {
  document.getElementById('themeModal').classList.add('hidden');
}

function getThemePreviewColor(theme) {
  const colors = {
    'theme-warm': '#f5e8c7',
    'theme-calm-dark': '#2d2d2d',
    'theme-ocean': '#e0f7fa',
    'theme-ocean-dark': '#006064',
    'theme-forest': '#e8f5e9',
    'theme-forest-dark': '#1b5e20',
    'theme-vibrant': '#fff3e0',
    'theme-vibrant-dark': '#333',
    'theme-sunset': '#fbe9e7',
    'theme-sunset-dark': '#e65100',
    'theme-lava': '#ffebee',
    'theme-lava-dark': '#d32f2f'
  };
  return colors[theme] || '#ffffff';
}

function cycleTheme() {
  themes.forEach(t => document.body.classList.remove(t));
  document.body.classList.add(themes[currentThemeIndex]);
  localStorage.setItem('cyber_theme', themes[currentThemeIndex]);
}

// Clear Progress
function promptClearProgress() {
  const scope = prompt('Enter scope to clear (day, week, month, year):');
  if (!scope) return;
  if (confirm(`Clear ${scope} progress? This cannot be undone.`)) {
    clearProgress(scope);
  }
}

function clearProgress(scope) {
  if (scope === 'day') {
    const progKey = `${currentMonth}-${currentDayIndex}`;
    delete progress[progKey];
  } else if (scope === 'week') {
    const weekIndex = Math.floor(currentDayIndex / 7);
    const weekStart = weekIndex * 7;
    const weekEnd = Math.min(weekStart + 7, getAllDays(currentMonth).length);
    for (let i = weekStart; i < weekEnd; i++) {
      const progKey = `${currentMonth}-${i}`;
      delete progress[progKey];
    }
  } else if (scope === 'month') {
    const days = getAllDays(currentMonth);
    for (let i = 0; i < days.length; i++) {
      const progKey = `${currentMonth}-${i}`;
      delete progress[progKey];
    }
  } else if (scope === 'year') {
    progress = {};
  }
  localStorage.setItem('cyber_progress', JSON.stringify(progress));
  renderCurrentDay();
  updateOverviews();
}

// Layout Adjustment
function adjustLayout() {
  const container = document.querySelector('.container');
  const cards = container.querySelectorAll('.card');
  cards.forEach(card => {
    const content = card.querySelector('textarea, .overview-list');
    if (content) {
      content.style.maxHeight = `${card.offsetHeight - 80}px`;
    }
  });
  container.style.height = `${window.innerHeight - document.querySelector('.header').offsetHeight}px`;
}

// AI Ask Section
async function handleAiQuestion() {
  const question = document.getElementById("aiQuestion").value.trim();
  if (!question) return;
  const topic = getAllDays(currentMonth)[currentDayIndex].topic;
  try {
    const res = await fetch(`${API_BASE}/api/ask?question=${encodeURIComponent(question)}&topic=${encodeURIComponent(topic)}`);
    const data = await res.json();
    alert(`AI Answer: ${data.answer.substring(0, 100)}`); // Limit answer length for alert
  } catch (err) {
    alert('AI answer unavailable. Check backend connection.');
  }
  document.getElementById("aiQuestion").value = ""; // Clear input after response
}

// Course Search Section
function handleCourseSearch(e) {
  const query = e.target.value.toLowerCase();
  const resultsList = document.getElementById("courseSearchResults");
  resultsList.innerHTML = '';
  if (query.length < 2) {
    resultsList.classList.add('hidden');
    return;
  }
  const results = searchCourses(query);
  results.forEach(r => {
    const li = document.createElement('li');
    li.textContent = `${r.month} - Day ${r.day}: ${r.title} (${r.topic})`;
    li.onclick = () => {
      currentMonth = r.month;
      currentDayIndex = r.day - 1;
      document.getElementById("monthSelect").value = currentMonth;
      renderCurrentDay();
      resultsList.classList.add('hidden');
    };
    resultsList.appendChild(li);
  });
  if (results.length > 0) resultsList.classList.remove('hidden');
  else resultsList.classList.add('hidden');
  adjustLayout();
}

function searchCourses(query) {
  const results = [];
  Object.keys(roadmapData.months).forEach(m => {
    const days = getAllDays(m);
    days.forEach((d, idx) => {
      if (d.title.toLowerCase().includes(query) || d.topic.toLowerCase().includes(query) || (d.description || '').toLowerCase().includes(query)) {
        results.push({ month: m, day: idx + 1, title: d.title, topic: d.topic });
      }
    });
  });
  return results.slice(0, 5); // Limit to 5 results to prevent overflow
}