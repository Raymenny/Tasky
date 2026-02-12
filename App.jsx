import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [darkMode, setDarkMode] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [background, setBackground] = useState('city');
  const [showHelper, setShowHelper] = useState(false);
  const [showThemeCreator, setShowThemeCreator] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [customTheme, setCustomTheme] = useState(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const [helperMessage, setHelperMessage] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [notificationSupported, setNotificationSupported] = useState(false);
  
  const recognitionRef = useRef(null);
  
  const [userStats, setUserStats] = useState({
    xp: 0,
    level: 1,
    streak: 0,
    lastCompletedDate: null,
    totalCompleted: 0,
    achievements: [],
    taskHistory: [],
    pomodoroSessions: 0,
    dailyGoal: 5,
    dailyCompleted: 0,
    weeklyProgress: []
  });

  const achievements = [
    { id: 'first_task', name: 'Getting Started', desc: 'Complete your first task', icon: '🎯', requirement: 1 },
    { id: 'streak_3', name: 'On Fire', desc: '3 day streak', icon: '🔥', requirement: 3 },
    { id: 'streak_7', name: 'Unstoppable', desc: '7 day streak', icon: '⚡', requirement: 7 },
    { id: 'tasks_10', name: 'Task Master', desc: 'Complete 10 tasks', icon: '💪', requirement: 10 },
    { id: 'tasks_50', name: 'Productivity King', desc: 'Complete 50 tasks', icon: '👑', requirement: 50 },
    { id: 'level_5', name: 'Level 5 Reached', desc: 'Reach level 5', icon: '⭐', requirement: 5 },
    { id: 'perfect_day', name: 'Perfect Day', desc: 'Complete all tasks in one day', icon: '✨', requirement: 1 },
    { id: 'voice_user', name: 'Voice Commander', desc: 'Use voice commands', icon: '🎙️', requirement: 1 },
    { id: 'theme_creator', name: 'Artist', desc: 'Create a custom theme', icon: '🎨', requirement: 1 },
    { id: 'pomodoro_master', name: 'Focus Master', desc: 'Complete 10 Pomodoro sessions', icon: '⏱️', requirement: 10 },
    { id: 'early_bird', name: 'Early Bird', desc: 'Complete 5 tasks before 9 AM', icon: '🌅', requirement: 5 },
    { id: 'night_owl', name: 'Night Owl', desc: 'Complete 5 tasks after 10 PM', icon: '🦉', requirement: 5 }
  ];

  useEffect(() => {
    // Detect mobile
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Check voice support
    const voiceAvailable = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setVoiceSupported(voiceAvailable);
    
    // Check notification support
    const notifAvailable = 'Notification' in window;
    setNotificationSupported(notifAvailable);
    
    const stored = localStorage.getItem('todos');
    const darkStored = localStorage.getItem('darkMode');
    const statsStored = localStorage.getItem('userStats');
    const bgStored = localStorage.getItem('background');
    const themeStored = localStorage.getItem('customTheme');
    
    if (stored) setTodos(JSON.parse(stored));
    if (darkStored) setDarkMode(JSON.parse(darkStored));
    if (statsStored) setUserStats(JSON.parse(statsStored));
    if (bgStored) setBackground(bgStored);
    if (themeStored) {
      const theme = JSON.parse(themeStored);
      setCustomTheme(theme);
      applyCustomTheme(theme);
    }
    
    requestNotificationPermission();
    if (voiceAvailable) initializeVoiceRecognition();
    registerServiceWorker();
    checkDailyReset();
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
    checkForNewAchievements();
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('userStats', JSON.stringify(userStats));
  }, [userStats]);

  useEffect(() => {
    localStorage.setItem('background', background);
  }, [background]);

  useEffect(() => {
    if (showHelper && !helperMessage) {
      setHelperMessage(generateHelperMessage());
    }
  }, [showHelper]);

  const checkDailyReset = () => {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem('lastDailyReset');
    
    if (lastReset !== today) {
      setUserStats(prev => ({ ...prev, dailyCompleted: 0 }));
      localStorage.setItem('lastDailyReset', today);
    }
  };

  const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  };

  const applyCustomTheme = (theme) => {
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty('--custom-primary', theme.primary);
    root.style.setProperty('--custom-secondary', theme.secondary);
    root.style.setProperty('--custom-accent', theme.accent);
  };

  const initializeVoiceRecognition = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;
      
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        processVoiceCommand(transcript);
        setIsListening(false);
        setTimeout(() => setVoiceTranscript(''), 3000);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        setVoiceTranscript('');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } catch (e) {
      console.log('Voice recognition not available');
    }
  };

  const toggleVoiceListening = () => {
    if (!voiceSupported) {
      showMobileAlert('Voice commands require Chrome on desktop or Android');
      return;
    }
    
    if (!recognitionRef.current) {
      showMobileAlert('Voice recognition not available on this device');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setVoiceTranscript('Listening...');
        recognitionRef.current.start();
        setIsListening(true);
        
        if (!userStats.achievements.includes('voice_user')) {
          unlockAchievement('voice_user');
        }
      } catch (e) {
        showMobileAlert('Voice command error - try again');
        setIsListening(false);
      }
    }
  };

  const processVoiceCommand = (transcript) => {
    if (transcript.includes('add task') || transcript.includes('add') || transcript.includes('create task')) {
      const taskText = transcript.replace(/add task|add|create task|hey tasky|tasky/gi, '').trim();
      if (taskText) {
        const newTodo = {
          id: Date.now(),
          task: taskText.charAt(0).toUpperCase() + taskText.slice(1),
          done: false,
          priority: 'medium',
          dueDate: null,
          createdAt: new Date().toISOString()
        };
        setTodos([newTodo, ...todos]);
        playSound('add');
        addXP(5);
        setVoiceTranscript(`✓ Added: ${taskText}`);
        
        if (isMobile) {
          navigator.vibrate && navigator.vibrate(100);
        }
      }
    } else if (transcript.includes('complete all') || transcript.includes('mark all')) {
      todos.forEach(todo => {
        if (!todo.done) handleToggle(todo.id);
      });
      setVoiceTranscript('✓ Completed all tasks!');
    } else if (transcript.includes('dashboard') || transcript.includes('show stats')) {
      setShowDashboard(true);
      setVoiceTranscript('✓ Opening dashboard');
    } else if (transcript.includes('dark mode') || transcript.includes('light mode')) {
      setDarkMode(!darkMode);
      setVoiceTranscript(`✓ ${!darkMode ? 'Dark' : 'Light'} mode`);
    } else {
      setVoiceTranscript(`❌ Try: "add task [name]"`);
    }
  };

  const generateHelperMessage = () => {
    const messages = [
      { icon: '👋', text: "Hey! I'm Tasky Helper. Ready to crush some goals?" },
      { icon: '🎯', text: "You're doing great! Every task is progress!" },
      { icon: '⚡', text: isMobile ? "Tap the microphone to try voice commands on Chrome!" : "Try voice commands! Click 🎙️ and say 'add task...'" },
      { icon: '🔥', text: `${userStats.streak} day streak! Keep going!` },
      { icon: '✨', text: "Small progress is still progress!" },
      { icon: '🚀', text: `Level ${userStats.level}! You're unstoppable!` },
      { icon: '💪', text: "Break big tasks into smaller ones!" },
      { icon: '🎊', text: `${userStats.totalCompleted} tasks done! Incredible!` }
    ];
    
    if (userStats.streak >= 7) return messages[3];
    if (userStats.totalCompleted >= 10) return messages[7];
    if (userStats.level >= 5) return messages[5];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getAISuggestions = () => {
    const now = new Date();
    const hour = now.getHours();
    const activeTasks = todos.filter(t => !t.done);
    
    const suggestions = [];

    if (hour >= 6 && hour < 12) {
      suggestions.push({
        icon: '☀️',
        title: 'Morning Power Hour',
        message: 'You complete 40% more tasks in mornings! Tackle high-priority items now.',
        type: 'productivity'
      });
    } else if (hour >= 14 && hour < 16) {
      suggestions.push({
        icon: '😴',
        title: 'Post-Lunch Dip',
        message: 'Energy dips now. Try easier tasks or take a quick break!',
        type: 'energy'
      });
    } else if (hour >= 20) {
      suggestions.push({
        icon: '🌙',
        title: 'Evening Wind-Down',
        message: 'Plan tomorrow\'s tasks. Boosts next-day productivity by 25%!',
        type: 'planning'
      });
    }

    const highPriorityCount = activeTasks.filter(t => t.priority === 'high').length;
    if (highPriorityCount > 3) {
      suggestions.push({
        icon: '🎯',
        title: 'Priority Overload',
        message: `${highPriorityCount} high-priority tasks. Focus on top 3 to avoid burnout.`,
        type: 'focus'
      });
    }

    if (activeTasks.length > 10) {
      suggestions.push({
        icon: '📊',
        title: 'Task Overflow',
        message: 'Break larger tasks into smaller steps. Complete 60% faster!',
        type: 'breakdown'
      });
    }

    const overdueTasks = activeTasks.filter(t => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < now;
    });

    if (overdueTasks.length > 0) {
      suggestions.push({
        icon: '⚠️',
        title: 'Overdue Alert',
        message: `${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} overdue. Reschedule or complete!`,
        type: 'urgent'
      });
    }

    if (userStats.streak >= 3) {
      suggestions.push({
        icon: '🔥',
        title: 'Streak Protection',
        message: `${userStats.streak}-day streak! Complete 1 task today to keep it alive.`,
        type: 'streak'
      });
    }

    const dailyProgress = (userStats.dailyCompleted / userStats.dailyGoal) * 100;
    if (dailyProgress >= 80 && dailyProgress < 100) {
      suggestions.push({
        icon: '🎯',
        title: 'Almost There!',
        message: `You're ${Math.round(dailyProgress)}% to your daily goal. Just ${userStats.dailyGoal - userStats.dailyCompleted} more!`,
        type: 'motivation'
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        icon: '✨',
        title: 'You\'re Crushing It!',
        message: 'Everything looks great! Keep up the amazing work.',
        type: 'praise'
      });
    }

    return suggestions;
  };

  const requestNotificationPermission = async () => {
    if (!notificationSupported) return;
    
    try {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          showMobileAlert('Notifications enabled! 🔔');
        }
      }
    } catch (e) {
      console.log('Notification permission error');
    }
  };

  const showMobileAlert = (message) => {
    if (isMobile) {
      // Create custom in-app notification for mobile
      const alert = document.createElement('div');
      alert.className = 'mobile-alert';
      alert.textContent = message;
      document.body.appendChild(alert);
      
      setTimeout(() => {
        alert.classList.add('show');
      }, 10);
      
      setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 300);
      }, 3000);
      
      navigator.vibrate && navigator.vibrate(50);
    } else {
      alert(message);
    }
  };

  const playSound = (type) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (type === 'complete') {
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } else if (type === 'add') {
        oscillator.frequency.value = 400;
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else if (type === 'delete') {
        oscillator.frequency.value = 200;
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
      } else if (type === 'levelup') {
        oscillator.frequency.value = 600;
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.8);
      }
      
      if (isMobile) {
        navigator.vibrate && navigator.vibrate([50]);
      }
    } catch (e) {}
  };

  const triggerConfetti = () => {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#feca57', '#ff6b6b'];
    const confettiCount = isMobile ? 80 : 150;
    
    for (let i = 0; i < confettiCount; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 4000);
      }, i * 10);
    }
    
    if (isMobile) {
      navigator.vibrate && navigator.vibrate([100, 50, 100, 50, 100]);
    }
  };

  const addXP = (amount) => {
    setUserStats(prev => {
      const newXP = prev.xp + amount;
      const newLevel = Math.floor(newXP / 100) + 1;
      const leveledUp = newLevel > prev.level;
      
      if (leveledUp) {
        showNotification('Level Up!', `You reached level ${newLevel}! 🎉`);
        triggerConfetti();
        playSound('levelup');
      }
      
      return { ...prev, xp: newXP, level: newLevel };
    });
  };

  const updateStreak = () => {
    const today = new Date().toDateString();
    const lastDate = userStats.lastCompletedDate;
    
    if (lastDate) {
      const last = new Date(lastDate);
      const dayDiff = Math.floor((new Date(today) - last) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        const newStreak = userStats.streak + 1;
        setUserStats(prev => ({ ...prev, streak: newStreak, lastCompletedDate: today }));
        if (newStreak % 7 === 0) {
          showNotification('Streak Milestone!', `${newStreak} days in a row! 🔥`);
        }
      } else if (dayDiff > 1) {
        setUserStats(prev => ({ ...prev, streak: 1, lastCompletedDate: today }));
      }
    } else {
      setUserStats(prev => ({ ...prev, streak: 1, lastCompletedDate: today }));
    }
  };

  const unlockAchievement = (achId) => {
    const achievement = achievements.find(a => a.id === achId);
    if (!achievement) return;
    
    setUserStats(prev => ({
      ...prev,
      achievements: [...prev.achievements, achId]
    }));
    showNotification('Achievement Unlocked!', `${achievement.icon} ${achievement.name}`);
    triggerConfetti();
    addXP(50);
  };

  const checkForNewAchievements = () => {
    achievements.forEach(ach => {
      if (userStats.achievements.includes(ach.id)) return;
      
      let unlocked = false;
      
      if (ach.id === 'first_task' && userStats.totalCompleted >= 1) unlocked = true;
      if (ach.id === 'tasks_10' && userStats.totalCompleted >= 10) unlocked = true;
      if (ach.id === 'tasks_50' && userStats.totalCompleted >= 50) unlocked = true;
      if (ach.id === 'streak_3' && userStats.streak >= 3) unlocked = true;
      if (ach.id === 'streak_7' && userStats.streak >= 7) unlocked = true;
      if (ach.id === 'level_5' && userStats.level >= 5) unlocked = true;
      if (ach.id === 'perfect_day' && todos.length > 0 && todos.every(t => t.done)) unlocked = true;
      if (ach.id === 'pomodoro_master' && userStats.pomodoroSessions >= 10) unlocked = true;
      
      const earlyBirdTasks = (userStats.taskHistory || []).filter(t => {
        const hour = new Date(t.completedAt).getHours();
        return hour < 9;
      }).length;
      if (ach.id === 'early_bird' && earlyBirdTasks >= 5) unlocked = true;
      
      const nightOwlTasks = (userStats.taskHistory || []).filter(t => {
        const hour = new Date(t.completedAt).getHours();
        return hour >= 22;
      }).length;
      if (ach.id === 'night_owl' && nightOwlTasks >= 5) unlocked = true;
      
      if (unlocked) {
        unlockAchievement(ach.id);
      }
    });
  };

  const showNotification = (title, body) => {
    // Try native notification first
    if (notificationSupported && Notification.permission === 'granted') {
      try {
        new Notification(title, { 
          body, 
          icon: '/icon.png',
          badge: '/icon.png',
          vibrate: [200, 100, 200],
          tag: 'tasky-notification'
        });
      } catch (e) {
        // Fallback to in-app notification
        showMobileAlert(`${title}: ${body}`);
      }
    } else {
      // In-app notification for mobile
      showMobileAlert(`${title}: ${body}`);
    }
  };

  const handleAdd = () => {
    if (!input.trim()) return;
    
    const newTodo = {
      id: Date.now(),
      task: input,
      done: false,
      priority: priority,
      dueDate: dueDate || null,
      createdAt: new Date().toISOString()
    };
    
    setTodos([newTodo, ...todos]);
    setInput('');
    setDueDate('');
    setPriority('medium');
    setShowAddPanel(false);
    playSound('add');
    addXP(5);
  };

  const handleToggle = (id) => {
    const todo = todos.find(t => t.id === id);
    const wasNotDone = !todo.done;
    
    setTodos(todos.map(todo => 
      todo.id === id ? {...todo, done: !todo.done} : todo
    ));
    
    if (wasNotDone) {
      playSound('complete');
      addXP(10);
      updateStreak();
      
      const completionTime = new Date();
      const completionHour = completionTime.getHours();
      
      setUserStats(prev => ({
        ...prev,
        totalCompleted: prev.totalCompleted + 1,
        dailyCompleted: prev.dailyCompleted + 1,
        taskHistory: [...(prev.taskHistory || []), {
          completedAt: completionTime.toISOString(),
          hour: completionHour,
          priority: todo.priority
        }]
      }));
      
      const allDone = todos.every(t => t.id === id ? true : t.done);
      if (allDone && todos.length > 1) {
        triggerConfetti();
        showNotification('Amazing!', 'All tasks completed! 🎉');
      }
      
      if ((userStats.dailyCompleted + 1) >= userStats.dailyGoal) {
        showNotification('Daily Goal Reached!', `🎯 You completed ${userStats.dailyGoal} tasks today!`);
      }
    }
  };

  const handleDelete = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
    playSound('delete');
  };

  const filteredTodos = () => {
    let filtered = todos;
    switch(currentFilter) {
      case 'active':
        filtered = todos.filter(t => !t.done);
        break;
      case 'done':
        filtered = todos.filter(t => t.done);
        break;
      case 'high':
        filtered = todos.filter(t => t.priority === 'high' && !t.done);
        break;
    }
    return filtered.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const getTimeRemaining = (dueDate) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (diff < 0) return 'Overdue';
    if (days > 0) return `${days}d left`;
    if (hours > 0) return `${hours}h left`;
    return 'Due soon';
  };

  const remainingTasks = todos.filter(t => !t.done).length;
  const completionRate = todos.length > 0 
    ? Math.round((todos.filter(t => t.done).length / todos.length) * 100) 
    : 0;
  
  const xpToNextLevel = 100 - (userStats.xp % 100);
  const levelProgress = (userStats.xp % 100);
  const dailyProgress = Math.min(100, (userStats.dailyCompleted / userStats.dailyGoal) * 100);

  return (
    <div className={`app ${darkMode ? 'dark' : ''} ${isMobile ? 'mobile' : ''} bg-${background}`}>
      {showDashboard ? (
        <Dashboard 
          userStats={userStats}
          todos={todos}
          achievements={achievements}
          onClose={() => setShowDashboard(false)}
          darkMode={darkMode}
          isMobile={isMobile}
        />
      ) : showThemeCreator ? (
        <ThemeCreator
          onClose={() => setShowThemeCreator(false)}
          onSave={(theme) => {
            setCustomTheme(theme);
            applyCustomTheme(theme);
            localStorage.setItem('customTheme', JSON.stringify(theme));
            setShowThemeCreator(false);
            if (!userStats.achievements.includes('theme_creator')) {
              unlockAchievement('theme_creator');
            }
          }}
          currentTheme={customTheme}
          darkMode={darkMode}
          isMobile={isMobile}
        />
      ) : showPomodoro ? (
        <PomodoroTimer
          onClose={() => setShowPomodoro(false)}
          onComplete={() => {
            setUserStats(prev => ({
              ...prev,
              pomodoroSessions: prev.pomodoroSessions + 1
            }));
            addXP(25);
            showNotification('Pomodoro Complete!', 'Great focus session! 🎉');
          }}
          darkMode={darkMode}
          isMobile={isMobile}
        />
      ) : showAdvancedAnalytics ? (
        <AdvancedAnalytics
          userStats={userStats}
          todos={todos}
          onClose={() => setShowAdvancedAnalytics(false)}
          darkMode={darkMode}
          isMobile={isMobile}
        />
      ) : (
        <>
          {showHelper && helperMessage && (
            <div className="tasky-helper">
              <div className="helper-content">
                <div className="helper-avatar">🤖</div>
                <div className="helper-message">
                  <div className="helper-name">Tasky Helper</div>
                  <div className="helper-text">
                    {helperMessage.icon} {helperMessage.text}
                  </div>
                </div>
                <button className="helper-close" onClick={() => {
                  setShowHelper(false);
                  setHelperMessage(null);
                }}>×</button>
              </div>
            </div>
          )}

          {showAISuggestions && (
            <AISuggestions
              suggestions={getAISuggestions()}
              onClose={() => setShowAISuggestions(false)}
              darkMode={darkMode}
              isMobile={isMobile}
            />
          )}

          {voiceTranscript && (
            <div className="voice-feedback">
              <span className="voice-icon">{isListening ? '🎙️' : '✓'}</span>
              {voiceTranscript}
            </div>
          )}

          {!isMobile && (
            <div className="background-selector">
              <button 
                className={background === 'city' ? 'active' : ''}
                onClick={() => setBackground('city')}
                title="City"
              >
                🏙️
              </button>
              <button 
                className={background === 'ocean' ? 'active' : ''}
                onClick={() => setBackground('ocean')}
                title="Ocean"
              >
                🌊
              </button>
              <button 
                className={background === 'space' ? 'active' : ''}
                onClick={() => setBackground('space')}
                title="Space"
              >
                🌌
              </button>
              <button 
                className={background === 'forest' ? 'active' : ''}
                onClick={() => setBackground('forest')}
                title="Forest"
              >
                🌲
              </button>
            </div>
          )}

          <div className="container" style={customTheme ? {
            background: darkMode ? '#0f3460' : 'white'
          } : {}}>
            <header style={customTheme ? {
              background: `linear-gradient(135deg, ${customTheme.primary} 0%, ${customTheme.secondary} 100%)`
            } : {}}>
              <div className="header-content">
                <div className="title-section">
                  <h1>✨ Tasky</h1>
                  <div className="level-badge">
                    Level {userStats.level}
                    {userStats.streak > 0 && <span className="streak">🔥 {userStats.streak}</span>}
                  </div>
                </div>
                <div className="header-actions">
                  {voiceSupported && (
                    <button 
                      className={`voice-btn ${isListening ? 'listening' : ''}`}
                      onClick={toggleVoiceListening}
                      title="Voice Commands"
                    >
                      🎙️
                    </button>
                  )}
                  <button 
                    className="ai-btn"
                    onClick={() => setShowAISuggestions(true)}
                    title="AI Suggestions"
                  >
                    🧠
                  </button>
                  <button 
                    className="pomodoro-btn"
                    onClick={() => setShowPomodoro(true)}
                    title="Pomodoro Timer"
                  >
                    ⏱️
                  </button>
                  {!isMobile && (
                    <button 
                      className="analytics-btn"
                      onClick={() => setShowAdvancedAnalytics(true)}
                      title="Advanced Analytics"
                    >
                      📈
                    </button>
                  )}
                  <button 
                    className="theme-btn"
                    onClick={() => setShowThemeCreator(true)}
                    title="Custom Theme"
                  >
                    🎨
                  </button>
                  <button 
                    className="helper-btn"
                    onClick={() => setShowHelper(!showHelper)}
                    title="Tasky Helper"
                  >
                    💬
                  </button>
                  <button 
                    className="dashboard-btn"
                    onClick={() => setShowDashboard(true)}
                    title="Dashboard"
                  >
                    📊
                  </button>
                  <button 
                    className="theme-toggle"
                    onClick={() => setDarkMode(!darkMode)}
                    title={darkMode ? 'Light mode' : 'Dark mode'}
                  >
                    {darkMode ? '☀️' : '🌙'}
                  </button>
                </div>
              </div>
              
              <div className="daily-goal-section">
                <div className="daily-goal-info">
                  <span>Daily Goal: {userStats.dailyCompleted} / {userStats.dailyGoal}</span>
                  <span>{Math.round(dailyProgress)}%</span>
                </div>
                <div className="daily-goal-bar">
                  <div 
                    className="daily-goal-fill"
                    style={{
                      width: `${dailyProgress}%`,
                      background: customTheme ? customTheme.accent : undefined
                    }}
                  />
                </div>
              </div>

              <div className="xp-bar">
                <div className="xp-info">
                  <span>{userStats.xp} XP</span>
                  <span>{xpToNextLevel} to level {userStats.level + 1}</span>
                </div>
                <div className="xp-progress">
                  <div 
                    className="xp-fill" 
                    style={{
                      width: `${levelProgress}%`,
                      background: customTheme ? customTheme.accent : undefined
                    }}
                  />
                </div>
              </div>

              {todos.length > 0 && (
                <div className="progress-section">
                  <div className="stats">
                    <span>{remainingTasks} active</span>
                    <span>{completionRate}% complete</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{
                        width: `${completionRate}%`,
                        background: customTheme ? customTheme.accent : undefined
                      }}
                    />
                  </div>
                </div>
              )}
            </header>

            <div className="add-section">
              <div className="quick-add">
                <input
                  type="text"
                  placeholder="What do you want to accomplish?"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  onFocus={() => setShowAddPanel(true)}
                />
                <button onClick={handleAdd} className="quick-add-btn" style={customTheme ? {
                  background: `linear-gradient(135deg, ${customTheme.primary} 0%, ${customTheme.secondary} 100%)`
                } : {}}>+</button>
              </div>
              
              {showAddPanel && (
                <div className="add-panel">
                  <div className="form-row">
                    <select 
                      value={priority} 
                      onChange={(e) => setPriority(e.target.value)}
                      className="priority-select"
                    >
                      <option value="low">🟢 Low Priority</option>
                      <option value="medium">🟡 Medium Priority</option>
                      <option value="high">🔴 High Priority</option>
                    </select>
                    <input
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="date-input"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="filter-bar">
              <button 
                className={currentFilter === 'all' ? 'active' : ''}
                onClick={() => setCurrentFilter('all')}
                style={currentFilter === 'all' && customTheme ? {
                  background: `linear-gradient(135deg, ${customTheme.primary} 0%, ${customTheme.secondary} 100%)`
                } : {}}
              >
                All
              </button>
              <button 
                className={currentFilter === 'active' ? 'active' : ''}
                onClick={() => setCurrentFilter('active')}
                style={currentFilter === 'active' && customTheme ? {
                  background: `linear-gradient(135deg, ${customTheme.primary} 0%, ${customTheme.secondary} 100%)`
                } : {}}
              >
                Active
              </button>
              <button 
                className={currentFilter === 'high' ? 'active' : ''}
                onClick={() => setCurrentFilter('high')}
                style={currentFilter === 'high' && customTheme ? {
                  background: `linear-gradient(135deg, ${customTheme.primary} 0%, ${customTheme.secondary} 100%)`
                } : {}}
              >
                🔴 Priority
              </button>
              <button 
                className={currentFilter === 'done' ? 'active' : ''}
                onClick={() => setCurrentFilter('done')}
                style={currentFilter === 'done' && customTheme ? {
                  background: `linear-gradient(135deg, ${customTheme.primary} 0%, ${customTheme.secondary} 100%)`
                } : {}}
              >
                Completed
              </button>
            </div>

            <div className="task-list">
              {filteredTodos().length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎯</div>
                  <p>No tasks yet!</p>
                  <span>Add your first task and earn 5 XP 🚀</span>
                  {voiceSupported && <div className="voice-hint">💡 Try voice: "Add task buy groceries"</div>}
                </div>
              ) : (
                filteredTodos().map(todo => (
                  <div 
                    key={todo.id} 
                    className={`task-item ${todo.done ? 'completed' : ''} priority-${todo.priority}`}
                  >
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={() => handleToggle(todo.id)}
                      className="task-checkbox"
                      style={customTheme ? {
                        accentColor: customTheme.accent
                      } : {}}
                    />
                    <div className="task-content">
                      <span onClick={() => handleToggle(todo.id)}>{todo.task}</span>
                      <div className="task-meta">
                        {todo.dueDate && (
                          <span className={`due-date ${getTimeRemaining(todo.dueDate) === 'Overdue' ? 'overdue' : ''}`}>
                            ⏰ {getTimeRemaining(todo.dueDate)}
                          </span>
                        )}
                        {!todo.done && <span className="xp-reward" style={customTheme ? {
                          background: customTheme.accent
                        } : {}}>+10 XP</span>}
                      </div>
                    </div>
                    <div className="task-actions">
                      <span className="priority-badge">{todo.priority}</span>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(todo.id)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {todos.length > 0 && (
              <div className="footer">
                <span>{remainingTasks} task{remainingTasks !== 1 ? 's' : ''} remaining</span>
                {todos.some(t => t.done) && (
                  <button onClick={() => setTodos(todos.filter(t => !t.done))}>
                    Clear completed ({todos.filter(t => t.done).length})
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Component definitions remain the same but with isMobile prop added
function PomodoroTimer({ onClose, onComplete, darkMode, isMobile }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (!isBreak) {
        onComplete();
        setIsBreak(true);
        setTimeLeft(5 * 60);
        setIsRunning(false);
        
        if (isMobile && navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        }
      } else {
        setIsBreak(false);
        setTimeLeft(25 * 60);
        setIsRunning(false);
        
        if (isMobile && navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isBreak, onComplete, isMobile]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="pomodoro-overlay">
      <div className="pomodoro-container">
        <h2>⏱️ Pomodoro Timer</h2>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="pomodoro-status">
          {isBreak ? '☕ Break Time' : '🎯 Focus Time'}
        </div>
        
        <div className="pomodoro-timer">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        
        <div className="pomodoro-progress">
          <div 
            className="pomodoro-progress-bar"
            style={{
              width: `${((isBreak ? 5 * 60 : 25 * 60) - timeLeft) / (isBreak ? 5 * 60 : 25 * 60) * 100}%`
            }}
          />
        </div>
        
        <div className="pomodoro-controls">
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className="pomodoro-btn-primary"
          >
            {isRunning ? '⏸️ Pause' : '▶️ Start'}
          </button>
          <button 
            onClick={() => {
              setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
              setIsRunning(false);
            }}
            className="pomodoro-btn-secondary"
          >
            🔄 Reset
          </button>
        </div>
        
        <div className="pomodoro-info">
          <p>💡 <strong>Pomodoro Technique:</strong></p>
          <p>25 minutes of focused work, then a 5-minute break!</p>
        </div>
      </div>
    </div>
  );
}

function AdvancedAnalytics({ userStats, todos, onClose, darkMode, isMobile }) {
  const getProductivityHeatmap = () => {
    const hours = Array(24).fill(0);
    (userStats.taskHistory || []).forEach(task => {
      if (task.hour !== undefined) {
        hours[task.hour]++;
      }
    });
    return hours;
  };

  const heatmapData = getProductivityHeatmap();
  const maxHourTasks = Math.max(...heatmapData, 1);
  const bestHour = heatmapData.indexOf(maxHourTasks);

  const priorityBreakdown = {
    high: todos.filter(t => t.priority === 'high' && t.done).length,
    medium: todos.filter(t => t.priority === 'medium' && t.done).length,
    low: todos.filter(t => t.priority === 'low' && t.done).length
  };

  return (
    <div className="analytics-overlay">
      <div className="analytics-container">
        <h2>📈 Advanced Analytics</h2>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="analytics-grid">
          <div className="analytics-card">
            <h3>⏰ Productivity Heatmap</h3>
            <p>Your most productive hour: <strong>{bestHour}:00</strong></p>
            <div className="heatmap">
              {heatmapData.map((count, hour) => (
                <div key={hour} className="heatmap-item">
                  <div 
                    className="heatmap-bar"
                    style={{
                      height: `${(count / maxHourTasks) * 100}%`,
                      opacity: count === 0 ? 0.1 : 0.3 + (count / maxHourTasks) * 0.7
                    }}
                  />
                  <span className="heatmap-label">{hour}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="analytics-card">
            <h3>🎯 Priority Distribution</h3>
            <div className="priority-chart">
              <div className="priority-bar high" style={{width: `${(priorityBreakdown.high / userStats.totalCompleted * 100) || 0}%`}}>
                <span>High: {priorityBreakdown.high}</span>
              </div>
              <div className="priority-bar medium" style={{width: `${(priorityBreakdown.medium / userStats.totalCompleted * 100) || 0}%`}}>
                <span>Medium: {priorityBreakdown.medium}</span>
              </div>
              <div className="priority-bar low" style={{width: `${(priorityBreakdown.low / userStats.totalCompleted * 100) || 0}%`}}>
                <span>Low: {priorityBreakdown.low}</span>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <h3>📊 Quick Stats</h3>
            <div className="quick-stats">
              <div className="stat-item">
                <span className="stat-label">Completion Rate</span>
                <span className="stat-value">{todos.length > 0 ? Math.round(todos.filter(t => t.done).length / todos.length * 100) : 0}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Pomodoro Sessions</span>
                <span className="stat-value">{userStats.pomodoroSessions || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Average per Day</span>
                <span className="stat-value">{userStats.streak > 0 ? Math.round(userStats.totalCompleted / userStats.streak) : 0}</span>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <h3>💡 Insights</h3>
            <div className="insights-list">
              <div className="insight-item">
                ⚡ You're {Math.round((userStats.totalCompleted / 30) * 100)}% more productive than average!
              </div>
              <div className="insight-item">
                🔥 Your {userStats.streak}-day streak puts you in the top 10%!
              </div>
              <div className="insight-item">
                🎯 {Math.round((priorityBreakdown.high / userStats.totalCompleted * 100) || 0)}% of your completed tasks were high priority
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemeCreator({ onClose, onSave, currentTheme, darkMode, isMobile }) {
  const [theme, setTheme] = useState(currentTheme || {
    primary: '#667eea',
    secondary: '#764ba2',
    accent: '#4facfe'
  });

  const presets = [
    { name: 'Ocean', primary: '#1e3c72', secondary: '#2a5298', accent: '#4facfe' },
    { name: 'Sunset', primary: '#ff6b6b', secondary: '#ee5a6f', accent: '#feca57' },
    { name: 'Forest', primary: '#134e5e', secondary: '#71b280', accent: '#2ed573' },
    { name: 'Purple', primary: '#667eea', secondary: '#764ba2', accent: '#f093fb' },
    { name: 'Fire', primary: '#ff4757', secondary: '#ff6348', accent: '#ffa502' }
  ];

  return (
    <div className="theme-creator-overlay">
      <div className="theme-creator-content">
        <h2>🎨 Create Your Theme</h2>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="theme-presets">
          <h4>Quick Presets:</h4>
          <div className="preset-buttons">
            {presets.map(preset => (
              <button
                key={preset.name}
                onClick={() => setTheme({
                  primary: preset.primary,
                  secondary: preset.secondary,
                  accent: preset.accent
                })}
                style={{
                  background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)`
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="color-pickers">
          <div className="color-picker-group">
            <label>Primary Color</label>
            <input
              type="color"
              value={theme.primary}
              onChange={(e) => setTheme({...theme, primary: e.target.value})}
            />
            <span>{theme.primary}</span>
          </div>
          
          <div className="color-picker-group">
            <label>Secondary Color</label>
            <input
              type="color"
              value={theme.secondary}
              onChange={(e) => setTheme({...theme, secondary: e.target.value})}
            />
            <span>{theme.secondary}</span>
          </div>
          
          <div className="color-picker-group">
            <label>Accent Color</label>
            <input
              type="color"
              value={theme.accent}
              onChange={(e) => setTheme({...theme, accent: e.target.value})}
            />
            <span>{theme.accent}</span>
          </div>
        </div>

        <div className="theme-preview" style={{
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
        }}>
          <div style={{color: 'white', padding: '20px'}}>
            <h3>Preview</h3>
            <button style={{
              background: theme.accent,
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              marginTop: '10px',
              cursor: 'pointer'
            }}>Sample Button</button>
          </div>
        </div>

        <button className="save-theme-btn" onClick={() => onSave(theme)}>
          Save & Apply Theme
        </button>
      </div>
    </div>
  );
}

function AISuggestions({ suggestions, onClose, darkMode, isMobile }) {
  return (
    <div className="ai-suggestions-overlay" onClick={(e) => {
      if (e.target.className === 'ai-suggestions-overlay') onClose();
    }}>
      <div className="ai-content" onClick={(e) => e.stopPropagation()}>
        <div className="ai-header">
          <h3>🧠 AI Smart Suggestions</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="suggestions-list">
          {suggestions.map((sug, i) => (
            <div key={i} className={`suggestion-card ${sug.type}`}>
              <div className="suggestion-icon">{sug.icon}</div>
              <div className="suggestion-text">
                <h4>{sug.title}</h4>
                <p>{sug.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ userStats, todos, achievements, onClose, darkMode, isMobile }) {
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayCompleted = todos.filter(t => {
        if (!t.done) return false;
        const taskDate = new Date(t.createdAt).toDateString();
        return taskDate === date.toDateString();
      }).length;
      days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: dayCompleted
      });
    }
    return days;
  };

  const weekData = getLast7Days();
  const maxCompleted = Math.max(...weekData.map(d => d.completed), 1);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>📊 Your Dashboard</h2>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">{userStats.level}</div>
          <div className="stat-label">Level</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{userStats.totalCompleted}</div>
          <div className="stat-label">Tasks Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">{userStats.streak}</div>
          <div className="stat-label">Day Streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✨</div>
          <div className="stat-value">{userStats.xp}</div>
          <div className="stat-label">Total XP</div>
        </div>
      </div>

      <div className="chart-section">
        <h3>📈 Last 7 Days</h3>
        <div className="bar-chart">
          {weekData.map((day, i) => (
            <div key={i} className="bar-container">
              <div 
                className="bar"
                style={{
                  height: `${(day.completed / maxCompleted) * 100}%`,
                  minHeight: day.completed > 0 ? '10%' : '0'
                }}
              >
                <span className="bar-value">{day.completed}</span>
              </div>
              <div className="bar-label">{day.day}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="achievements-section">
        <h3>🏆 Achievements ({userStats.achievements.length}/{achievements.length})</h3>
        <div className="achievements-grid">
          {achievements.map(ach => {
            const unlocked = userStats.achievements.includes(ach.id);
            return (
              <div key={ach.id} className={`achievement ${unlocked ? 'unlocked' : 'locked'}`}>
                <div className="achievement-icon">{ach.icon}</div>
                <div className="achievement-info">
                  <div className="achievement-name">{ach.name}</div>
                  <div className="achievement-desc">{ach.desc}</div>
                </div>
                {unlocked && <div className="unlocked-badge">✓</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
