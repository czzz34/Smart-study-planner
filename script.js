const taskForm = document.getElementById('task-form');
            const taskList = document.getElementById('task-list');
            const timeline = document.getElementById('timeline');
            const emptyTasks = document.getElementById('empty-tasks');
            const emptyTimeline = document.getElementById('empty-timeline');
            const filterButtons = document.querySelectorAll('.filter-btn');
            const totalTasksEl = document.getElementById('total-tasks');
            const completedTasksEl = document.getElementById('completed-tasks');
            const pendingTasksEl = document.getElementById('pending-tasks');
            const progressBar = document.getElementById('progress-bar');
            const progressText = document.getElementById('progress-text');

            // Current filter
            let currentFilter = 'all';

            // Load tasks from local storage
            let tasks = JSON.parse(localStorage.getItem('studyTasks')) || [];

            // Initialize the application
            function init() {
                renderTasks();
                renderTimeline();
                updateStats();
                setupEventListeners();
                checkReminders();
            }

            // Set up event listeners
            function setupEventListeners() {
                // Form submission
                taskForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    addTask();
                });

                // Filter buttons
                filterButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        // Update active button
                        filterButtons.forEach(btn => btn.classList.remove('active'));
                        this.classList.add('active');
                        
                        // Update filter and re-render
                        currentFilter = this.getAttribute('data-filter');
                        renderTasks();
                    });
                });
            }

            // Add a new task
            function addTask() {
                const title = document.getElementById('task-title').value;
                const subject = document.getElementById('task-subject').value;
                const description = document.getElementById('task-description').value;
                const deadline = document.getElementById('task-deadline').value;
                const priority = document.getElementById('task-priority').value;
                const reminder = document.getElementById('task-reminder').value;

                const newTask = {
                    id: Date.now(),
                    title,
                    subject,
                    description,
                    deadline,
                    priority,
                    reminder,
                    completed: false,
                    createdAt: new Date().toISOString()
                };

                tasks.push(newTask);
                saveTasks();
                renderTasks();
                renderTimeline();
                updateStats();
                
                // Reset form
                taskForm.reset();
                
                // Show notification
                showNotification('Task added successfully!', 'success');
            }

            // Delete a task
            function deleteTask(id) {
                tasks = tasks.filter(task => task.id !== id);
                saveTasks();
                renderTasks();
                renderTimeline();
                updateStats();
                
                // Show notification
                showNotification('Task deleted!', 'warning');
            }

            // Toggle task completion
            function toggleTaskCompletion(id) {
                tasks = tasks.map(task => {
                    if (task.id === id) {
                        return { ...task, completed: !task.completed };
                    }
                    return task;
                });
                
                saveTasks();
                renderTasks();
                updateStats();
                
                // Show notification
                const task = tasks.find(t => t.id === id);
                const message = task.completed ? 'Task marked as completed!' : 'Task marked as pending!';
                showNotification(message, 'success');
            }

            // Edit a task
            function editTask(id) {
                const task = tasks.find(t => t.id === id);
                
                // Populate form with task data
                document.getElementById('task-title').value = task.title;
                document.getElementById('task-subject').value = task.subject;
                document.getElementById('task-description').value = task.description;
                document.getElementById('task-deadline').value = task.deadline;
                document.getElementById('task-priority').value = task.priority;
                document.getElementById('task-reminder').value = task.reminder;
                
                // Remove the task
                deleteTask(id);
                
                // Show notification
                showNotification('Task loaded for editing!', 'info');
            }

            // Save tasks to local storage
            function saveTasks() {
                localStorage.setItem('studyTasks', JSON.stringify(tasks));
            }

            // Render tasks based on current filter
            function renderTasks() {
                // Filter tasks based on current selection
                let filteredTasks = tasks;
                if (currentFilter === 'pending') {
                    filteredTasks = tasks.filter(task => !task.completed);
                } else if (currentFilter === 'completed') {
                    filteredTasks = tasks.filter(task => task.completed);
                }

                // Clear task list
                taskList.innerHTML = '';

                // Show empty state if no tasks
                if (filteredTasks.length === 0) {
                    emptyTasks.style.display = 'block';
                    return;
                } else {
                    emptyTasks.style.display = 'none';
                }

                // Sort tasks by deadline (soonest first)
                filteredTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

                // Render each task
                filteredTasks.forEach(task => {
                    const taskItem = document.createElement('li');
                    taskItem.className = `task-item ${task.priority}-priority ${task.completed ? 'completed' : ''}`;
                    
                    const daysLeft = calculateDaysLeft(task.deadline);
                    const daysText = daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days left`;
                    
                    taskItem.innerHTML = `
                        <div class="task-info">
                            <h3>${task.title}</h3>
                            <div class="task-meta">
                                <span>${task.subject}</span> • 
                                <span>Due: ${formatDate(task.deadline)} (${daysText})</span> • 
                                <span>Priority: ${task.priority}</span>
                            </div>
                            ${task.description ? `<p>${task.description}</p>` : ''}
                        </div>
                        <div class="task-actions">
                            <button class="btn ${task.completed ? 'btn-warning' : 'btn-success'}" onclick="toggleTaskCompletion(${task.id})">
                                ${task.completed ? 'Undo' : 'Complete'}
                            </button>
                            <button class="btn btn-primary" onclick="editTask(${task.id})">Edit</button>
                            <button class="btn btn-danger" onclick="deleteTask(${task.id})">Delete</button>
                        </div>
                    `;
                    
                    taskList.appendChild(taskItem);
                });
            }

            // Render timeline of upcoming tasks
            function renderTimeline() {
                // Clear timeline
                timeline.innerHTML = '';

                // Get upcoming tasks (not completed, with deadlines)
                const upcomingTasks = tasks
                    .filter(task => !task.completed && task.deadline)
                    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                    .slice(0, 5); // Show only next 5 tasks

                // Show empty state if no upcoming tasks
                if (upcomingTasks.length === 0) {
                    emptyTimeline.style.display = 'block';
                    return;
                } else {
                    emptyTimeline.style.display = 'none';
                }

                // Render each timeline item
                upcomingTasks.forEach(task => {
                    const timelineItem = document.createElement('div');
                    timelineItem.className = 'timeline-item';
                    
                    const daysLeft = calculateDaysLeft(task.deadline);
                    const urgencyClass = daysLeft <= 1 ? 'high-priority' : daysLeft <= 3 ? 'medium-priority' : '';
                    
                    timelineItem.innerHTML = `
                        <div class="timeline-date">${formatDate(task.deadline)} (${daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`})</div>
                        <div class="timeline-content ${urgencyClass}">
                            <strong>${task.title}</strong> - ${task.subject}
                            ${task.description ? `<br><small>${task.description}</small>` : ''}
                        </div>
                    `;
                    
                    timeline.appendChild(timelineItem);
                });
            }

            // Update statistics
            function updateStats() {
                const total = tasks.length;
                const completed = tasks.filter(task => task.completed).length;
                const pending = total - completed;
                const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

                totalTasksEl.textContent = total;
                completedTasksEl.textContent = completed;
                pendingTasksEl.textContent = pending;
                progressBar.style.width = `${completionRate}%`;
                progressText.textContent = `${completionRate}% Complete`;
            }

            // Check for reminders
            function checkReminders() {
                const now = new Date();
                
                tasks.forEach(task => {
                    if (task.reminder && !task.completed) {
                        const reminderTime = new Date(task.reminder);
                        
                        // Check if reminder time is within the next 5 minutes
                        if (reminderTime > now && reminderTime <= new Date(now.getTime() + 5 * 60000)) {
                            showNotification(`Reminder: "${task.title}" is due soon!`, 'info');
                        }
                    }
                });
            }

            // Show notification
            function showNotification(message, type) {
                // Create notification element
                const notification = document.createElement('div');
                notification.className = `notification ${type}`;
                notification.textContent = message;
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    background: ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : type === 'info' ? '#2196f3' : '#f44336'};
                    color: white;
                    border-radius: 5px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    z-index: 1000;
                    opacity: 0;
                    transition: opacity 0.3s;
                `;
                
                document.body.appendChild(notification);
                
                // Fade in
                setTimeout(() => {
                    notification.style.opacity = '1';
                }, 10);
                
                // Remove after 3 seconds
                setTimeout(() => {
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        document.body.removeChild(notification);
                    }, 300);
                }, 3000);
            }

            // Utility functions
            function formatDate(dateString) {
                const options = { year: 'numeric', month: 'short', day: 'numeric' };
                return new Date(dateString).toLocaleDateString(undefined, options);
            }

            function calculateDaysLeft(deadline) {
                const today = new Date();
                const deadlineDate = new Date(deadline);
                const diffTime = deadlineDate - today;
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            // Make functions available globally for onclick handlers
            window.toggleTaskCompletion = toggleTaskCompletion;
            window.deleteTask = deleteTask;
            window.editTask = editTask;

            // Initialize the application
            init();

            // Check reminders every minute
            setInterval(checkReminders, 60000);
    