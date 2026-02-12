# Tasky 🎯

A task manager I built that actually makes me want to complete tasks. It's basically a to-do list that turned into a game - you level up, unlock achievements, and get AI suggestions on when you're most productive.

**[Live Demo] https://taskey1.netlify.app/

---

## What is Taskey?

Honestly, I got tired of boring to-do apps so I built one that's fun to use. Every task you complete gives you XP, you level up, unlock achievements, and there's even voice commands so you can add tasks while cooking or whatever.

**Main stuff:**
- Add tasks with priorities and due dates
- Complete them and level up (with confetti!)
- Voice commands - literally just say "add task buy milk"
- AI tells you when you're most productive
- Pomodoro timer built in
- Works on your phone as an actual app
- Custom themes 
- Dark mode 

---

## Tech I Used

Built this with React because I wanted to get better at it. No backend - everything saves to your browser so it's super fast.

**Stack:**
- React 18 (useState, useEffect, all the hooks)
- Vite (way faster than Create React App)
- Pure CSS - no Tailwind, wanted to practice animations
- LocalStorage for saving everything

**Cool APIs I learned:**
- Web Speech API - the voice commands part
- Notification API - the popups when you level up
- Web Audio API - made the sound effects from scratch
- Service Workers - makes it work offline and installable

---

## How I Built It

Started simple - just a basic to-do list. Then I kept adding stuff:

1. Added XP and levels (wanted to make it feel like a game)
2. Built the achievement system (12 different ones)
3. Added voice commands (took forever to figure out mobile support)
4. Made the analytics dashboard (the heatmap showing when you work best)
5. Built custom themes because why not
6. Made it work on mobile (harder than I thought)

### Stuff That Was Tricky

**Voice commands on mobile:**
Turns out Safari doesn't support Web Speech API. So I made it detect your device and show helpful messages instead of just breaking. Chrome on Android works though.

**Making it feel smooth:**
Had to optimize the confetti animation - was laggy on phones. Ended up reducing particles on mobile and using CSS transforms for better performance.

**Notifications:**
Some browsers block notifications, so I built a fallback system that shows in-app alerts instead. Works everywhere now.

**Themes not saving:**
Took me a bit to figure out how to properly save CSS variables to localStorage and reapply them on page load.

---

## Features

### The Gamification Part
- Earn XP when you add (+5) or complete (+10) tasks
- Level up every 100 XP with confetti
- 12 achievements to unlock (streaks, milestones, etc.)
- Daily goal tracking
- Streak counter - don't break the chain!

### AI Suggestions
Not actually AI (no OpenAI API or anything), but smart suggestions based on:
- What time it is (suggests hard tasks in morning, easy ones after lunch)
- How many tasks you have (warns if you're overloading yourself)
- Your streak (reminds you to keep it going)
- Task priorities (tells you if you're ignoring high-priority stuff)

### Analytics
- Heatmap showing which hours you're most productive
- Charts for priority breakdown
- 7-day productivity graph
- Insights about your habits

### Mobile App (PWA)
- Install it on your phone's home screen
- Works completely offline
- Vibration feedback when you complete tasks
- Notifications even when the app is closed

---


## Running It Yourself

```bash
# Clone it
git clone https://github.com/Raymenny/tasky.git
cd tasky

# Install stuff
npm install

# Run it
npm run dev
```

Open `http://localhost:5173` and you're good.

**To build:**
```bash
npm run build
```

---

## What I Learned

This was my first real React project that wasn't a tutorial. Learned a ton:

**Technical:**
- How to structure a React app properly
- Working with browser APIs (Speech, Notifications, Audio)
- Making things work on mobile (way different than desktop)
- Performance optimization (animations, rendering)
- PWA development and service workers
- CSS animations and making them smooth

**Development:**
- Planning features before coding them
- Testing on different devices and browsers
- Debugging when things break on mobile but work on desktop
- Writing code other people can actually read
- Version control with git (made lots of commits on this one)

**Design:**
- Making UI that feels good to use
- When to add animations vs when to keep it simple
- Mobile-first design (started desktop, should've started mobile)
- Color theory for the custom themes

---

## Future Ideas

Stuff I might add:
- Backend so you can access tasks from different devices
- Sharing tasks with friends
- More achievements
- Custom daily goals
- Task categories/folders
- Recurring tasks (like "workout every Monday")
- Export data to CSV or something
- Maybe AI-powered task suggestions using actual AI

---

## Project Structure

```
tasky/
├── src/
│   ├── App.jsx       # All the main logic
│   ├── App.css       # Styles and animations
│   └── main.jsx      # Entry point
├── public/
│   ├── manifest.json # PWA config
│   └── sw.js        # Service worker
└── package.json
```

Pretty simple structure. Everything's in App.jsx because I didn't want to over-complicate it with a million components.

---

## Connect With Me

**Ivan Munguia**
- LinkedIn: [linkedin.com/in/ivan-munguia-283a96271](https://www.linkedin.com/in/ivan-munguia-283a96271)
- GitHub: [@Raymenny](https://github.com/Raymenny)

Looking for internships in software development! If you're hiring or know someone who is, let me know.

---



