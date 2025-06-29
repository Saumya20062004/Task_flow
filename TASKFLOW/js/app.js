document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("taskflowUser"));
  const avatar = document.getElementById("avatar");
  const username = document.getElementById("username");
  const signout = document.getElementById("signout");
  const themeToggle = document.getElementById("themeToggle");
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const priorityFilter = document.getElementById("priorityFilter");
  const tabs = document.querySelectorAll(".tab");
  const taskInput = document.getElementById("taskInput");
  const dueDateInput = document.getElementById("dueDate");
  const taskCategorySelect = document.getElementById("taskCategory");
  const taskPrioritySelect = document.getElementById("taskPriority");
  const reminderTimeSelect = document.getElementById("reminderTime");
  const recurringTypeSelect = document.getElementById("recurringType");
  const addTaskBtn = document.getElementById("addTask");
  const taskList = document.getElementById("taskList");
  const notification = document.getElementById("notification");

  // Pomodoro Timer Elements
  const pomodoroStart = document.getElementById("pomodoroStart");
  const pomodoroPause = document.getElementById("pomodoroPause");
  const pomodoroReset = document.getElementById("pomodoroReset");
  const timerDisplay = document.getElementById("timerDisplay");
  const timerMode = document.getElementById("timerMode");
  const progressBar = document.getElementById("progressBar");
  const workTimeInput = document.getElementById("workTime");
  const breakTimeInput = document.getElementById("breakTime");
  const longBreakTimeInput = document.getElementById("longBreakTime");

  // Analytics Elements
  const refreshAnalytics = document.getElementById("refreshAnalytics");
  const goalProgressBar = document.getElementById("goalProgressBar");
  const goalText = document.getElementById("goalText");
  const streakText = document.getElementById("streakText");
  const productivityScore = document.getElementById("productivityScore");
  const upcomingDeadlines = document.getElementById("upcomingDeadlines");

  // Chart instances
  let weeklyChart = null;
  let categoryChart = null;
  let priorityChart = null;

  // Subtasks Elements
  const addSubtaskBtn = document.getElementById("addSubtask");
  const subtasksList = document.getElementById("subtasksList");

  // Time Tracking Elements
  const timeEstimateInput = document.getElementById("timeEstimate");

  let currentStage = "todo";
  let tasks = [];
  let reminderTimeouts = new Map();
  let searchTerm = "";
  let selectedCategory = "";
  let selectedPriority = "";
  let subtasks = [];
  let currentTaskTimer = null;
  let activeTaskId = null;

  // Pomodoro Timer Variables
  let pomodoroTimer = null;
  let pomodoroTimeLeft = 25 * 60; // 25 minutes in seconds
  let pomodoroTotalTime = 25 * 60;
  let pomodoroMode = "work"; // work, break, longBreak
  let pomodoroSessions = 0;
  let isPomodoroRunning = false;

  // Set default due date to today
  const today = new Date().toISOString().split('T')[0];
  dueDateInput.value = today;

  // Load theme preference
  const savedTheme = localStorage.getItem("taskflowTheme") || "dark";
  document.body.classList.toggle("light-theme", savedTheme === "light");
  themeToggle.textContent = savedTheme === "light" ? "🌙" : "☀️";

  // Load user info first
  if (user) {
    username.textContent = user.name;
    avatar.src = `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(user.name)}`;
  } else {
    window.location.href = "index.html";
    return;
  }

  // Create user-specific storage key
  const userTasksKey = `taskflowTasks_${user.name.replace(/\s+/g, '_')}`;
  const userStreakKey = `taskflowStreak_${user.name.replace(/\s+/g, '_')}`;
  
  // Load user-specific tasks
  tasks = JSON.parse(localStorage.getItem(userTasksKey)) || [];

  // Migrate existing completed tasks to have completedAt field
  migrateCompletedTasks();

  // Initialize Analytics
  initializeAnalytics();

  // Migration function for existing completed tasks
  function migrateCompletedTasks() {
    let needsUpdate = false;
    tasks.forEach(task => {
      if (task.stage === "completed" && !task.completedAt) {
        task.completedAt = new Date().toISOString();
        needsUpdate = true;
      }
    });
    if (needsUpdate) {
      updateLocalStorage();
    }
  }

  // First-time dummy data fetch for this specific user
  if (tasks.length === 0) {
    fetch('https://dummyjson.com/todos')
      .then(response => response.json())
      .then(data => {
        const dummyTasks = data.todos.slice(0, 5).map(todo => ({
          id: Date.now() + Math.random(),
          title: todo.todo,
          stage: "todo",
          timestamp: new Date().toLocaleString(),
          dueDate: new Date().toISOString().split('T')[0],
          category: "other",
          priority: "medium",
          createdAt: new Date().toISOString()
        }));
        tasks = dummyTasks;
        updateLocalStorage();
        renderTasks();
        showNotification(`Welcome ${user.name}! We've added some sample tasks to get you started! 🚀`);
      })
      .catch(error => {
        showNotification(`Welcome ${user.name}! Start organizing your tasks with TaskFlow. Add your first task above! 🚀`);
      });
  } else {
    renderTasks();
    setupReminders();
  }

  // Initialize Pomodoro Timer
  initializePomodoro();

  // Theme Toggle
  themeToggle.addEventListener("click", () => {
    const isLight = document.body.classList.toggle("light-theme");
    themeToggle.textContent = isLight ? "🌙" : "☀️";
    localStorage.setItem("taskflowTheme", isLight ? "light" : "dark");
    updateAnalytics(); // Refresh charts with new theme
  });

  // Search and Filter Functionality
  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value.toLowerCase();
    renderTasks();
  });

  categoryFilter.addEventListener("change", (e) => {
    selectedCategory = e.target.value;
    renderTasks();
  });

  priorityFilter.addEventListener("change", (e) => {
    selectedPriority = e.target.value;
    renderTasks();
  });

  // Analytics Refresh
  refreshAnalytics.addEventListener("click", () => {
    updateAnalytics();
    showNotification("Analytics refreshed! 📊");
  });

  // Add Subtask Functionality
  addSubtaskBtn.addEventListener("click", () => {
    addSubtask();
  });

  // Add Task with Enhanced Features
  addTaskBtn.addEventListener("click", () => {
    const value = taskInput.value.trim();
    const dueDate = dueDateInput.value;
    const category = taskCategorySelect.value;
    const priority = taskPrioritySelect.value;
    const reminderTime = reminderTimeSelect.value;
    const recurringType = recurringTypeSelect.value;

    if (!value) return showNotification("Please enter a task.");
    if (!dueDate) return showNotification("Please select a due date.");

    // Collect subtasks from the form
    const subtaskInputs = subtasksList.querySelectorAll('.subtask-input');
    const collectedSubtasks = [];
    subtaskInputs.forEach(input => {
      const text = input.value.trim();
      if (text) {
        collectedSubtasks.push({
          text: text,
          completed: false
        });
      }
    });

    const newTask = {
      id: Date.now(),
      title: value,
      stage: currentStage,
      timestamp: new Date().toLocaleString(),
      dueDate: dueDate,
      category: category,
      priority: priority,
      reminderTime: reminderTime ? parseInt(reminderTime) : null,
      recurringType: recurringType,
      subtasks: collectedSubtasks,
      completedSubtasks: 0,
      createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    updateLocalStorage();
    resetTaskForm();
    renderTasks();
    setupReminders();
    updateAnalytics(); // Update analytics when task is added
    
    // Update upcoming deadlines count immediately
    updateUpcomingDeadlinesDisplay();
    
    showNotification("Task added successfully!");
  });

  // Tab Switch
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentStage = tab.dataset.stage;
      renderTasks();
    });
  });

  // Sign Out
  signout.addEventListener("click", () => {
    // Clear only current user's data
    localStorage.removeItem("taskflowUser");
    localStorage.removeItem(userTasksKey);
    localStorage.removeItem(userStreakKey);
    // Clear all reminder timeouts
    reminderTimeouts.forEach(timeout => clearTimeout(timeout));
    reminderTimeouts.clear();
    // Stop any active timers
    if (pomodoroTimer) clearInterval(pomodoroTimer);
    if (currentTaskTimer) clearInterval(currentTaskTimer);
    window.location.href = "index.html";
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + Enter to add task
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && document.activeElement === taskInput) {
      addTaskBtn.click();
    }
    
    // Escape to clear search
    if (e.key === "Escape" && document.activeElement === searchInput) {
      searchInput.value = "";
      searchTerm = "";
      renderTasks();
    }
  });

  // Pomodoro Timer Functions
  function initializePomodoro() {
    updateTimerDisplay();
    updateProgressBar();
    
    // Load saved settings
    const savedWorkTime = localStorage.getItem('pomodoroWorkTime');
    const savedBreakTime = localStorage.getItem('pomodoroBreakTime');
    const savedLongBreakTime = localStorage.getItem('pomodoroLongBreakTime');
    
    if (savedWorkTime) workTimeInput.value = savedWorkTime;
    if (savedBreakTime) breakTimeInput.value = savedBreakTime;
    if (savedLongBreakTime) longBreakTimeInput.value = savedLongBreakTime;
    
    updatePomodoroSettings();
  }

  function startPomodoro() {
    if (isPomodoroRunning) return;
    
    isPomodoroRunning = true;
    pomodoroStart.disabled = true;
    pomodoroPause.disabled = false;
    
    pomodoroTimer = setInterval(() => {
      pomodoroTimeLeft--;
      updateTimerDisplay();
      updateProgressBar();
      
      if (pomodoroTimeLeft <= 0) {
        handlePomodoroComplete();
      }
    }, 1000);
  }

  function pausePomodoro() {
    if (!isPomodoroRunning) return;
    
    isPomodoroRunning = false;
    pomodoroStart.disabled = false;
    pomodoroPause.disabled = true;
    clearInterval(pomodoroTimer);
  }

  function resetPomodoro() {
    pausePomodoro();
    pomodoroTimeLeft = pomodoroTotalTime;
    pomodoroMode = "work";
    pomodoroSessions = 0;
    updateTimerDisplay();
    updateProgressBar();
    timerMode.textContent = "Work Session";
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(pomodoroTimeLeft / 60);
    const seconds = pomodoroTimeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function updateProgressBar() {
    const progress = ((pomodoroTotalTime - pomodoroTimeLeft) / pomodoroTotalTime) * 100;
    progressBar.style.width = `${progress}%`;
  }

  function updatePomodoroSettings() {
    const workTime = parseInt(workTimeInput.value);
    const breakTime = parseInt(breakTimeInput.value);
    const longBreakTime = parseInt(longBreakTimeInput.value);
    
    localStorage.setItem('pomodoroWorkTime', workTime);
    localStorage.setItem('pomodoroBreakTime', breakTime);
    localStorage.setItem('pomodoroLongBreakTime', longBreakTime);
    
    if (pomodoroMode === "work") {
      pomodoroTimeLeft = workTime * 60;
      pomodoroTotalTime = workTime * 60;
    }
    
    updateTimerDisplay();
    updateProgressBar();
  }

  function handlePomodoroComplete() {
    pausePomodoro();
    
    if (pomodoroMode === "work") {
      pomodoroSessions++;
      
      if (pomodoroSessions % 4 === 0) {
        // Long break
        pomodoroMode = "longBreak";
        pomodoroTimeLeft = parseInt(longBreakTimeInput.value) * 60;
        pomodoroTotalTime = parseInt(longBreakTimeInput.value) * 60;
        timerMode.textContent = "Long Break";
        showNotification("Great work! Take a long break. 🎉");
      } else {
        // Short break
        pomodoroMode = "break";
        pomodoroTimeLeft = parseInt(breakTimeInput.value) * 60;
        pomodoroTotalTime = parseInt(breakTimeInput.value) * 60;
        timerMode.textContent = "Short Break";
        showNotification("Work session complete! Take a short break. ☕");
      }
    } else {
      // Break complete, back to work
      pomodoroMode = "work";
      pomodoroTimeLeft = parseInt(workTimeInput.value) * 60;
      pomodoroTotalTime = parseInt(workTimeInput.value) * 60;
      timerMode.textContent = "Work Session";
      showNotification("Break complete! Time to focus again. 💪");
    }
    
    updateTimerDisplay();
    updateProgressBar();
  }

  // Pomodoro Event Listeners
  pomodoroStart.addEventListener("click", startPomodoro);
  pomodoroPause.addEventListener("click", pausePomodoro);
  pomodoroReset.addEventListener("click", resetPomodoro);
  workTimeInput.addEventListener("change", updatePomodoroSettings);
  breakTimeInput.addEventListener("change", updatePomodoroSettings);
  longBreakTimeInput.addEventListener("change", updatePomodoroSettings);

  // Subtasks Functions
  function addSubtask() {
    const subtaskDiv = document.createElement("div");
    subtaskDiv.className = "subtask-item";
    subtaskDiv.innerHTML = `
      <input type="text" class="subtask-input" placeholder="Enter subtask...">
      <button type="button" class="remove-subtask-btn">×</button>
    `;
    
    const removeBtn = subtaskDiv.querySelector(".remove-subtask-btn");
    removeBtn.addEventListener("click", () => {
      subtaskDiv.remove();
    });
    
    subtasksList.appendChild(subtaskDiv);
  }

  function resetTaskForm() {
    taskInput.value = "";
    dueDateInput.value = today;
    taskCategorySelect.value = "other";
    taskPrioritySelect.value = "medium";
    reminderTimeSelect.value = "";
    recurringTypeSelect.value = "";
    subtasksList.innerHTML = "";
    subtasks = [];
  }

  function renderTasks() {
    const filteredTasks = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm);
      const matchesCategory = !selectedCategory || task.category === selectedCategory;
      const matchesPriority = !selectedPriority || task.priority === selectedPriority;
      const matchesStage = task.stage === currentStage;
      
      return matchesSearch && matchesCategory && matchesPriority && matchesStage;
    });

    // Update counts
    document.getElementById("todo-count").textContent = tasks.filter(t => t.stage === "todo").length;
    document.getElementById("completed-count").textContent = tasks.filter(t => t.stage === "completed").length;
    document.getElementById("archived-count").textContent = tasks.filter(t => t.stage === "archived").length;

    if (filteredTasks.length === 0) {
      taskList.innerHTML = `
        <div class="empty-state">
          <h3>No tasks found</h3>
          <p>${searchTerm || selectedCategory || selectedPriority ? 'Try adjusting your search or filters.' : 'Add your first task above!'}</p>
        </div>
      `;
    } else {
      taskList.innerHTML = filteredTasks.map(task => {
        const dueDateStatus = getDueDateStatus(task.dueDate, task.stage);
        const subtasksHtml = task.subtasks && task.subtasks.length > 0 ? `
          <div class="subtasks-display">
            <small>Subtasks: ${task.completedSubtasks}/${task.subtasks.length} completed</small>
            ${task.subtasks.map(subtask => `
              <div class="subtask-display-item ${subtask.completed ? 'completed' : ''}">
                ${subtask.completed ? '✅' : '⭕'} ${subtask.text}
              </div>
            `).join('')}
          </div>
        ` : '';

        const timeInfo = task.timeEstimate ? `
          <div class="time-info">
            <span>⏱️ Estimated: ${task.timeEstimate} min</span>
            ${task.timeSpent ? `<span>⏰ Spent: ${task.timeSpent} min</span>` : ''}
          </div>
        ` : '';

        return `
          <div class="task-card ${task.priority}-priority" data-id="${task.id}">
            <div class="task-meta">
              <span class="task-category" data-category="${task.category}">
                ${getCategoryIcon(task.category)} ${task.category}
              </span>
              <span class="task-priority ${task.priority}">
                ${getPriorityIcon(task.priority)} ${task.priority}
              </span>
              <span class="due-date ${dueDateStatus.class}">
                📅 ${formatDueDate(task.dueDate)} ${dueDateStatus.text}
              </span>
            </div>
            <div class="task-details">
              <p>${task.title}</p>
              <small class="timestamp">Created: ${task.timestamp}</small>
              ${subtasksHtml}
              ${timeInfo}
            </div>
            <div class="task-actions">
              ${task.stage === "todo" ? `
                <button class="complete-btn" onclick="completeTask(${task.id})">✅ Complete</button>
                <button class="archive-btn" onclick="archiveTask(${task.id})">📁 Archive</button>
              ` : task.stage === "completed" ? `
                <button class="move-btn" onclick="moveTask(${task.id}, 'todo')">🔄 Move to Todo</button>
                <button class="archive-btn" onclick="archiveTask(${task.id})">📁 Archive</button>
              ` : `
                <button class="move-btn" onclick="moveTask(${task.id}, 'todo')">🔄 Restore</button>
                <button class="delete-btn" onclick="deleteTask(${task.id})">🗑️ Delete</button>
              `}
            </div>
          </div>
        `;
      }).join('');
    }

    updateStatistics();
  }

  // Task Management Functions
  window.completeTask = function(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.stage = "completed";
      task.timestamp = new Date().toLocaleString();
      task.completedAt = new Date().toISOString();
      updateLocalStorage();
      renderTasks();
      updateStreak();
      updateAnalytics();
      updateWeeklyGoalDisplay();
      updateUpcomingDeadlinesDisplay();
      
      // Check if weekly goal is achieved
      const weeklyGoal = parseInt(localStorage.getItem('taskflowGoal') || '7');
      const today = new Date();
      const weekStart = getWeekStart(today);
      const completedThisWeek = tasks.filter(t => 
        t.stage === 'completed' && 
        t.completedAt && 
        new Date(t.completedAt) >= weekStart
      ).length;
      
      if (completedThisWeek >= weeklyGoal) {
        showNotification(`🏅 Weekly goal achieved! You completed ${completedThisWeek} tasks this week!`);
      } else {
        showNotification(`Task completed! 🎉 (${completedThisWeek}/${weeklyGoal} weekly goal)`);
      }
    }
  };

  window.archiveTask = function(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.stage = "archived";
      task.timestamp = new Date().toLocaleString();
      updateLocalStorage();
      renderTasks();
      updateAnalytics(); // Update analytics when task is archived
      
      // Update counts immediately
      updateWeeklyGoalDisplay();
      updateUpcomingDeadlinesDisplay();
      
      showNotification("Task archived! 📁");
    }
  };

  window.moveTask = function(taskId, newStage) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.stage = newStage;
      task.timestamp = new Date().toLocaleString();
      
      // Clear completedAt if moving away from completed stage
      if (newStage !== 'completed') {
        task.completedAt = null;
      } else if (!task.completedAt) {
        // Set completedAt if moving to completed stage
        task.completedAt = new Date().toISOString();
      }
      
      updateLocalStorage();
      renderTasks();
      updateAnalytics(); // Update analytics when task is moved
      
      // Update counts immediately
      updateWeeklyGoalDisplay();
      updateUpcomingDeadlinesDisplay();
      
      showNotification(`Task moved to ${newStage}! 📋`);
    }
  };

  window.deleteTask = function(taskId) {
    if (confirm("Are you sure you want to delete this task?")) {
      tasks = tasks.filter(t => t.id !== taskId);
      updateLocalStorage();
      renderTasks();
      updateAnalytics(); // Update analytics when task is deleted
      
      // Update counts immediately
      updateWeeklyGoalDisplay();
      updateUpcomingDeadlinesDisplay();
      
      showNotification("Task deleted! 🗑️");
    }
  };

  function startTaskTimer(taskId) {
    if (currentTaskTimer) {
      clearInterval(currentTaskTimer);
    }
    
    activeTaskId = taskId;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.timeSpent = task.timeSpent || 0;
      currentTaskTimer = setInterval(() => {
        task.timeSpent++;
        updateLocalStorage();
        renderTasks();
      }, 60000); // Update every minute
    }
  }

  function stopTaskTimer() {
    if (currentTaskTimer) {
      clearInterval(currentTaskTimer);
      currentTaskTimer = null;
      activeTaskId = null;
    }
  }

  function updateStreak() {
    const today = new Date().toDateString();
    const streakData = JSON.parse(localStorage.getItem(userStreakKey)) || { streak: 0, lastCompleted: null };
    
    if (streakData.lastCompleted !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      
      if (streakData.lastCompleted === yesterdayStr) {
        streakData.streak++;
      } else {
        streakData.streak = 1;
      }
      
      streakData.lastCompleted = today;
      localStorage.setItem(userStreakKey, JSON.stringify(streakData));
    }
  }

  function updateStatistics() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.stage === "completed").length;
    const overdueTasks = tasks.filter(t => {
      if (t.stage !== "todo") return false;
      const dueDate = new Date(t.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDate < today;
    }).length;
    
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const streakData = JSON.parse(localStorage.getItem(userStreakKey)) || { streak: 0 };
    
    document.getElementById("totalTasks").textContent = totalTasks;
    document.getElementById("overdueTasks").textContent = overdueTasks;
    document.getElementById("completionRate").textContent = `${completionRate}%`;
    document.getElementById("streakCount").textContent = streakData.streak;
  }

  function getDueDateStatus(dueDate, stage) {
    if (stage === "completed") {
      return { text: "(Completed)", class: "completed" };
    }
    
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: "(Overdue)", class: "overdue" };
    } else if (diffDays === 0) {
      return { text: "(Due today)", class: "today" };
    } else if (diffDays === 1) {
      return { text: "(Due tomorrow)", class: "upcoming" };
    } else {
      return { text: `(Due in ${diffDays} days)`, class: "upcoming" };
    }
  }

  function formatDueDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  }

  function setupReminders() {
    // Clear existing reminders
    reminderTimeouts.forEach(timeout => clearTimeout(timeout));
    reminderTimeouts.clear();
    
    const now = new Date();
    
    tasks.forEach(task => {
      if (task.reminderTime && task.stage === "todo") {
        const dueDate = new Date(task.dueDate);
        const reminderTime = new Date(dueDate.getTime() - (task.reminderTime * 60 * 1000));
        
        if (reminderTime > now) {
          const timeout = setTimeout(() => {
            showReminderNotification(task);
          }, reminderTime.getTime() - now.getTime());
          
          reminderTimeouts.set(task.id, timeout);
        }
      }
    });
  }

  function handleRecurringTasks() {
    const today = new Date().toISOString().split('T')[0];
    
    tasks.forEach(task => {
      if (task.recurringType && task.stage === "completed") {
        const lastCompleted = new Date(task.timestamp);
        const lastCompletedDate = lastCompleted.toISOString().split('T')[0];
        
        if (shouldRecurTask(task, lastCompletedDate, today)) {
          createNextRecurringTask(task);
        }
      }
    });
  }

  function shouldRecurTask(task, lastCompleted, today) {
    const lastCompletedDate = new Date(lastCompleted);
    const todayDate = new Date(today);
    const diffTime = todayDate - lastCompletedDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    switch (task.recurringType) {
      case "daily":
        return diffDays >= 1;
      case "weekly":
        return diffDays >= 7;
      case "monthly":
        return diffDays >= 30;
      case "yearly":
        return diffDays >= 365;
      default:
        return false;
    }
  }

  function createNextRecurringTask(originalTask) {
    const newTask = {
      ...originalTask,
      id: Date.now(),
      stage: "todo",
      timestamp: new Date().toLocaleString(),
      createdAt: new Date().toISOString()
    };
    
    // Calculate next due date
    const originalDueDate = new Date(originalTask.dueDate);
    let nextDueDate = new Date(originalDueDate);
    
    switch (originalTask.recurringType) {
      case "daily":
        nextDueDate.setDate(nextDueDate.getDate() + 1);
        break;
      case "weekly":
        nextDueDate.setDate(nextDueDate.getDate() + 7);
        break;
      case "monthly":
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        break;
      case "yearly":
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        break;
    }
    
    newTask.dueDate = nextDueDate.toISOString().split('T')[0];
    tasks.push(newTask);
    updateLocalStorage();
    showNotification(`Recurring task "${originalTask.title}" created for ${newTask.dueDate}`);
  }

  function showReminderNotification(task) {
    const message = `Reminder: "${task.title}" is due ${getDueDateStatus(task.dueDate, task.stage).text.toLowerCase()}`;
    showNotification(message);
    
    // Also show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('TaskFlow Reminder', {
        body: message,
        icon: '/favicon.ico'
      });
    }
  }

  // Request notification permission on page load
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  function updateLocalStorage() {
    localStorage.setItem(userTasksKey, JSON.stringify(tasks));
  }

  function showNotification(msg) {
    notification.textContent = msg;
    notification.classList.remove("hidden");
    setTimeout(() => {
      notification.classList.add("hidden");
    }, 3000);
  }

  // Utility Functions
  function getCategoryIcon(category) {
    const icons = {
      work: "💼",
      personal: "👤",
      health: "🏥",
      learning: "📚",
      shopping: "🛒",
      other: "📌"
    };
    return icons[category] || "📌";
  }

  function getPriorityIcon(priority) {
    const icons = {
      high: "🔴",
      medium: "🟡",
      low: "🟢"
    };
    return icons[priority] || "🟡";
  }

  // Check for recurring tasks every day
  setInterval(handleRecurringTasks, 24 * 60 * 60 * 1000); // Check every 24 hours
  handleRecurringTasks(); // Check on page load

  // Analytics Functions
  function initializeAnalytics() {
    updateAnalytics();
  }

  function updateAnalytics() {
    updateCharts();
    updateInsights();
  }

  function updateCharts() {
    // Weekly Progress Chart
    updateWeeklyChart();
    
    // Category Distribution Chart
    updateCategoryChart();
    
    // Priority Distribution Chart
    updatePriorityChart();
  }

  function updateWeeklyChart() {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;

    const today = new Date();
    const days = [];
    const completedCounts = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      const count = tasks.filter(t => 
        t.stage === 'completed' && 
        t.completedAt && 
        new Date(t.completedAt).toDateString() === d.toDateString()
      ).length;
      completedCounts.push(count);
    }

    if (weeklyChart) weeklyChart.destroy();

    weeklyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [{
          label: 'Completed Tasks',
          data: completedCounts,
          backgroundColor: 'rgba(102, 126, 234, 0.8)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#a0a7c7',
              stepSize: 1
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#a0a7c7'
            }
          }
        }
      }
    });
  }

  function updateCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    const categories = ['work', 'personal', 'health', 'learning', 'shopping', 'other'];
    const categoryLabels = ['Work', 'Personal', 'Health', 'Learning', 'Shopping', 'Other'];
    const categoryColors = [
      'rgba(59, 130, 246, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(139, 92, 246, 0.8)',
      'rgba(168, 85, 247, 0.8)'
    ];

    const categoryCounts = categories.map(cat => 
      tasks.filter(t => t.category === cat).length
    );

    if (categoryChart) categoryChart.destroy();

    categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categoryLabels,
        datasets: [{
          data: categoryCounts,
          backgroundColor: categoryColors,
          borderWidth: 3,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#a0a7c7',
              padding: 15,
              usePointStyle: true
            }
          }
        },
        cutout: '60%'
      }
    });
  }

  function updatePriorityChart() {
    const ctx = document.getElementById('priorityChart');
    if (!ctx) return;

    const priorities = ['high', 'medium', 'low'];
    const priorityLabels = ['High', 'Medium', 'Low'];
    const priorityColors = [
      'rgba(239, 68, 68, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(34, 197, 94, 0.8)'
    ];

    const priorityCounts = priorities.map(priority => 
      tasks.filter(t => t.priority === priority).length
    );

    if (priorityChart) priorityChart.destroy();

    priorityChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: priorityLabels,
        datasets: [{
          data: priorityCounts,
          backgroundColor: priorityColors,
          borderWidth: 3,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#a0a7c7',
              padding: 15,
              usePointStyle: true
            }
          }
        }
      }
    });
  }

  function updateInsights() {
    // Weekly Goal Progress
    updateWeeklyGoalDisplay();
    
    // Add click handler to goal text for setting weekly goal
    const weeklyGoal = parseInt(localStorage.getItem('taskflowGoal') || '7');
    goalText.onclick = function() {
      const newGoal = prompt(`Set your weekly goal (currently ${weeklyGoal}):`, weeklyGoal);
      if (newGoal && !isNaN(newGoal) && parseInt(newGoal) > 0) {
        localStorage.setItem('taskflowGoal', parseInt(newGoal));
        updateWeeklyGoalDisplay();
        showNotification(`Weekly goal updated to ${newGoal} tasks! 🎯`);
      }
    };
    goalText.style.cursor = 'pointer';
    goalText.title = 'Click to set weekly goal';

    // Current Streak
    const streakData = JSON.parse(localStorage.getItem(userStreakKey)) || { streak: 0 };
    streakText.textContent = `${streakData.streak} days`;

    // Productivity Score
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.stage === 'completed').length;
    const productivityPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    productivityScore.textContent = `${productivityPercentage}%`;

    // Upcoming Deadlines
    updateUpcomingDeadlinesDisplay();
    
    // Add click handler to upcoming deadlines for more details
    const today = new Date();
    const upcomingTasks = tasks.filter(t => 
      t.stage === 'todo' && 
      t.dueDate && 
      new Date(t.dueDate) >= today
    ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    const upcoming = upcomingTasks.length;
    
    upcomingDeadlines.onclick = function() {
      if (upcoming > 0) {
        const taskList = upcomingTasks.slice(0, 5).map(task => {
          const dueDate = new Date(task.dueDate);
          const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
          const dayText = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`;
          return `• ${task.title} (${dayText})`;
        }).join('\n');
        
        const remaining = upcoming > 5 ? `\n... and ${upcoming - 5} more tasks` : '';
        alert(`Upcoming Deadlines:\n\n${taskList}${remaining}`);
      }
    };
    upcomingDeadlines.style.cursor = upcoming > 0 ? 'pointer' : 'default';
    upcomingDeadlines.title = upcoming > 0 ? 'Click to see details' : '';
    
    // Add urgent deadline warning if any tasks are due today or soon
    if (upcoming > 0) {
      const nextTask = upcomingTasks[0];
      const dueDate = new Date(nextTask.dueDate);
      const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 3) {
        const deadlineElement = document.createElement('div');
        deadlineElement.className = 'urgent-deadline';
        deadlineElement.innerHTML = `
          <span class="deadline-icon">${diffDays === 0 ? '⚠️' : '⏳'}</span>
          <span class="deadline-text">${nextTask.title} is ${diffDays === 0 ? 'due TODAY!' : `due in ${diffDays} day${diffDays === 1 ? '' : 's'}`}</span>
        `;
        
        // Add or update the deadline warning
        const existingWarning = document.querySelector('.urgent-deadline');
        if (existingWarning) {
          existingWarning.replaceWith(deadlineElement);
        } else {
          // Insert after the upcomingDeadlines element or wherever appropriate
          upcomingDeadlines.parentNode.insertBefore(deadlineElement, upcomingDeadlines.nextSibling);
        }
      }
    } else {
      // Remove any existing warning if no upcoming deadlines
      const existingWarning = document.querySelector('.urgent-deadline');
      if (existingWarning) existingWarning.remove();
    }
  }

  // Helper: Get start of the week (Monday)
  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 (Sun) - 6 (Sat)
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function updateWeeklyGoalDisplay() {
    const weeklyGoal = parseInt(localStorage.getItem('taskflowGoal') || '7');
    const today = new Date();
    const weekStart = getWeekStart(today);
    
    const completedThisWeek = tasks.filter(t => 
      t.stage === 'completed' && 
      t.completedAt && 
      new Date(t.completedAt) >= weekStart
    ).length;
    
    const goalPercentage = Math.min(100, (completedThisWeek / weeklyGoal) * 100);
    goalProgressBar.style.width = `${goalPercentage}%`;
    goalText.textContent = `${completedThisWeek}/${weeklyGoal} tasks completed`;
    
    // Show badge if goal achieved
    if (completedThisWeek >= weeklyGoal) {
      goalText.innerHTML += ` <span class="goal-badge">🏅 Goal Achieved!</span>`;
    }
  }

  function updateUpcomingDeadlinesDisplay() {
    const today = new Date();
    const upcomingTasks = tasks.filter(t => 
      t.stage === 'todo' && 
      t.dueDate && 
      new Date(t.dueDate) >= today
    ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    const upcoming = upcomingTasks.length;
    
    if (upcoming === 0) {
      upcomingDeadlines.textContent = "No upcoming deadlines";
    } else if (upcoming === 1) {
      const task = upcomingTasks[0];
      const dueDate = new Date(task.dueDate);
      const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        upcomingDeadlines.textContent = "1 task due today";
      } else if (diffDays === 1) {
        upcomingDeadlines.textContent = "1 task due tomorrow";
      } else {
        upcomingDeadlines.textContent = `1 task due in ${diffDays} days`;
      }
    } else {
      const nextTask = upcomingTasks[0];
      const dueDate = new Date(nextTask.dueDate);
      const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        upcomingDeadlines.textContent = `${upcoming} tasks due (1 today)`;
      } else if (diffDays === 1) {
        upcomingDeadlines.textContent = `${upcoming} tasks due (1 tomorrow)`;
      } else {
        upcomingDeadlines.textContent = `${upcoming} tasks due (next in ${diffDays} days)`;
      }
    }
  }
});