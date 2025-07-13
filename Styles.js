// Calculator functionality
let display = document.getElementById('display');
let currentInput = '0';
let operator = null;
let waitingForOperand = false;
let previousInput = null;
let expression = '';
let resultDisplayed = false;

function updateDisplay() {
    display.value = expression || '0';
}

function inputNumber(num) {
    if (resultDisplayed) {
        expression = '';
        resultDisplayed = false;
    }
    expression += num;
    updateDisplay();
}

function inputOperator(op) {
    if (resultDisplayed) {
        resultDisplayed = false;
    }
    expression += op;
    updateDisplay();
}

function performCalculation() {
    const prev = previousInput;
    const current = parseFloat(currentInput);
    
    if (prev === null || isNaN(current)) return null;
    
    let result;
    switch (operator) {
        case '+': result = prev + current; break;
        case '-': result = prev - current; break;
        case '×': result = prev * current; break;
        case '÷': 
            if (current === 0) {
                showError('Cannot divide by zero');
                return null;
            }
            result = prev / current; 
            break;
        case '%': result = prev % current; break;
        default: return null;
    }
    
    if (Math.abs(result) > 1e15) {
        showError('Number too large');
        return null;
    }
    
    return Math.round(result * 1000000000) / 1000000000;
}

function calculate() {
    try {
        // Replace × and ÷ with * and /
        let evalExpr = expression.replace(/×/g, '*').replace(/÷/g, '/');
        let result = eval(evalExpr);
        display.value = result;
        expression = result.toString();
        resultDisplayed = true;
    } catch {
        display.value = 'Error';
        expression = '';
        resultDisplayed = true;
    }
}

function clearDisplay() {
    expression = '';
    updateDisplay();
}

function backspace() {
    expression = expression.slice(0, -1);
    updateDisplay();
}

function showError(message) {
    currentInput = message;
    updateDisplay();
    setTimeout(() => clearDisplay(), 1500);
}

function showLoadingWeather() {
    document.getElementById('weatherInfo').innerHTML = '<div class="loading">Loading weather data...</div>';
}

function showLoadingLocation() {
    document.getElementById('locationInfo').innerHTML = '<div class="loading">Getting your location...</div>';
}

function getWeatherByCoords(lat, lon, locationLabel = 'Your Location') {
    showLoadingWeather();
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
        .then(res => res.json())
        .then(data => {
            if (data.current_weather) {
                const weatherData = {
                    main: {
                        temp: data.current_weather.temperature,
                        feels_like: data.current_weather.temperature,
                        humidity: 50,
                        pressure: 1013
                    },
                    weather: [{
                        main: 'Clear',
                        description: 'clear sky',
                        icon: '☀️'
                    }],
                    wind: {
                        speed: data.current_weather.windspeed
                    },
                    name: locationLabel
                };
                displayWeatherData(weatherData);
            } else {
                document.getElementById('weatherInfo').innerHTML = '<div class="error">Unable to load weather data</div>';
            }
        })
        .catch(() => {
            document.getElementById('weatherInfo').innerHTML = '<div class="error">Unable to load weather data</div>';
        });
}

function getWeatherTypeFromCode(code) {
    if (code === 0) return 'Clear';
    if (code >= 1 && code <= 3) return 'Clouds';
    if (code >= 51 && code <= 67) return 'Rain';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 80 && code <= 99) return 'Thunderstorm';
    return 'Clear';
}

function getWeatherDescriptionFromCode(code) {
    const descriptions = {
        0: 'clear sky',
        1: 'mainly clear',
        2: 'partly cloudy',
        3: 'overcast',
        45: 'fog',
        48: 'depositing rime fog',
        51: 'light drizzle',
        53: 'moderate drizzle',
        55: 'dense drizzle',
        61: 'slight rain',
        63: 'moderate rain',
        65: 'heavy rain',
        71: 'slight snow',
        73: 'moderate snow',
        75: 'heavy snow',
        95: 'thunderstorm',
        96: 'thunderstorm with hail',
        99: 'thunderstorm with heavy hail'
    };
    return descriptions[code] || 'clear sky';
}

function getWeatherIconFromCode(code) {
    if (code === 0) return '☀️';
    if (code >= 1 && code <= 3) return '☁️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 99) return '⛈️';
    return '☀️';
}

