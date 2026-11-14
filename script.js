/**
 * DunDun Task Management App
 * Clean, Modern, Playful & Polished Vanilla JavaScript
 */

(() => {
  'use strict';

  // Storage key
  const STORAGE_KEY = 'dundun_tasks';

  // State
  let tasks = [];
  let currentFilter = 'all'; // 'all' | 'pending' | 'completed'
  let searchQuery = '';
  let pendingDeleteTaskId = null;

  // DOM Elements
  const addTaskForm = document.getElementById('add-task-form');
  const taskTitleInput = document.getElementById('task-title');
  const taskDueDateInput = document.getElementById('task-due-date');
  const taskPriorityInput = document.getElementById('task-priority');

  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const filterTabs = document.querySelectorAll('.filter-tab');

  const tasksContainer = document.getElementById('tasks-container');

  // Stats DOM
  const statTotal = document.getElementById('stat-total');
  const statPending = document.getElementById('stat-pending');
  const statCompleted = document.getElementById('stat-completed');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');

  const filterCountAll = document.getElementById('filter-count-all');
  const filterCountPending = document.getElementById('filter-count-pending');
  const filterCountCompleted = document.getElementById('filter-count-completed');

  // Edit Modal DOM
  const editModal = document.getElementById('edit-modal');
  const editTaskForm = document.getElementById('edit-task-form');
  const editTaskId = document.getElementById('edit-task-id');
  const editTaskTitle = document.getElementById('edit-task-title');
  const editTaskDueDate = document.getElementById('edit-task-due-date');
  const editTaskPriority = document.getElementById('edit-task-priority');
  const editModalClose = document.getElementById('edit-modal-close');
  const editModalCancel = document.getElementById('edit-modal-cancel');

  // Delete Modal DOM
  const deleteModal = document.getElementById('delete-modal');
  const deleteTaskPreview = document.getElementById('delete-task-preview');
  const deleteModalConfirm = document.getElementById('delete-modal-confirm');
  const deleteModalCancel = document.getElementById('delete-modal-cancel');
  const deleteModalClose = document.getElementById('delete-modal-close');

  /**
   * Helper: Get current local date string in YYYY-MM-DD
   */
  function getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Check if a task is overdue
   * True only if incomplete and dueDate < today
   */
  function isTaskOverdue(dueDate, completed) {
    if (!dueDate || completed) return false;
    const today = getTodayString();
    return dueDate < today;
  }

  /**
   * Format date into friendly display
   */
  function formatDueDate(dueDateStr) {
    if (!dueDateStr) return '';
    const today = getTodayString();

    // Calculate tomorrow and yesterday in YYYY-MM-DD
    const todayDate = new Date();
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;

    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

    if (dueDateStr === today) return 'Today';
    if (dueDateStr === tomorrow) return 'Tomorrow';
    if (dueDateStr === yesterday) return 'Yesterday';

    // Parse and format MMM D, YYYY
    const parts = dueDateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[monthIndex]} ${day}, ${year}`;
    }

    return dueDateStr;
  }

  /**
   * Sanitize string to prevent XSS
   */
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Load tasks from LocalStorage
   */
  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        tasks = JSON.parse(raw);
        if (!Array.isArray(tasks)) tasks = [];
      } else {
        // Initial playful starter tasks for first-time visitors
        const today = getTodayString();
        const tomorrowDate = new Date();
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrow = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;

        tasks = [
          {
            id: 'task_' + Date.now() + '_1',
            title: 'Welcome to DunDun! 🥁 Tap the checkbox when done',
            dueDate: today,
            priority: 'High',
            completed: false,
            createdAt: Date.now() - 2000
          },
          {
            id: 'task_' + Date.now() + '_2',
            title: 'Organize high, medium & low priority tasks ⚡',
            dueDate: tomorrow,
            priority: 'Medium',
            completed: false,
            createdAt: Date.now() - 1000
          },
          {
            id: 'task_' + Date.now() + '_3',
            title: 'Finished setting up the task manager! ✨',
            dueDate: '',
            priority: 'Low',
            completed: true,
            createdAt: Date.now()
          }
        ];
        saveTasks();
      }
    } catch (e) {
      console.error('Failed to parse tasks from localStorage:', e);
      tasks = [];
    }
  }

  /**
   * Save tasks to LocalStorage
   */
  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage:', e);
    }
  }

  /**
   * Add a new task
   */
  function handleAddTask(e) {
    e.preventDefault();
    const title = taskTitleInput.value.trim();
    if (!title) return;

    const dueDate = taskDueDateInput.value;
    const priority = taskPriorityInput.value;

    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      title,
      dueDate,
      priority,
      completed: false,
      createdAt: Date.now()
    };

    tasks.unshift(newTask);
    saveTasks();

    // Reset inputs
    addTaskForm.reset();
    taskPriorityInput.value = 'Medium';
    taskTitleInput.focus();

    render();
  }

  /**
   * Toggle task completed status
   */
  function toggleTaskCompleted(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    saveTasks();
    render();
  }

  /**
   * Open Edit Modal
   */
  function openEditModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    editTaskId.value = task.id;
    editTaskTitle.value = task.title;
    editTaskDueDate.value = task.dueDate || '';
    editTaskPriority.value = task.priority || 'Medium';

    editModal.hidden = false;
    editTaskTitle.focus();
  }

  /**
   * Close Edit Modal
   */
  function closeEditModal() {
    editModal.hidden = true;
    editTaskForm.reset();
  }

  /**
   * Save Edit Form Changes
   */
  function handleSaveEdit(e) {
    e.preventDefault();
    const id = editTaskId.value;
    const title = editTaskTitle.value.trim();
    if (!title) return;

    const task = tasks.find(t => t.id === id);
    if (task) {
      task.title = title;
      task.dueDate = editTaskDueDate.value;
      task.priority = editTaskPriority.value;
      saveTasks();
      render();
    }
    closeEditModal();
  }

  /**
   * Prompt Delete Modal (Confirm requirement)
   */
  function openDeleteModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    pendingDeleteTaskId = taskId;
    deleteTaskPreview.textContent = `"${task.title}"`;
    deleteModal.hidden = false;
  }

  /**
   * Close Delete Modal
   */
  function closeDeleteModal() {
    deleteModal.hidden = true;
    pendingDeleteTaskId = null;
  }

  /**
   * Confirm Delete Action
   */
  function confirmDelete() {
    if (!pendingDeleteTaskId) return;

    tasks = tasks.filter(t => t.id !== pendingDeleteTaskId);
    saveTasks();
    closeDeleteModal();
    render();
  }

  /**
   * Update Summary Statistics & Filter Badges
   */
  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    statTotal.textContent = total;
    statPending.textContent = pending;
    statCompleted.textContent = completed;

    filterCountAll.textContent = total;
    filterCountPending.textContent = pending;
    filterCountCompleted.textContent = completed;

    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${percentage}% DunDun`;
  }

  /**
   * Filter and search tasks
   */
  function getFilteredTasks() {
    return tasks.filter(task => {
      // Status filter
      if (currentFilter === 'pending' && task.completed) return false;
      if (currentFilter === 'completed' && !task.completed) return false;

      // Search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = task.title.toLowerCase().includes(query);
        if (!matchesTitle) return false;
      }

      return true;
    });
  }

  /**
   * Render tasks list and empty states
   */
  function render() {
    updateStats();

    const filtered = getFilteredTasks();
    tasksContainer.innerHTML = '';

    // Handle Empty States
    if (tasks.length === 0) {
      tasksContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🥁</div>
          <h3 class="empty-state-title">Nothing on your plate!</h3>
          <p class="empty-state-desc">You are completely DunDun for now. Add a new task above whenever you are ready!</p>
        </div>
      `;
      return;
    }

    if (filtered.length === 0) {
      let message = 'No tasks match your current filter.';
      if (searchQuery.trim() !== '') {
        message = `No tasks matching "<strong>${escapeHTML(searchQuery)}</strong>".`;
      } else if (currentFilter === 'pending') {
        message = 'Great job! No pending tasks remaining. Everything is DunDun! 🎉';
      } else if (currentFilter === 'completed') {
        message = 'No completed tasks yet. Finish a task to see it here!';
      }

      tasksContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h3 class="empty-state-title">No tasks found</h3>
          <p class="empty-state-desc">${message}</p>
        </div>
      `;
      return;
    }

    // Render Task Cards
    const fragment = document.createDocumentFragment();

    filtered.forEach(task => {
      const overdue = isTaskOverdue(task.dueDate, task.completed);
      const formattedDate = formatDueDate(task.dueDate);

      const taskEl = document.createElement('article');
      taskEl.className = `task-item ${task.completed ? 'is-completed' : ''} ${overdue ? 'is-overdue' : ''}`;
      taskEl.setAttribute('data-id', task.id);

      // Priority class and label
      const priorityClass = `prio-${task.priority.toLowerCase()}`;
      const priorityIcon = task.priority === 'High' ? '🔥' : (task.priority === 'Medium' ? '⚡' : '🌱');

      taskEl.innerHTML = `
        <div class="task-check-wrapper">
          <button 
            type="button" 
            class="task-checkbox-btn" 
            aria-label="${task.completed ? 'Mark task incomplete' : 'Mark task completed'}"
            title="${task.completed ? 'Mark incomplete' : 'Mark completed'}"
          >
            <span class="check-icon" aria-hidden="true">✓</span>
          </button>
        </div>
        <div class="task-content">
          <div class="task-text">${escapeHTML(task.title)}</div>
          <div class="task-meta">
            <span class="badge-priority ${priorityClass}">
              <span>${priorityIcon}</span> ${task.priority}
            </span>
            ${task.dueDate ? `
              <span class="badge-date">
                <span>📅</span> ${formattedDate}
              </span>
            ` : ''}
            ${overdue ? `
              <span class="badge-overdue">
                <span>⚠️</span> Overdue
              </span>
            ` : ''}
            ${task.completed ? `
              <span class="badge-completed">
                <span>✓</span> Completed
              </span>
            ` : ''}
          </div>
        </div>
        <div class="task-actions">
          <button 
            type="button" 
            class="task-action-btn edit-btn" 
            aria-label="Edit task" 
            title="Edit task"
          >
            ✏️
          </button>
          <button 
            type="button" 
            class="task-action-btn delete-btn" 
            aria-label="Delete task" 
            title="Delete task"
          >
            🗑️
          </button>
        </div>
      `;

      // Event Listeners for Task Elements
      const checkboxBtn = taskEl.querySelector('.task-checkbox-btn');
      checkboxBtn.addEventListener('click', () => toggleTaskCompleted(task.id));

      const editBtn = taskEl.querySelector('.edit-btn');
      editBtn.addEventListener('click', () => openEditModal(task.id));

      const deleteBtn = taskEl.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => openDeleteModal(task.id));

      fragment.appendChild(taskEl);
    });

    tasksContainer.appendChild(fragment);
  }

  /**
   * Setup Event Listeners
   */
  function initEvents() {
    // Add task form
    addTaskForm.addEventListener('submit', handleAddTask);

    // Filter tabs
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        currentFilter = tab.getAttribute('data-filter');
        render();
      });
    });

    // Search input
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchQuery.trim().length > 0) {
        searchClearBtn.hidden = false;
      } else {
        searchClearBtn.hidden = true;
      }
      render();
    });

    // Search clear button
    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      searchClearBtn.hidden = true;
      searchInput.focus();
      render();
    });

    // Edit modal events
    editTaskForm.addEventListener('submit', handleSaveEdit);
    editModalClose.addEventListener('click', closeEditModal);
    editModalCancel.addEventListener('click', closeEditModal);

    // Delete modal events
    deleteModalConfirm.addEventListener('click', confirmDelete);
    deleteModalCancel.addEventListener('click', closeDeleteModal);
    deleteModalClose.addEventListener('click', closeDeleteModal);

    // Close modals on clicking outside / backdrop
    window.addEventListener('click', (e) => {
      if (e.target === editModal) closeEditModal();
      if (e.target === deleteModal) closeDeleteModal();
    });

    // Keyboard navigation (Esc to close open modals)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!editModal.hidden) closeEditModal();
        if (!deleteModal.hidden) closeDeleteModal();
      }
    });
  }

  /**
   * App Initialization
   */
  function init() {
    loadTasks();
    initEvents();
    render();
  }

  // Kickoff on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
