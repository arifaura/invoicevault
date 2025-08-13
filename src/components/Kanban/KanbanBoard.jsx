import React, { useState, useEffect, useRef } from "react";
import { useTheme } from '../../context/ThemeContext';
import CustomAlert from '../Common/CustomAlert';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './KanbanBoard.css';

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function KanbanBoard() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState('connecting');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "pending"
  });

  // Alert states
  const [deleteAlert, setDeleteAlert] = useState({ show: false, taskId: null });
  const [clearAllAlert, setClearAllAlert] = useState(false);
  const [editAlert, setEditAlert] = useState({ show: false, task: null, title: "", description: "", priority: "medium", status: "pending" });
  
  const dragItem = useRef(null);
  const dragNode = useRef(null);
  const confettiRootRef = useRef(null);
  const formRef = useRef(null);

  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add task to database
  const addTaskToDatabase = async (taskData) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            ...taskData,
            user_id: user?.id,
            done: false,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding task:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error adding task:', error);
      return null;
    }
  };

  // Update task in database
  const updateTaskInDatabase = async (taskId, updates) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  };

  // Delete task from database
  const deleteTaskFromDatabase = async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error deleting task:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    // Fetch initial tasks
    fetchTasks();

    // Set up real-time subscription
    const channel = supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time change:', payload);
          
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(task => 
              task.id === payload.new.id ? payload.new : task
            ));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(task => task.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('error');
        } else if (status === 'TIMED_OUT') {
          setRealtimeStatus('timeout');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Enhanced confetti with better colors and effects
  function runConfetti(count = 100) {
    const root = confettiRootRef.current;
    if (!root) return;
    
    const colors = [
      "#ef4444", "#f59e0b", "#10b981", "#3b82f6", 
      "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"
    ];
    const shapes = ["circle", "square", "triangle"];
    const fragments = [];

    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      const size = Math.round(8 + Math.random() * 12);
      const left = Math.round(Math.random() * 100);
      const delay = (Math.random() * 0.8).toFixed(2);
      const rotation = Math.round(Math.random() * 720);
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      
      el.style.position = "absolute";
      el.style.left = `${left}%`;
      el.style.top = `-20px`;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.opacity = "0.95";
      el.style.borderRadius = shape === "circle" ? "50%" : shape === "triangle" ? "0" : "2px";
      el.style.transform = `rotate(${rotation}deg)`;
      el.style.pointerEvents = "none";
      el.style.zIndex = 9999;
      el.style.willChange = "transform, top, opacity";
      el.style.animation = `confettiFall ${2.5 + Math.random() * 1.5}s ${delay}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;
      el.style.boxShadow = `0 0 ${size/2}px ${colors[Math.floor(Math.random() * colors.length)]}40`;

      if (shape === "triangle") {
        el.style.clipPath = "polygon(50% 0%, 0% 100%, 100% 100%)";
      }

      root.appendChild(el);
      fragments.push(el);
    }

    // cleanup after animation finishes
    setTimeout(() => {
      fragments.forEach((f) => f.remove());
    }, 4000);
  }

  async function addTask(e) {
    e.preventDefault();
    const title = formData.title.trim();
    const description = formData.description.trim();
    if (!title || !user) return;
    
    setIsAddingTask(true);
    
    const newTask = {
      title,
      description,
      priority: formData.priority,
      status: formData.status
    };
    
    const addedTask = await addTaskToDatabase(newTask);
    if (addedTask) {
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        status: "pending"
      });
      
      // Add animation effect
      if (formRef.current) {
        formRef.current.classList.add('task-added');
        setTimeout(() => {
          formRef.current?.classList.remove('task-added');
        }, 1000);
      }
    }
    
    setIsAddingTask(false);
  }

  async function toggleDone(id) {
    if (!user) return;
    
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const updates = { done: !task.done };
    const updatedTask = await updateTaskInDatabase(id, updates);
    
    if (updatedTask && updatedTask.done) {
      runConfetti(150);
    }
  }

  async function removeTask(id) {
    if (!user) return;
    
    const success = await deleteTaskFromDatabase(id);
    if (success) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  }

  function editTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    
    setEditAlert({
      show: true,
      task,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status
    });
  }

  const handleEditConfirm = async () => {
    const { task, title, description, priority, status } = editAlert;
    if (title.trim() === "" || !user) return;
    
    const updates = {
      title: title.trim(),
      description: description.trim(),
      priority: priority,
      status: status
    };
    
    const updatedTask = await updateTaskInDatabase(task.id, updates);
    if (updatedTask) {
      setEditAlert({ show: false, task: null, title: "", description: "", priority: "medium", status: "pending" });
    }
  };

  const handleDeleteConfirm = async () => {
    await removeTask(deleteAlert.taskId);
    setDeleteAlert({ show: false, taskId: null });
  };

  const handleClearAllConfirm = async () => {
    if (!user) return;
    
    // Delete all tasks for the user
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('user_id', user.id);

    if (!error) {
      setTasks([]);
      setClearAllAlert(false);
    }
  };

  // Fixed drag and drop functionality
  const handleDragStart = (e, index) => {
    dragItem.current = index;
    dragNode.current = e.currentTarget;
    dragNode.current.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.currentTarget.outerHTML);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (dragNode.current !== e.currentTarget) {
      const list = [...tasks];
      const draggedItem = list[dragItem.current];
      list.splice(dragItem.current, 1);
      list.splice(index, 0, draggedItem);
      dragItem.current = index;
      setTasks(list);
    }
  };

  const handleDragEnd = () => {
    if (dragNode.current) {
      dragNode.current.classList.remove("dragging");
    }
    dragItem.current = null;
    dragNode.current = null;
  };

  async function markAllDone() {
    if (!user) return;
    
    // Update all tasks to done
    const { error } = await supabase
      .from('tasks')
      .update({ done: true })
      .eq('user_id', user.id)
      .eq('done', false);

    if (!error) {
      runConfetti(200);
    }
  }

  function clearAll() {
    setClearAllAlert(true);
  }

  const remaining = tasks.filter((t) => !t.done).length;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'in-progress': return '#3b82f6';
      case 'completed': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔥';
      case 'medium': return '⚡';
      case 'low': return '🌱';
      default: return '📝';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'in-progress': return '🔄';
      case 'completed': return '✅';
      default: return '📋';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className={`kanban-loading ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="loading-content">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <h2>Loading TaskVault Pro...</h2>
          <p>Preparing your workspace</p>
        </div>
      </div>
    );
  }

  // Show login prompt if no user
  if (!user) {
    return (
      <div className={`kanban-auth ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="auth-content">
          <div className="auth-icon">🔒</div>
          <h2>Authentication Required</h2>
          <p>Please log in to access your tasks</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`kanban-container ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="kanban-layout">
        {/* Main Task Panel */}
        <div className="task-panel">
          {/* Header */}
          <div className="panel-header">
            <div className="header-content">
              <div className="logo-section">
                <div className="logo-icon">
                  <span className="logo-emoji">⚡</span>
                </div>
                <div className="logo-text">
                  <h1>TaskVault Pro</h1>
                  <p>Smart task management with real-time sync</p>
                </div>
              </div>
              
              <div className="header-stats">
                <div className="task-counter">
                  <span className="counter-number">{tasks.length}</span>
                  <span className="counter-label">Tasks</span>
                </div>
                
                <div className={`connection-status ${realtimeStatus}`}>
                  <div className="status-dot"></div>
                  <span>{realtimeStatus}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Add Task Form */}
          <form ref={formRef} className="add-task-form" onSubmit={addTask}>
            <div className="form-grid">
              <div className="form-row">
                <input
                  className="task-input"
                  placeholder="What needs to be done?"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  aria-label="Task title"
                />
                <select
                  className="task-select priority-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  aria-label="Priority"
                >
                  <option value="low">🌱 Low</option>
                  <option value="medium">⚡ Medium</option>
                  <option value="high">🔥 High</option>
                </select>
              </div>
              
              <div className="form-row">
                <input
                  className="task-input"
                  placeholder="Add description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  aria-label="Task description"
                />
                <select
                  className="task-select status-select"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  aria-label="Status"
                >
                  <option value="pending">⏳ Pending</option>
                  <option value="in-progress">🔄 In Progress</option>
                  <option value="completed">✅ Completed</option>
                </select>
              </div>
            </div>
            
            <button 
              className={`add-task-btn ${isAddingTask ? 'adding' : ''}`} 
              type="submit"
              disabled={isAddingTask}
            >
              {isAddingTask ? (
                <>
                  <span className="btn-spinner"></span>
                  Adding...
                </>
              ) : (
                <>
                  <span className="btn-icon">+</span>
                  Add Task
                </>
              )}
            </button>
          </form>

          {/* Task List */}
          <div className="task-list" role="list">
            {tasks.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">✨</div>
                <h3>No tasks yet</h3>
                <p>Add your first task to get started</p>
              </div>
            )}

            {tasks.map((task, idx) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, idx)}
                onDragEnd={handleDragEnd}
                className={`task-item ${task.done ? 'completed' : ''}`}
                role="listitem"
                aria-label={task.title}
              >
                <div className="task-drag-handle" title="Drag to reorder">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                <div className="task-content">
                  <div className="task-header">
                    <h3 className={`task-title ${task.done ? 'completed' : ''}`}>
                      {task.title}
                    </h3>
                  </div>
                  
                  {task.description && (
                    <p className={`task-description ${task.done ? 'completed' : ''}`}>
                      {task.description}
                    </p>
                  )}
                  
                  <div className="task-badges">
                    <span 
                      className={`priority-badge priority-${task.priority}`}
                      style={{ 
                        backgroundColor: getPriorityColor(task.priority) + '20', 
                        color: getPriorityColor(task.priority) 
                      }}
                    >
                      <span className="badge-icon priority-icon">{getPriorityIcon(task.priority)}</span>
                      <span className="badge-text">{task.priority.toUpperCase()}</span>
                    </span>
                    <span 
                      className={`status-badge status-${task.status}`}
                      style={{ 
                        backgroundColor: getStatusColor(task.status) + '20', 
                        color: getStatusColor(task.status) 
                      }}
                    >
                      <span className="badge-icon status-icon">{getStatusIcon(task.status)}</span>
                      <span className="badge-text">{task.status.replace('-', ' ').toUpperCase()}</span>
                    </span>
                  </div>
                  
                  <div className="task-meta">
                    <span className="task-status">
                      {task.done ? '✅ Completed' : '⏳ Pending'}
                    </span>
                  </div>
                </div>

                <div className="task-actions">
                  <button 
                    className="action-btn complete-btn" 
                    type="button" 
                    onClick={() => toggleDone(task.id)} 
                    title={task.done ? "Mark incomplete" : "Mark complete"}
                  >
                    {task.done ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>

                  <button 
                    className="action-btn edit-btn" 
                    type="button" 
                    onClick={() => editTask(task.id)} 
                    title="Edit task"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  <button 
                    className="action-btn delete-btn" 
                    type="button" 
                    onClick={() => setDeleteAlert({ show: true, taskId: task.id })} 
                    title="Delete task"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Footer Actions */}
          <div className="task-footer">
            <div className="footer-stats">
              <span className="remaining-count">{remaining} remaining</span>
            </div>
            <div className="footer-actions">
              <button 
                className="footer-btn mark-all-btn" 
                type="button" 
                onClick={markAllDone} 
                title="Mark all tasks as done"
              >
                <span className="btn-icon">✅</span>
                Mark All Done
              </button>
              <button 
                className="footer-btn clear-all-btn" 
                type="button" 
                onClick={clearAll} 
                title="Clear all tasks"
              >
                <span className="btn-icon">🗑️</span>
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="sidebar-panel">
          <div className="sidebar-content">
            <div className="sidebar-section">
              <h3>📊 Overview</h3>
              <p>Quick stats and insights</p>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{tasks.length}</div>
                  <div className="stat-label">Total Tasks</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{tasks.filter(t => t.done).length}</div>
                  <div className="stat-label">Completed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{remaining}</div>
                  <div className="stat-label">Pending</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">
                    {tasks.length > 0 ? Math.round((tasks.filter(t => t.done).length / tasks.length) * 100) : 0}%
                  </div>
                  <div className="stat-label">Progress</div>
                </div>
              </div>
            </div>

            <div className="sidebar-section">
              <h4>🎯 Priority Distribution</h4>
              <div className="priority-stats">
                <div className="priority-item high">
                  <span className="priority-icon">🔥</span>
                  <span className="priority-label">High</span>
                  <span className="priority-count">{tasks.filter(t => t.priority === 'high').length}</span>
                </div>
                <div className="priority-item medium">
                  <span className="priority-icon">⚡</span>
                  <span className="priority-label">Medium</span>
                  <span className="priority-count">{tasks.filter(t => t.priority === 'medium').length}</span>
                </div>
                <div className="priority-item low">
                  <span className="priority-icon">🌱</span>
                  <span className="priority-label">Low</span>
                  <span className="priority-count">{tasks.filter(t => t.priority === 'low').length}</span>
                </div>
              </div>
            </div>

            <div className="sidebar-section">
              <h4>💡 Tips & Tricks</h4>
              <ul className="tips-list">
                <li>🎯 Drag tasks to reorder them</li>
                <li>✨ Complete tasks to trigger confetti</li>
                <li>✏️ Use the edit button to modify tasks</li>
                <li>🏷️ Set priorities for better organization</li>
                <li>🔄 Real-time sync across devices</li>
              </ul>
            </div>

            <div className="sidebar-section">
              <h4>♿ Accessibility</h4>
              <p>Keyboard-first interactions available. Use Tab to navigate and Enter/Space to activate buttons.</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Confetti Root */}
      <div ref={confettiRootRef} className="confetti-root" aria-hidden="true"></div>

      {/* Custom Alerts */}
      <CustomAlert
        isOpen={deleteAlert.show}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        onClose={() => setDeleteAlert({ show: false, taskId: null })}
        onConfirm={handleDeleteConfirm}
      />

      <CustomAlert
        isOpen={clearAllAlert}
        title="Clear All Tasks"
        message="Are you sure you want to clear all tasks? This action cannot be undone."
        onClose={() => setClearAllAlert(false)}
        onConfirm={handleClearAllConfirm}
      />

      <CustomAlert
        isOpen={editAlert.show}
        title="Edit Task"
        message={
          <div className="edit-form">
            <div className="form-field">
              <label>Task Title *</label>
              <input
                className="edit-input"
                placeholder="Enter task title..."
                value={editAlert.title}
                onChange={(e) => setEditAlert({...editAlert, title: e.target.value})}
              />
            </div>
            <div className="form-field">
              <label>Task Description</label>
              <textarea
                className="edit-textarea"
                placeholder="Enter task description..."
                value={editAlert.description}
                onChange={(e) => setEditAlert({...editAlert, description: e.target.value})}
              />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Priority</label>
                <select
                  className="edit-select"
                  value={editAlert.priority}
                  onChange={(e) => setEditAlert({...editAlert, priority: e.target.value})}
                >
                  <option value="low">🌱 Low</option>
                  <option value="medium">⚡ Medium</option>
                  <option value="high">🔥 High</option>
                </select>
              </div>
              <div className="form-field">
                <label>Status</label>
                <select
                  className="edit-select"
                  value={editAlert.status}
                  onChange={(e) => setEditAlert({...editAlert, status: e.target.value})}
                >
                  <option value="pending">⏳ Pending</option>
                  <option value="in-progress">🔄 In Progress</option>
                  <option value="completed">✅ Completed</option>
                </select>
              </div>
            </div>
          </div>
        }
        onClose={() => setEditAlert({ show: false, task: null, title: "", description: "", priority: "medium", status: "pending" })}
        onConfirm={handleEditConfirm}
      />
    </div>
  );
}