function getSimulatedWeatherData(locationData) {
    const now = new Date();
    const month = now.getMonth();
    const isWinter = month >= 11 || month <= 2;
    const isSummer = month >= 5 && month <= 8;
    
    let baseTemp = 20;
    if (locationData.latitude > 50) baseTemp -= 10;
    if (locationData.latitude < 30) baseTemp += 10;
    if (isWinter) baseTemp -= 15;
    if (isSummer) baseTemp += 10;
    
    const temp = Math.round(baseTemp + (Math.random() - 0.5) * 10);
    const conditions = ['Clear', 'Clouds', 'Rain'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
        main: {
            temp: temp,
            feels_like: temp + Math.round((Math.random() - 0.5) * 5),
            humidity: Math.round(40 + Math.random() * 40),
            pressure: Math.round(1000 + Math.random() * 50)
        },
        weather: [{
            main: randomCondition,
            description: randomCondition.toLowerCase(),
            icon: getWeatherIcon(randomCondition)
        }],
        wind: {
            speed: Math.round(Math.random() * 15)
        },
        visibility: Math.round(8000 + Math.random() * 2000),
        name: locationData.city || 'Your Location',
        source: 'Simulated'
    };
}

function displayWeatherData(data) {
    const weatherIcon = getWeatherIcon(data.weather[0].main);
    const weatherHTML = `
        <div class="weather-main">
            <div class="weather-icon">${weatherIcon}</div>
            <div>
                <div class="temperature">${data.main.temp}°C</div>
                <div class="weather-description">${data.weather[0].description}</div>
                <div class="location-name">${data.name}</div>
            </div>
        </div>
        <div class="weather-details">
            <div class="weather-detail">
                <strong>Feels like</strong>
                <span>${data.main.feels_like}°C</span>
            </div>
            <div class="weather-detail">
                <strong>Humidity</strong>
                <span>${data.main.humidity}%</span>
            </div>
            <div class="weather-detail">
                <strong>Wind</strong>
                <span>${data.wind.speed} km/h</span>
            </div>
            <div class="weather-detail">
                <strong>Pressure</strong>
                <span>${data.main.pressure} hPa</span>
            </div>
        </div>
    `;
    document.getElementById('weatherInfo').innerHTML = weatherHTML;
}

function getWeatherIcon(weather) {
    const icons = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Snow': '❄️',
        'Thunderstorm': '⛈️',
        'Drizzle': '🌦️',
        'Mist': '🌫️',
        'Fog': '🌫️'
    };
    return icons[weather] || '🌤️';
}

// Time functionality
function updateTime() {
    const now = new Date();
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true
    };
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    document.getElementById('currentTime').textContent = now.toLocaleTimeString('en-US', timeOptions);
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', dateOptions);
    document.getElementById('timezone').textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Location functionality
async function getLocationData() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('Location API error');
        const data = await response.json();
        
        const locationHTML = `
            <div class="location-detail">
                <strong>City:</strong>
                <span>${data.city || 'Unknown'}</span>
            </div>
            <div class="location-detail">
                <strong>Region:</strong>
                <span>${data.region || 'Unknown'}</span>
            </div>
            <div class="location-detail">
                <strong>Country:</strong>
                <span>${data.country_name || 'Unknown'}</span>
            </div>
            <div class="location-detail">
                <strong>IP Address:</strong>
                <span>${data.ip || 'Unknown'}</span>
            </div>
            <div class="location-detail">
                <strong>ISP:</strong>
                <span>${data.org || 'Unknown'}</span>
            </div>
        `;
        document.getElementById('locationInfo').innerHTML = locationHTML;
    } catch (error) {
        document.getElementById('locationInfo').innerHTML = '<div class="error">Unable to load location data</div>';
    }
}

// Timer functionality
let timerInterval;
let timerSeconds = 0;
let timerRunning = false;

