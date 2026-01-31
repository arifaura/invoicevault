import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './KanbanBoard.css';

const Icons = {
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Filter: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>,
  MoreHorizontal: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>,
  Check: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Calendar: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  Archive: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
};

const COLUMNS = [
  { id: 'pending', title: 'To Do', color: '#3b82f6' },
  { id: 'in-progress', title: 'In Progress', color: '#f59e0b' },
  { id: 'completed', title: 'Done', color: '#10b981' }
];

const PRIORITIES = [
  { id: 'low', label: 'Low', color: '#10b981' },
  { id: 'medium', label: 'Medium', color: '#f59e0b' },
  { id: 'high', label: 'High', color: '#ef4444' }
];

export default function ModernKanbanBoard() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    done: false
  });

  const boardRef = useRef(null);

  // Fetch tasks - removed 'position' from order since column might not exist
  useEffect(() => {
    if (!user) return;
    
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTasks(data || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();

    const channel = supabase
      .channel('tasks_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, selectedPriority]);

  const getTasksByColumn = (columnId) => {
    if (columnId === 'completed') {
      return filteredTasks.filter(task => task.done === true);
    }
    return filteredTasks.filter(task => task.status === columnId && !task.done);
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !user) return;

    // Only send fields that exist in your database schema
    const newTask = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      status: formData.status,
      done: false,
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();
      
      if (error) throw error;
      
      setTasks(prev => [data, ...prev]);
      resetForm();
      setIsTaskModalOpen(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      // Filter out fields that don't exist in schema
      const allowedUpdates = {
        title: updates.title,
        description: updates.description,
        priority: updates.priority,
        status: updates.status,
        done: updates.done
      };

      const { data, error } = await supabase
        .from('tasks')
        .update(allowedUpdates)
        .eq('id', taskId)
        .select()
        .single();
      
      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === taskId ? data : t));
      return data;
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const toggleDone = async (task) => {
    const newDoneState = !task.done;
    const updates = { 
      done: newDoneState,
      status: newDoneState ? 'completed' : 'pending'
    };
    await updateTask(task.id, updates);
  };

  const archiveTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      done: false
    });
    setEditingTask(null);
  };

  // Drag and Drop handlers
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    if (!draggedTask) return;
    
    const updates = { status: columnId };
    if (columnId === 'completed') {
      updates.done = true;
    } else {
      updates.done = false;
    }
    
    await updateTask(draggedTask.id, updates);
    setDragOverColumn(null);
  };

  const markAllDone = async () => {
    if (!user) return;
    const pending = tasks.filter(t => !t.done);
    for (const task of pending) {
      await updateTask(task.id, { done: true, status: 'completed' });
    }
  };

  const clearAll = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      setTasks([]);
    } catch (error) {
      console.error('Error clearing tasks:', error);
    }
  };

  if (loading) {
    return (
      <div className={`kanban-loading ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`kanban-auth ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="auth-content">
          <h2>Please sign in to view your board</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={`kanban-container ${isDarkMode ? 'dark' : 'light'}`}>
      <header className="kanban-header">
        <div className="header-left">
          <h1>Board</h1>
          <span className="task-count">{filteredTasks.length} tasks</span>
        </div>
        
        <div className="header-actions">
          <div className="search-box">
            <Icons.Search />
            <input 
              type="text" 
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button 
            className={`filter-btn ${isFiltersOpen ? 'active' : ''}`}
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <Icons.Filter />
            <span>Filter</span>
            {selectedPriority !== 'all' && <span className="filter-badge"></span>}
          </button>
          
          <button 
            className="add-task-btn"
            onClick={() => {
              resetForm();
              setIsTaskModalOpen(true);
            }}
          >
            <Icons.Plus />
            <span>New Task</span>
          </button>
        </div>
      </header>

      {isFiltersOpen && (
        <div className="filters-bar">
          <div className="filter-group">
            <label>Priority</label>
            <select 
              value={selectedPriority} 
              onChange={(e) => setSelectedPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              {PRIORITIES.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          
          {selectedPriority !== 'all' && (
            <button 
              className="clear-filters"
              onClick={() => setSelectedPriority('all')}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      <div className="kanban-board" ref={boardRef}>
        {COLUMNS.map(column => (
          <div 
            key={column.id}
            className={`kanban-column ${dragOverColumn === column.id ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="column-header" style={{ borderColor: column.color }}>
              <div className="column-title">
                <span className="column-dot" style={{ backgroundColor: column.color }}></span>
                <h3>{column.title}</h3>
                <span className="column-count">
                  {getTasksByColumn(column.id).length}
                </span>
              </div>
              <button 
                className="column-add"
                onClick={() => {
                  resetForm();
                  setFormData(prev => ({ ...prev, status: column.id }));
                  setIsTaskModalOpen(true);
                }}
              >
                <Icons.Plus />
              </button>
            </div>

            <div className="column-tasks">
              {getTasksByColumn(column.id).map((task) => (
                <div
                  key={task.id}
                  className={`task-card ${task.priority} ${task.done ? 'completed' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="task-header">
                    <div className="task-meta-top">
                      <span className={`priority-badge ${task.priority}`}>
                        {PRIORITIES.find(p => p.id === task.priority)?.label}
                      </span>
                    </div>
                    <div className="task-actions-menu">
                      <button 
                        className="icon-btn"
                        onClick={() => toggleDone(task)}
                        title={task.done ? "Mark undone" : "Mark done"}
                      >
                        {task.done ? <div className="check-circle checked"><Icons.Check /></div> : <div className="check-circle"></div>}
                      </button>
                    </div>
                  </div>

                  <h4 className="task-title" onClick={() => {
                    setEditingTask(task);
                    setFormData({
                      title: task.title,
                      description: task.description || '',
                      priority: task.priority || 'medium',
                      status: task.status || 'pending',
                      done: task.done || false
                    });
                    setIsTaskModalOpen(true);
                  }}>{task.title}</h4>
                  
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}

                  <div className="task-footer">
                    <button 
                      className="icon-btn small"
                      onClick={() => {
                        setEditingTask(task);
                        setFormData({
                          title: task.title,
                          description: task.description || '',
                          priority: task.priority || 'medium',
                          status: task.status || 'pending',
                          done: task.done || false
                        });
                        setIsTaskModalOpen(true);
                      }}
                      title="Edit"
                    >
                      <Icons.Edit />
                    </button>
                    <button 
                      className="icon-btn small danger"
                      onClick={() => archiveTask(task.id)}
                      title="Delete"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                </div>
              ))}
              
              <button 
                className="add-card-btn"
                onClick={() => {
                  resetForm();
                  setFormData(prev => ({ ...prev, status: column.id }));
                  setIsTaskModalOpen(true);
                }}
              >
                <Icons.Plus />
                <span>Add task</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Bar */}
      <div className="quick-actions">
        <button onClick={markAllDone} className="action-btn secondary">
          Mark All Done
        </button>
        <button onClick={clearAll} className="action-btn danger">
          Clear All
        </button>
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTaskModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <form onSubmit={editingTask ? (e) => {
              e.preventDefault();
              updateTask(editingTask.id, formData);
              setIsTaskModalOpen(false);
            } : addTask}>
              
              <div className="modal-header">
                <input
                  type="text"
                  placeholder="Task title"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="title-input"
                  autoFocus
                />
                <button 
                  type="button" 
                  className="close-btn"
                  onClick={() => setIsTaskModalOpen(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Add a more detailed description..."
                    rows={4}
                  />
                </div>

                <div className="form-row three-col">
                  <div className="form-group">
                    <label>Status</label>
                    <select 
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value})}
                    >
                      {COLUMNS.map(col => (
                        <option key={col.id} value={col.id}>{col.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priority</label>
                    <select 
                      value={formData.priority}
                      onChange={e => setFormData({...formData, priority: e.target.value})}
                    >
                      {PRIORITIES.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <div className="footer-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setIsTaskModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={!formData.title.trim()}
                  >
                    {editingTask ? 'Save Changes' : 'Create Task'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}