let timer;
let startTime;
let elapsed = 0;
let running = false;
let lapCounter = 0;
let sessionHistory = [];

// DOM elements
const display = document.getElementById('display');
const laps = document.getElementById('laps');
const historyList = document.querySelector('.timeline');
const clearHistoryBtn = document.getElementById('clear-history');

// Initialize the app
function init() {
  loadHistory();
  updateDisplay();
}

// Load history from localStorage
function loadHistory() {
  const storedHistory = localStorage.getItem('stopwatchHistory');
  if (storedHistory) {
    try {
      sessionHistory = JSON.parse(storedHistory);
      sessionHistory = sessionHistory.filter(session => 
        session && session.date && session.time && session.display
      );
    } catch (e) {
      console.error("Failed to parse history:", e);
      sessionHistory = [];
    }
  }
  renderHistory();
}

// Update the display with formatted time
function updateDisplay() {
  const time = running ? Date.now() - startTime + elapsed : elapsed;
  const ms = Math.floor((time % 1000) / 10).toString().padStart(2, '0');
  const sec = Math.floor((time / 1000) % 60).toString().padStart(2, '0');
  const min = Math.floor(time / 60000).toString().padStart(2, '0');
  display.textContent = `${min}:${sec}:${ms}`;
}

// Start the stopwatch
document.getElementById('start').onclick = () => {
  if (running) return;
  running = true;
  startTime = Date.now();
  timer = setInterval(updateDisplay, 10);
};

// Pause the stopwatch
document.getElementById('pause').onclick = () => {
  if (!running) return;
  running = false;
  clearInterval(timer);
  elapsed += Date.now() - startTime;
};

// Reset the stopwatch
document.getElementById('reset').onclick = () => {
  if (running || elapsed > 0) {
    saveSession();
  }
  
  clearInterval(timer);
  display.textContent = "00:00:00";
  elapsed = 0;
  running = false;
  laps.innerHTML = '';
  lapCounter = 0;
};

// Record a lap time
document.getElementById('lap').onclick = () => {
  if (!running) return;
  lapCounter++;
  const lapTime = display.textContent;
  const li = document.createElement('li');
  li.textContent = `Lap ${lapCounter}: ${lapTime}`;
  laps.prepend(li);
};

// Save the current session to history
function saveSession() {
  const session = {
    date: new Date().toISOString(),
    time: elapsed,
    display: display.textContent,
    laps: Array.from(laps.children).map(li => li.textContent)
  };
  
  sessionHistory.unshift(session);
  
  // Keep only the last 10 sessions
  if (sessionHistory.length > 10) {
    sessionHistory = sessionHistory.slice(0, 10);
  }
  
  try {
    localStorage.setItem('stopwatchHistory', JSON.stringify(sessionHistory));
  } catch (e) {
    console.error("Failed to save history:", e);
  }
  
  renderHistory();
}

// Render the history timeline
function renderHistory() {
  historyList.innerHTML = '';
  
  if (sessionHistory.length === 0) {
    historyList.innerHTML = `
      <div class="session-card" style="text-align: center; background: transparent; border: 1px dashed rgba(255,255,255,0.2)">
        <div style="padding: 2rem; color: rgba(255,255,255,0.5)">No sessions recorded yet</div>
      </div>
    `;
    return;
  }
  
  sessionHistory.forEach((session, index) => {
    const date = new Date(session.date);
    const card = document.createElement('div');
    card.className = 'session-card';
    card.innerHTML = `
      <div class="session-time">${session.display}</div>
      <div class="session-meta">
        <span>${date.toLocaleDateString()}</span>
        <span>${date.toLocaleTimeString()}</span>
      </div>
      <div class="session-laps">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        ${session.laps.length} ${session.laps.length === 1 ? 'lap' : 'laps'}
      </div>
    `;
    
    card.addEventListener('click', () => {
      if (confirm(`Restore session from ${date.toLocaleString()}?`)) {
        restoreSession(index);
      }
    });
    
    historyList.appendChild(card);
  });
}

// Clear all history
clearHistoryBtn.onclick = () => {
  if (sessionHistory.length > 0 && confirm("Clear all history?")) {
    sessionHistory = [];
    try {
      localStorage.removeItem('stopwatchHistory');
    } catch (e) {
      console.error("Failed to clear history:", e);
    }
    renderHistory();
  }
};

// Restore a session from history
function restoreSession(index) {
  if (index >= 0 && index < sessionHistory.length) {
    const session = sessionHistory[index];
    display.textContent = session.display;
    elapsed = session.time;
    
    // Restore laps
    laps.innerHTML = '';
    lapCounter = 0;
    session.laps.reverse().forEach(lapText => {
      lapCounter++;
      const li = document.createElement('li');
      li.textContent = lapText;
      laps.appendChild(li);
    });
    
    // Update lap counter to continue from where we left off
    lapCounter = session.laps.length;
  }
}

// Initialize the app when loaded
window.addEventListener('DOMContentLoaded', init);