function updateTimerDisplay() {
    const hours = Math.floor(timerSeconds / 3600);
    const minutes = Math.floor((timerSeconds % 3600) / 60);
    const seconds = timerSeconds % 60;
    
    document.getElementById('timerDisplay').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function toggleTimer() {
    const toggleBtn = document.getElementById('timerToggleBtn');
    
    if (!timerRunning) {
        // Start timer
        const hours = parseInt(document.getElementById('timerHours').value) || 0;
        const minutes = parseInt(document.getElementById('timerMinutes').value) || 0;
        const seconds = parseInt(document.getElementById('timerSeconds').value) || 0;
        
        // Set timer to the input values if it's 0
        if (timerSeconds === 0) {
            timerSeconds = hours * 3600 + minutes * 60 + seconds;
        }
        
        if (timerSeconds > 0) {
            timerRunning = true;
            toggleBtn.textContent = 'Pause';
            timerInterval = setInterval(() => {
                timerSeconds--;
                updateTimerDisplay();
                
                if (timerSeconds <= 0) {
                    clearInterval(timerInterval);
                    timerRunning = false;
                    toggleBtn.textContent = 'Start';
                    alert('Timer finished!');
                }
            }, 1000);
        } else {
            alert('Please enter a valid time!');
        }
    } else {
        // Pause timer
        clearInterval(timerInterval);
        timerRunning = false;
        toggleBtn.textContent = 'Resume';
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerSeconds = 0;
    updateTimerDisplay();
    // Reset input fields
    document.getElementById('timerHours').value = '0';
    document.getElementById('timerMinutes').value = '5';
    document.getElementById('timerSeconds').value = '0';
    // Reset button text
    document.getElementById('timerToggleBtn').textContent = 'Start';
}

// Stopwatch functionality
let stopwatchInterval;
let stopwatchTime = 0;
let stopwatchRunning = false;
let lapCount = 0;

function updateStopwatchDisplay() {
    const hours = Math.floor(stopwatchTime / 3600);
    const minutes = Math.floor((stopwatchTime % 3600) / 60);
    const seconds = Math.floor((stopwatchTime % 60));
    const milliseconds = Math.floor((stopwatchTime % 1) * 100);
    
    document.getElementById('stopwatchDisplay').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
}

function toggleStopwatch() {
    const toggleBtn = document.getElementById('stopwatchToggleBtn');
    
    if (!stopwatchRunning) {
        // Start stopwatch
        stopwatchRunning = true;
        toggleBtn.textContent = 'Stop';
        const startTime = Date.now() - (stopwatchTime * 1000);
        stopwatchInterval = setInterval(() => {
            stopwatchTime = (Date.now() - startTime) / 1000;
            updateStopwatchDisplay();
        }, 10); // Update every 10ms for smooth milliseconds
    } else {
        // Stop stopwatch
        clearInterval(stopwatchInterval);
        stopwatchRunning = false;
        toggleBtn.textContent = 'Resume';
    }
}

function resetStopwatch() {
    clearInterval(stopwatchInterval);
    stopwatchRunning = false;
    stopwatchTime = 0;
    lapCount = 0;
    updateStopwatchDisplay();
    document.getElementById('laps').innerHTML = '';
}

function lapStopwatch() {
    if (stopwatchRunning) {
        lapCount++;
        const lapTime = document.getElementById('stopwatchDisplay').textContent;
        const lapHTML = `<div class="lap">Lap ${lapCount}<span>${lapTime}</span></div>`;
        document.getElementById('laps').insertAdjacentHTML('afterbegin', lapHTML);
    }
}

// Keyboard support for calculator
document.addEventListener('keydown', function(event) {
    const key = event.key;

    if (['Enter', '=', '+', '-', '*', '/', '%', 'Escape', 'Backspace'].includes(key)) {
        event.preventDefault();
    }
    
    if (key >= '0' && key <= '9') inputNumber(key);
    else if (key === '.') inputNumber('.');
    else if (key === '+') inputOperator('+');
    else if (key === '-') inputOperator('-');
    else if (key === '*') inputOperator('×');
    else if (key === '/') inputOperator('÷');
    else if (key === '%') inputOperator('%');
    else if (key === 'Enter' || key === '=') calculate();
    else if (key === 'Escape' || key === 'c' || key === 'C') clearDisplay();
    else if (key === 'Backspace') backspace();
});

// Todo List functionality
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let currentFilter = 'all';

function addTodo() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();
    
    if (text) {
        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        todos.unshift(todo);
        saveTodos();
        renderTodos();
        input.value = '';
    }
}

function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
    }
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
}

function clearCompleted() {
    todos = todos.filter(t => !t.completed);
    saveTodos();
    renderTodos();
}

function filterTodos(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    renderTodos();
}

