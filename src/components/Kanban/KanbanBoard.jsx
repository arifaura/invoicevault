import React, { useState, useEffect, useRef } from "react";
import { useTheme } from '../../context/ThemeContext';
import CustomAlert from '../Common/CustomAlert';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// Modern Todo — React component that can be previewed in the canvas
// This file replaces the previous full-HTML demo (which caused a parsing error
// in the code/react preview because it started with `<!doctype html>`).

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function ModernTodo() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState('connecting');

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

    // No more sample tasks initialization

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Simple DOM-based confetti (no external deps) — creates colorful falling particles
  function runConfetti(count = 80) {
    const root = confettiRootRef.current;
    if (!root) return;
    const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#06b6d4"];
    const fragments = [];

    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      const size = Math.round(6 + Math.random() * 10);
      const left = Math.round(Math.random() * 100);
      const delay = (Math.random() * 0.6).toFixed(2);
      const rotation = Math.round(Math.random() * 360);
      el.style.position = "absolute";
      el.style.left = `${left}%`;
      el.style.top = `-10px`;
      el.style.width = `${size}px`;
      el.style.height = `${size * 0.6}px`;
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.opacity = "0.95";
      el.style.borderRadius = "3px";
      el.style.transform = `rotate(${rotation}deg)`;
      el.style.pointerEvents = "none";
      el.style.zIndex = 9999;
      el.style.willChange = "transform, top, opacity";
      el.style.animation = `confettiFall ${2 + Math.random() * 1.2}s ${delay}s linear forwards`;

      root.appendChild(el);
      fragments.push(el);
    }

    // cleanup after animation finishes
    setTimeout(() => {
      fragments.forEach((f) => f.remove());
    }, 3500);
  }

  async function addTask(e) {
    e.preventDefault();
    const title = formData.title.trim();
    const description = formData.description.trim();
    if (!title || !user) return;
    
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
    }
  }

  async function toggleDone(id) {
    if (!user) return;
    
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const updates = { done: !task.done };
    const updatedTask = await updateTaskInDatabase(id, updates);
    
    if (updatedTask && updatedTask.done) {
      runConfetti(120);
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

  function handleDragStart(e, index) {
    dragItem.current = index;
    dragNode.current = e.currentTarget;
    dragNode.current.classList.add("dragging");
    try {
      e.dataTransfer.setData("text/plain", "drag");
      e.dataTransfer.effectAllowed = "move";
    } catch (err) {}
  }

  function handleDragEnter(e, index) {
    e.preventDefault();
    if (!dragNode.current || dragNode.current === e.currentTarget) return;
    setTasks((old) => {
      const list = [...old];
      const draggedItem = list.splice(dragItem.current, 1)[0];
      list.splice(index, 0, draggedItem);
      dragItem.current = index;
      return list;
    });
  }

  function handleDragEnd() {
    if (dragNode.current) dragNode.current.classList.remove("dragging");
    dragItem.current = null;
    dragNode.current = null;
  }

  async function markAllDone() {
    if (!user) return;
    
    // Update all tasks to done
    const { error } = await supabase
      .from('tasks')
      .update({ done: true })
      .eq('user_id', user.id)
      .eq('done', false);

    if (!error) {
      runConfetti(140);
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

  // Show loading state
  if (loading) {
    return (
      <div style={{ 
        padding: 20, 
        fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial", 
        minHeight: '100vh', 
        background: isDarkMode ? 'linear-gradient(180deg,#07102a 0%, #071b2f 60%)' : 'linear-gradient(180deg,#f8fafc 0%, #e2e8f0 60%)', 
        color: isDarkMode ? '#e6eef8' : '#1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⚡</div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>Loading TaskVault Pro...</div>
        </div>
      </div>
    );
  }

  // Show login prompt if no user
  if (!user) {
    return (
      <div style={{ 
        padding: 20, 
        fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial", 
        minHeight: '100vh', 
        background: isDarkMode ? 'linear-gradient(180deg,#07102a 0%, #071b2f 60%)' : 'linear-gradient(180deg,#f8fafc 0%, #e2e8f0 60%)', 
        color: isDarkMode ? '#e6eef8' : '#1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>🔒</div>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Authentication Required</div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>Please log in to access your tasks</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 20, 
      fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial", 
      minHeight: '100vh', 
      background: isDarkMode ? 'linear-gradient(180deg,#07102a 0%, #071b2f 60%)' : 'linear-gradient(180deg,#f8fafc 0%, #e2e8f0 60%)', 
      color: isDarkMode ? '#e6eef8' : '#1e293b' 
    }}>

      {/* styles scoped into component to keep single-file preview friendly */}
      <style>{`
        .app{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 360px;gap:24px;align-items:start}
        @media(max-width:920px){.app{grid-template-columns:1fr;padding-bottom:40px}}
        .panel{background:${isDarkMode ? 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))' : 'linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0.6))'};border-radius:12px;padding:18px;box-shadow:0 6px 30px ${isDarkMode ? 'rgba(2,6,23,0.6)' : 'rgba(0,0,0,0.1)'};border:1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.1)'}}
        .header{display:flex;align-items:center;justify-content:center;margin-bottom:12px;position:relative;min-height:80px;padding-right:100px}
        .logo{display:flex;gap:12px;align-items:center;padding:16px 20px;border-radius:12px;background:${isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.95)'};border:2px solid ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'};box-shadow:0 6px 25px ${isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'},0 0 0 1px ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}}
        .mark{width:46px;height:46px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#2dd4bf);display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;box-shadow:0 6px 20px rgba(124,58,237,0.18)}
        h1{margin:0;font-size:26px;font-weight:900;color:${isDarkMode ? '#ffffff' : '#1e293b'};text-shadow:0 3px 6px ${isDarkMode ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0.5)'},0 0 30px ${isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.2)'};filter:drop-shadow(0 3px 6px ${isDarkMode ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0.5)'});letter-spacing:1.5px;-webkit-text-stroke:${isDarkMode ? '2px rgba(0,0,0,1)' : '1px rgba(0,0,0,0.5)'};background:${isDarkMode ? 'linear-gradient(45deg, #ffffff, #f0f9ff)' : 'linear-gradient(45deg, #1e293b, #334155)'};-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .lead{margin:0;color:${isDarkMode ? '#9aa4b2' : '#64748b'};font-size:13px;font-weight:500}
        .task-count{position:absolute;right:20px;top:50%;transform:translateY(-50%);background:${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};padding:6px 10px;border-radius:6px;border:1px solid ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};max-width:70px;overflow:hidden;white-space:nowrap;font-size:12px}
        .addRow{display:flex;flex-direction:column;gap:10px;margin-top:10px}
        .form-row{display:flex;gap:10px}
        .input{flex:1;padding:10px 14px;border-radius:10px;background:transparent;border:1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.1)'};outline:none;color:${isDarkMode ? '#e6eef8' : '#1e293b'};transition:transform .15s ease, box-shadow .15s ease;font-weight:500}
        .input:focus{transform:translateY(-2px);box-shadow:0 8px 30px rgba(124,58,237,0.12);border-color: rgba(124,58,237,0.9)}
        .select{flex:1;padding:10px 14px;border-radius:10px;background:transparent;border:1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.1)'};outline:none;color:${isDarkMode ? '#e6eef8' : '#1e293b'};cursor:pointer;font-weight:500}
        .btn{padding:10px 14px;border-radius:10px;background:linear-gradient(90deg,#7c3aed,#06b6d4);border:none;color:white;font-weight:600;cursor:pointer;box-shadow:0 6px 18px rgba(124,58,237,0.18)}
        .list{margin-top:16px;display:flex;flex-direction:column;gap:10px}
        .task{display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;background:${isDarkMode ? 'linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.015))' : 'linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0.6))'};border:1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.1)'};transition:transform .18s cubic-bezier(.2,.9,.3,1),box-shadow .18s ease,opacity .18s ease}
        .task.dragging{transform:scale(1.02) translateX(6px);box-shadow:0 10px 40px ${isDarkMode ? 'rgba(2,6,23,0.6)' : 'rgba(0,0,0,0.2)'};opacity:0.98}
        .handle{width:36px;height:36px;border-radius:8px;background:${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)'};display:flex;align-items:center;justify-content:center;cursor:grab}
        .title{flex:1;display:flex;flex-direction:column}
        .title strong{font-size:15px;font-weight:600;color:${isDarkMode ? '#e6eef8' : '#1e293b'}}
        .title small{color:${isDarkMode ? '#9aa4b2' : '#64748b'};font-size:12px;font-weight:500}
        .priority-badge{display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600;text-transform:uppercase;margin-left:8px}
        .status-badge{display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600;text-transform:uppercase;margin-left:8px}
        .actions{display:flex;gap:8px;align-items:center}
        .icon-btn{width:36px;height:36px;border-radius:8px;background:transparent;border:1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.1)'};display:flex;align-items:center;justify-content:center;cursor:pointer;color:${isDarkMode ? '#e6eef8' : '#1e293b'}}
        .icon-btn:hover{background:${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}}
        .completed{opacity:0.6;text-decoration:line-through}
        .empty{padding:28px;border-radius:12px;border:1px dashed ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.1)'};color:${isDarkMode ? '#9aa4b2' : '#64748b'};text-align:center;font-weight:500}
        .sidebar h3{margin:0;font-size:14px;font-weight:600;color:${isDarkMode ? '#e6eef8' : '#1e293b'}}
        .sidebar h4{margin:0;font-size:13px;font-weight:600;color:${isDarkMode ? '#e6eef8' : '#1e293b'}}
        .stats{display:flex;gap:8px;margin-top:12px}
        .stat{background:${isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.05)'};padding:10px;border-radius:10px;flex:1;text-align:center}
        .stat div:first-child{font-weight:700;color:${isDarkMode ? '#e6eef8' : '#1e293b'}}
        .stat div:last-child{font-weight:500;color:${isDarkMode ? '#9aa4b2' : '#64748b'}}

        /* confetti animation */
        @keyframes confettiFall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1 }
          100% { transform: translateY(95vh) rotate(360deg); opacity: 0 }
        }
        /* fallback name used in element creation */
        @keyframes confettiFallSmall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1 }
          100% { transform: translateY(85vh) rotate(540deg); opacity: 0 }
        }
        .confetti-root{position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden}
        
        /* real-time status indicator */
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div className="app">
        <div className="panel" role="region" aria-label="Todo list">
          <div className="header">
            <div className="logo">
              <div className="mark">⚡</div>
            <div>
                <h1>TaskVault Pro</h1>
                <p className="lead">Smart task management with drag & drop, priorities & confetti celebrations ✨</p>
              </div>
            </div>
            <div className="task-count">
              <small style={{ color: isDarkMode ? "#9aa4b2" : "#64748b", fontWeight: 500 }}>
                Tasks: <strong style={{ marginLeft: 6 }}>{tasks.length}</strong>
              </small>
            </div>
            <div style={{ 
              position: 'absolute', 
              right: '20px', 
              top: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontSize: '11px',
              color: isDarkMode ? '#9aa4b2' : '#64748b'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: realtimeStatus === 'connected' ? '#10b981' : 
                               realtimeStatus === 'connecting' ? '#f59e0b' : '#ef4444',
                animation: realtimeStatus === 'connecting' ? 'pulse 2s infinite' : 'none'
              }}></div>
              <span style={{ textTransform: 'uppercase', fontWeight: '500' }}>
                {realtimeStatus}
              </span>
            </div>
          </div>

          <form className="addRow" onSubmit={addTask}>
            <div className="form-row">
              <input
                className="input"
                placeholder="Task title..."
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                aria-label="Task title"
              />
              <select
                className="select"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                aria-label="Priority"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-row">
              <input
                className="input"
                placeholder="Task description..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                aria-label="Task description"
              />
              <select
                className="select"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                aria-label="Status"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <button className="btn" type="submit">Add Task</button>
          </form>

          <div className="list" role="list">
            {tasks.length === 0 && <div className="empty" style={{ marginTop: 14 }}>No tasks yet — add your first task ✨</div>}

            {tasks.map((t, idx) => (
              <div
                key={t.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragEnter={(e) => handleDragEnter(e, idx)}
                onDragEnd={handleDragEnd}
                className={`task`}
                role="listitem"
                aria-label={t.title}
                style={{ cursor: 'grab' }}
              >
                <div className="handle" title="Drag to reorder">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>

                <div className={`title ${t.done ? 'completed' : ''}`}>
                  <strong>
                    {t.title}
                    <span 
                      className="priority-badge" 
                      style={{ 
                        backgroundColor: getPriorityColor(t.priority) + '20', 
                        color: getPriorityColor(t.priority) 
                      }}
                    >
                      {t.priority}
                    </span>
                    <span 
                      className="status-badge" 
                      style={{ 
                        backgroundColor: getStatusColor(t.status) + '20', 
                        color: getStatusColor(t.status) 
                      }}
                    >
                      {t.status}
                    </span>
                  </strong>
                  <small>{t.description || 'No description'}</small>
                  <small>{t.done ? 'Completed' : 'Incomplete'}</small>
                </div>

                <div className="actions">
                  <button className="icon-btn" type="button" onClick={() => toggleDone(t.id)} title="Toggle complete">
                    {t.done ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                  </button>

                  <button className="icon-btn" type="button" onClick={() => editTask(t.id)} title="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>

                  <button className="icon-btn" type="button" onClick={() => setDeleteAlert({ show: true, taskId: t.id })} title="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <small style={{ color: isDarkMode ? '#9aa4b2' : '#64748b', fontWeight: 500 }}>{remaining} remaining</small>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="icon-btn" type="button" onClick={markAllDone} title="Mark all done" style={{ padding: '8px 12px', width: 'auto' }}>
                <span style={{ fontSize: '12px', fontWeight: 500 }}>All Done</span>
              </button>
              <button className="icon-btn" type="button" onClick={clearAll} title="Clear" style={{ padding: '8px 12px', width: 'auto' }}>
                <span style={{ fontSize: '12px', fontWeight: 500 }}>Clear All</span>
              </button>
            </div>
          </div>
        </div>

        <aside className="panel sidebar">
          <h3>Overview</h3>
          <p className="lead" style={{ marginTop: 6 }}>Quick stats and filters</p>

          <div className="stats">
            <div className="stat">
              <div style={{ fontSize: 18, fontWeight: 700 }}>{tasks.length}</div>
              <div style={{ fontSize: 12, color: isDarkMode ? '#9aa4b2' : '#64748b' }}>Total</div>
            </div>
            <div className="stat">
              <div style={{ fontSize: 18, fontWeight: 700 }}>{tasks.filter(t => t.done).length}</div>
              <div style={{ fontSize: 12, color: isDarkMode ? '#9aa4b2' : '#64748b' }}>Completed</div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <h4 style={{ margin: '8px 0' }}>Priority Distribution</h4>
            <div style={{ color: isDarkMode ? '#9aa4b2' : '#64748b', fontSize: 13, fontWeight: 500 }}>
              <div>High: {tasks.filter(t => t.priority === 'high').length}</div>
              <div>Medium: {tasks.filter(t => t.priority === 'medium').length}</div>
              <div>Low: {tasks.filter(t => t.priority === 'low').length}</div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <h4 style={{ margin: '8px 0' }}>Tips</h4>
            <ul style={{ color: isDarkMode ? '#9aa4b2' : '#64748b', paddingLeft: 18, lineHeight: 1.6, fontWeight: 500 }}>
              <li>Drag items to reorder them.</li>
              <li>Click the circle icon to complete a task and trigger confetti.</li>
              <li>Use the Edit button to quickly rename a task.</li>
              <li>Set priority and status for better organization.</li>
            </ul>
          </div>

          <div style={{ marginTop: 18 }}>
            <h4 style={{ margin: '8px 0' }}>Accessibility</h4>
            <p style={{ color: isDarkMode ? '#9aa4b2' : '#64748b', fontSize: 13, fontWeight: 500 }}>Keyboard-first interactions available via browser defaults. Use the buttons for actions.</p>
          </div>
        </aside>
          </div>

      {/* confetti root */}
      <div ref={confettiRootRef} className="confetti-root" aria-hidden="true"></div>

      {/* small helpful footer */}
      <div style={{ maxWidth: 1100, margin: '18px auto 0', color: isDarkMode ? '#9aa4b2' : '#64748b', fontSize: 13, fontWeight: 500 }}>
        Tip: This preview uses an in-component confetti implementation (no external library) so it works inside the canvas preview.
      </div>

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px 0' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600', 
                color: isDarkMode ? '#e6eef8' : '#1e293b',
                fontSize: '14px'
              }}>
                Task Title *
              </label>
              <input
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: `2px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                  color: isDarkMode ? '#e6eef8' : '#1e293b',
                  fontSize: '14px',
                  fontWeight: '500',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                placeholder="Enter task title..."
                value={editAlert.title}
                onChange={(e) => setEditAlert({...editAlert, title: e.target.value})}
                onFocus={(e) => {
                  e.target.style.borderColor = '#7c3aed';
                  e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600', 
                color: isDarkMode ? '#e6eef8' : '#1e293b',
                fontSize: '14px'
              }}>
                Task Description
              </label>
              <textarea
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: `2px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                  color: isDarkMode ? '#e6eef8' : '#1e293b',
                  fontSize: '14px',
                  fontWeight: '500',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  minHeight: '80px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                placeholder="Enter task description..."
                value={editAlert.description}
                onChange={(e) => setEditAlert({...editAlert, description: e.target.value})}
                onFocus={(e) => {
                  e.target.style.borderColor = '#7c3aed';
                  e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600', 
                  color: isDarkMode ? '#e6eef8' : '#1e293b',
                  fontSize: '14px'
                }}>
                  Priority
                </label>
                <select
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: `2px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                    color: isDarkMode ? '#e6eef8' : '#1e293b',
                    fontSize: '14px',
                    fontWeight: '500',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  value={editAlert.priority}
                  onChange={(e) => setEditAlert({...editAlert, priority: e.target.value})}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7c3aed';
                    e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600', 
                  color: isDarkMode ? '#e6eef8' : '#1e293b',
                  fontSize: '14px'
                }}>
                  Status
                </label>
                <select
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: `2px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                    color: isDarkMode ? '#e6eef8' : '#1e293b',
                    fontSize: '14px',
                    fontWeight: '500',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  value={editAlert.status}
                  onChange={(e) => setEditAlert({...editAlert, status: e.target.value})}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7c3aed';
                    e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
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
