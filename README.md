# TaskFlow - Personal Productivity Companion

A modern, feature-rich todo application built with HTML5, CSS3, and Vanilla JavaScript. TaskFlow helps users manage their tasks across different stages (Todo, Completed, Archived) with an intuitive and responsive interface.

## 🌟 Features

### Core Features
- **Age Verification System** - Secure access for users 11+ years old
- **Three Task Stages** - Todo, Completed, and Archived with dynamic counters
- **Task Management** - Add, complete, archive, and move tasks between stages
- **User Profiles** - Personalized experience with avatar generation
- **Data Persistence** - Browser localStorage for data persistence
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

### Advanced Features
- **Search & Filtering** - Find tasks by text, category, or priority
- **Task Categories** - Work, Personal, Health, Learning, Shopping, Other
- **Priority Levels** - High, Medium, Low with visual indicators
- **Due Dates & Reminders** - Set deadlines with reminder notifications
- **Subtasks** - Break down tasks into smaller components
- **Pomodoro Timer** - Focus timer with work/break cycles
- **Analytics Dashboard** - Visual charts for progress tracking
- **Theme Toggle** - Dark and light mode support
- **Keyboard Shortcuts** - Quick actions for power users
- **Recurring Tasks** - Daily, weekly, monthly, yearly options
- **Progress Tracking** - Streaks, completion rates, statistics

## 🚀 Live Demo

[View Live Demo](https://task-flow-xzr4.vercel.app/)

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **APIs**: 
  - [UI Avatars API](https://ui-avatars.com/) - Profile picture generation
  - [DummyJSON API](https://dummyjson.com/) - Initial sample data
- **Storage**: Browser localStorage
- **Charts**: Chart.js for analytics
- **Icons**: Emoji icons for visual appeal

## 📁 Project Structure

```
TASK_FLOW_Project/
├── TASKFLOW/
│   ├── index.html          # Landing page with age verification
│   ├── app.html            # Main application interface
│   ├── css/
│   │   └── style.css       # Comprehensive styling
│   └── js/
│       ├── index.js        # Landing page logic
│       └── app.js          # Main application logic
├── README.md               # Project documentation
└── .gitignore             # Git ignore rules
```

## 🎯 Assignment Requirements Met

### ✅ Landing Page Features
- Age verification form (>10 years old)
- Name and date of birth inputs
- Form validation with error messages
- localStorage data persistence
- Auto-redirect for returning users

### ✅ Main Application Features
- User profile display with avatar
- Three task stages with dynamic counters
- Task management across stages
- Last modified timestamps
- Sign out functionality

### ✅ API Integration
- UI Avatars API for profile pictures
- DummyJSON API for initial sample data
- Proper error handling and fallbacks

### ✅ Technical Requirements
- HTML5, CSS3, Vanilla JavaScript
- Responsive design
- Browser localStorage
- Form validation
- Clean code structure

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No additional dependencies required

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/TASK_FLOW_Project.git
   cd TASK_FLOW_Project
   ```

2. **Open the application**
   - Navigate to `TASKFLOW/index.html`
   - Or use a local server for better experience

3. **Local Development Server** (Optional)
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve TASKFLOW
   
   # Using PHP
   php -S localhost:8000 -t TASKFLOW
   ```

## 🎮 Usage

### First Time Setup
1. Enter your full name and date of birth
2. Verify you are over 10 years old
3. Get redirected to the main application
4. Sample tasks will be loaded automatically

### Managing Tasks
1. **Add Tasks**: Use the input field at the top
2. **Set Properties**: Choose due date, category, priority, reminders
3. **Add Subtasks**: Break down complex tasks
4. **Move Tasks**: Use action buttons to move between stages
5. **Search & Filter**: Find specific tasks quickly

### Advanced Features
- **Pomodoro Timer**: Use the focus timer for productivity
- **Analytics**: View your progress in the dashboard
- **Theme Toggle**: Switch between dark and light modes
- **Keyboard Shortcuts**: 
  - `Ctrl/Cmd + Enter`: Add task
  - `Escape`: Clear search

## 🔧 Customization

### Adding New Categories
Edit the category options in `app.html`:
```html
<select id="taskCategory">
  <option value="new-category">🏷️ New Category</option>
  <!-- existing options -->
</select>
```

### Modifying Colors
Update the CSS variables in `style.css`:
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --background-color: #1a1b2e;
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Tasks not saving**
   - Check if localStorage is enabled in your browser
   - Clear browser cache and try again

2. **API not working**
   - Check internet connection
   - APIs have fallback mechanisms

3. **Styling issues**
   - Ensure all CSS files are loaded
   - Check browser compatibility

## 📱 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is created as part of a web development assignment. Feel free to use and modify for educational purposes.

## 👨‍💻 Author

**Your Name**
- GitHub: [@Saumya20062004](https://github.com/Saumya20062004)

## 🙏 Acknowledgments

- [UI Avatars](https://ui-avatars.com/) for profile picture generation
- [DummyJSON](https://dummyjson.com/) for sample data
- [Chart.js](https://www.chartjs.org/) for analytics charts
- Modern CSS techniques and JavaScript best practices

---

⭐ **Star this repository if you found it helpful!** 