function renderTodos() {
    const todoList = document.getElementById('todoList');
    const todoCount = document.getElementById('todoCount');
    
    let filteredTodos = todos;
    if (currentFilter === 'active') {
        filteredTodos = todos.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTodos = todos.filter(t => t.completed);
    }
    
    if (filteredTodos.length === 0) {
        todoList.innerHTML = '<div class="todo-empty">No tasks found</div>';
    } else {
        todoList.innerHTML = filteredTodos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" onclick="toggleTodo(${todo.id})"></div>
                <div class="todo-text">${todo.text}</div>
                <button class="todo-delete" onclick="deleteTodo(${todo.id})">×</button>
            </div>
        `).join('');
    }
    
    const activeCount = todos.filter(t => !t.completed).length;
    todoCount.textContent = `${activeCount} task${activeCount !== 1 ? 's' : ''}`;
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Enter key support for todo input
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && document.activeElement.id === 'todoInput') {
        addTodo();
    }
});

// Weather and Location functionality
function getLocationAndWeather() {
    // Try to get user's location first
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                getWeatherByCoords(latitude, longitude, 'Your Location');
            },
            (error) => {
                console.log('Geolocation error:', error);
                // Fallback to default location (New Delhi)
                getWeatherByCoords(28.6139, 77.2090, 'New Delhi');
            }
        );
    } else {
        // Fallback to default location
        getWeatherByCoords(28.6139, 77.2090, 'New Delhi');
    }
}

// Time Tracker mode switching logic
function switchTTMode(mode) {
    document.querySelectorAll('.tt-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('.tt-tab-btn[data-mode="' + mode + '"]').classList.add('active');
    document.querySelectorAll('.tt-mode').forEach(div => {
        div.classList.remove('active');
        div.style.display = 'none';
    });
    const modeDiv = document.getElementById('tt' + mode.charAt(0).toUpperCase() + mode.slice(1) + 'Mode');
    if (modeDiv) {
        modeDiv.classList.add('active');
        modeDiv.style.display = 'block';
    }
}

// Pomodoro Timer Logic
let pomodoroInterval = null;
let pomodoroState = JSON.parse(localStorage.getItem('pomodoroState')) || {
    mode: 'work', // 'work' or 'break'
    timeLeft: 25 * 60, // seconds
    totalTime: 25 * 60, // total time for current session
    sessionCount: 0,
    breakCount: 0,
    running: false
};

function updatePomodoroUI() {
    document.getElementById('pomodoroStatus').textContent = pomodoroState.mode === 'work' ? 'Work' : 'Break';
    const min = Math.floor(pomodoroState.timeLeft / 60).toString().padStart(2, '0');
    const sec = (pomodoroState.timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('pomodoroTimer').textContent = `${min}:${sec}`;
    document.getElementById('pomodoroSessionCount').textContent = pomodoroState.sessionCount;
    document.getElementById('pomodoroBreakCount').textContent = pomodoroState.breakCount;
    
    const toggleBtn = document.getElementById('pomodoroToggleBtn');
    if (pomodoroState.running) {
        toggleBtn.textContent = 'Pause';
    } else if (pomodoroState.timeLeft < pomodoroState.totalTime) {
        toggleBtn.textContent = 'Resume';
    } else {
        toggleBtn.textContent = 'Start';
    }
}

function togglePomodoro() {
    if (pomodoroState.running) {
        // Pause
        if (pomodoroInterval) clearInterval(pomodoroInterval);
        pomodoroState.running = false;
        savePomodoroState();
        updatePomodoroUI();
    } else {
        // Start/Resume
        if (pomodoroState.timeLeft === pomodoroState.totalTime) {
            // First time starting - get time from input
            const minutes = parseInt(document.getElementById('pomodoroMinutes').value) || 25;
            pomodoroState.timeLeft = minutes * 60;
            pomodoroState.totalTime = minutes * 60;
        }
        
        pomodoroState.running = true;
        savePomodoroState();
        pomodoroInterval = setInterval(() => {
            if (pomodoroState.timeLeft > 0) {
                pomodoroState.timeLeft--;
                updatePomodoroUI();
                savePomodoroState();
            } else {
                clearInterval(pomodoroInterval);
                pomodoroState.running = false;
                if (pomodoroState.mode === 'work') {
                    pomodoroState.sessionCount++;
                    pomodoroState.mode = 'break';
                    pomodoroState.timeLeft = 5 * 60;
                    pomodoroState.totalTime = 5 * 60;
                } else {
                    pomodoroState.breakCount++;
                    pomodoroState.mode = 'work';
                    const minutes = parseInt(document.getElementById('pomodoroMinutes').value) || 25;
                    pomodoroState.timeLeft = minutes * 60;
                    pomodoroState.totalTime = minutes * 60;
                }
                updatePomodoroUI();
                savePomodoroState();
            }
        }, 1000);
    }
}

function resetPomodoro() {
    if (pomodoroInterval) clearInterval(pomodoroInterval);
    const minutes = parseInt(document.getElementById('pomodoroMinutes').value) || 25;
    pomodoroState = {
        mode: 'work',
        timeLeft: minutes * 60,
        totalTime: minutes * 60,
        sessionCount: 0,
        breakCount: 0,
        running: false
    };
    savePomodoroState();
    updatePomodoroUI();
}

function savePomodoroState() {
    localStorage.setItem('pomodoroState', JSON.stringify(pomodoroState));
}

// Clock-in/Clock-out Logic
let clockState = JSON.parse(localStorage.getItem('clockState')) || {
    clockedIn: false,
    clockInTime: null,
    clockOutTime: null,
    log: JSON.parse(localStorage.getItem('clockLog')) || {}
};
let clockTimerInterval = null;

function updateClockUI() {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    
    // Status
    document.getElementById('clockStatus').textContent = clockState.clockedIn ? 'Clocked In' : 'Not clocked in';
    
    // Timer
    let elapsed = 0;
    if (clockState.clockedIn && clockState.clockInTime) {
        elapsed = Math.floor((Date.now() - new Date(clockState.clockInTime).getTime()) / 1000);
    } else if (clockState.clockInTime && clockState.clockOutTime) {
        elapsed = Math.floor((new Date(clockState.clockOutTime).getTime() - new Date(clockState.clockInTime).getTime()) / 1000);
    }
    
    const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
    const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('clockTimer').textContent = `${h}:${m}:${s}`;
    
    // Button states
    document.getElementById('clockInBtn').disabled = clockState.clockedIn;
    document.getElementById('clockOutBtn').disabled = !clockState.clockedIn;
    
    // Log
    renderClockLog();
}

function clockIn() {
    if (clockState.clockedIn) return;
    clockState.clockedIn = true;
    clockState.clockInTime = new Date().toISOString();
    clockState.clockOutTime = null;
    saveClockState();
    updateClockUI();
    if (clockTimerInterval) clearInterval(clockTimerInterval);
    clockTimerInterval = setInterval(updateClockUI, 1000);
}

function clockOut() {
    if (!clockState.clockedIn) return;
    clockState.clockedIn = false;
    clockState.clockOutTime = new Date().toISOString();
    
    // Save to today's log
    const todayKey = new Date().toISOString().slice(0, 10);
    if (!clockState.log[todayKey]) clockState.log[todayKey] = [];
    clockState.log[todayKey].push({
        in: clockState.clockInTime,
        out: clockState.clockOutTime
    });
    
    saveClockState();
    updateClockUI();
    if (clockTimerInterval) clearInterval(clockTimerInterval);
}

function renderClockLog() {
    const logList = document.getElementById('clockLogList');
    const todayKey = new Date().toISOString().slice(0, 10);
    const todayLog = clockState.log[todayKey] || [];
    
    if (todayLog.length === 0) {
        logList.innerHTML = '<li>No entries yet.</li>';
    } else {
        logList.innerHTML = todayLog.map(entry => {
            const inTime = new Date(entry.in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit', hour12: true});
            const outTime = entry.out ? new Date(entry.out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit', hour12: true}) : '--';
            return `<li>In: ${inTime} &rarr; Out: ${outTime}</li>`;
        }).join('');
    }
}

function saveClockState() {
    localStorage.setItem('clockState', JSON.stringify(clockState));
    localStorage.setItem('clockLog', JSON.stringify(clockState.log));
}

// Dark/Light Mode Toggle
(function() {
    const html = document.documentElement;
    const btn = document.getElementById('themeToggle');
    const icon = btn.querySelector('.theme-icon');
    const text = btn.querySelector('.theme-text');

    // Load theme from localStorage or system preference
    function getPreferredTheme() {
        const stored = localStorage.getItem('theme');
        if (stored) return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function setTheme(theme) {
        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
            icon.textContent = '☀️';
            text.textContent = 'Light Mode';
        } else {
            html.removeAttribute('data-theme');
            icon.textContent = '🌙';
            text.textContent = 'Dark Mode';
        }
        localStorage.setItem('theme', theme);
    }

    btn.addEventListener('click', function() {
        const isDark = html.getAttribute('data-theme') === 'dark';
        setTheme(isDark ? 'light' : 'dark');
    });

    // Initialize on page load
    setTheme(getPreferredTheme());
})();

// Initialize everything
updateDisplay();
updateTime();
updateTimerDisplay();
updateStopwatchDisplay();
getLocationAndWeather();
renderTodos();

// Initialize Pomodoro UI
updatePomodoroUI();

// Initialize Clock-in/Clock-out UI
updateClockUI();

// Update time every second
setInterval(updateTime, 1000);

// Update weather every 10 minutes
setInterval(getLocationAndWeather, 600000);
