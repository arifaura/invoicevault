import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
  pointerWithin,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import confetti from 'canvas-confetti';
import { FiEdit2, FiTrash2, FiPlus, FiClock, FiPlay, FiCheckCircle, FiList } from 'react-icons/fi';

// --- Demo seed tasks ---
const seedTasks = [
  { id: '1', title: 'Design new logo', description: 'Create a modern logo for the company rebrand', status: 'pending', priority: 'high', createdAt: Date.now() - 100000 },
  { id: '2', title: 'Update website content', description: 'Refresh all product pages with Q4 copy', status: 'ongoing', priority: 'medium', createdAt: Date.now() - 90000 },
  { id: '3', title: 'Prepare quarterly report', description: 'Compile data and create Q4 financial report', status: 'completed', priority: 'high', createdAt: Date.now() - 80000 },
  { id: '4', title: 'Client meeting preparation', description: 'Slides and materials for Monday meeting', status: 'pending', priority: 'medium', createdAt: Date.now() - 70000 },
  { id: '5', title: 'Code review', description: 'Review pull requests and provide feedback', status: 'ongoing', priority: 'low', createdAt: Date.now() - 60000 },
];

const STORAGE_KEY = 'kanbanTasks';

// --- KPI Cards ---
const KPICard = ({ title, value, icon: Icon, color, isDarkMode }) => (
  <div className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-lg ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
        <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

// --- Task Card ---
const TaskCard = ({ task, isDragging, onEdit, onDelete, isOverlay = false }) => {
  const { isDarkMode } = useTheme();

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(task);
  };

  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(task.id);
  };

  return (
    <div
      className={`p-4 mb-3 rounded-lg border transition-all duration-200 cursor-move
        ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}
        ${isDragging ? 'opacity-50 rotate-2' : ''}
        ${isOverlay ? 'shadow-2xl scale-105' : 'shadow-sm hover:shadow-md'}
        transform-gpu`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{task.title}</h3>
        {!isOverlay && (
          <div className="flex items-center gap-2">
            <button 
              type="button"
              aria-label="Edit" 
              className={`p-2 rounded hover:opacity-80 transition-all duration-200 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`} 
              onClick={handleEditClick}
            >
              <FiEdit2 size={16} />
            </button>
            <button 
              type="button"
              aria-label="Delete" 
              className={`p-2 rounded hover:opacity-80 transition-all duration-200 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-red-400' : 'text-gray-600 hover:bg-gray-200 hover:text-red-600'}`} 
              onClick={handleDeleteClick}
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        )}
      </div>
      <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{task.description}</p>
      <div className="flex gap-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </span>
      </div>
    </div>
  );
};

const SortableTaskCard = ({ task, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: task.id,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });
  
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition: transition || 'transform 200ms ease',
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="select-none touch-pan-y md:touch-none"
    >
      <TaskCard task={task} isDragging={isDragging} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
};

// --- Column ---
const DroppableColumn = ({ id, title, items, isDarkMode, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`snap-start min-w-[260px] sm:min-w-[300px] max-w-[360px] p-4 rounded-xl border transition-all duration-200
        ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'}
        ${isOver ? (isDarkMode ? 'ring-2 ring-blue-500/40 bg-gray-800/70' : 'ring-2 ring-blue-400/40 bg-gray-50/70') : ''}
        shadow-sm hover:shadow-md`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
        <span className={`${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'} px-3 py-1 rounded-full text-sm font-medium`}>
          {items.length}
        </span>
      </div>
      <div className="space-y-3 min-h-[200px]">
        {children}
      </div>
    </div>
  );
};

// --- Modal ---
const TaskModal = ({ isOpen, onClose, onSave, initialData, isDarkMode }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setPriority(initialData.priority || 'medium');
      setStatus(initialData.status || 'pending');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('pending');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim(), priority, status });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative w-full max-w-md mx-4 rounded-xl p-6 shadow-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <h3 className="text-xl font-semibold mb-4">{initialData ? 'Edit Task' : 'Add Task'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm block mb-1">Title *</label>
            <input 
              className={`w-full rounded-md border px-3 py-2 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`} 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm block mb-1">Description</label>
            <textarea 
              className={`w-full rounded-md border px-3 py-2 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`} 
              rows={3} 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm block mb-1">Priority</label>
              <select 
                className={`w-full rounded-md border px-3 py-2 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`} 
                value={priority} 
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-sm block mb-1">Status</label>
              <select 
                className={`w-full rounded-md border px-3 py-2 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`} 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </form>

        <div className="mt-6 flex justify-end gap-3">
          <button 
            className={`${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'} px-4 py-2 rounded-md`} 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700" 
            onClick={handleSubmit}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Board ---
const KanbanBoard = () => {
  const { isDarkMode } = useTheme();
  const [activeId, setActiveId] = useState(null);

  // Load from localStorage once
  const [tasks, setTasks] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* ignore */ }
    }
    return seedTasks;
  });

  // Persist to localStorage when tasks change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const tasksByStatus = useMemo(() => ({
    all: tasks,
    pending: tasks.filter(t => t.status === 'pending'),
    ongoing: tasks.filter(t => t.status === 'ongoing'),
    completed: tasks.filter(t => t.status === 'completed'),
  }), [tasks]);

  const findContainer = (id) => {
    if (['all', 'pending', 'ongoing', 'completed'].includes(id)) return id;
    const task = tasks.find(t => t.id === id);
    return task ? task.status : null;
  };

  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    
    if (!over) return;
    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    const overContainer = findContainer(over.id);
    if (!overContainer) return;

    // Move to different status (except 'all')
    if (overContainer !== 'all' && activeTask.status !== overContainer) {
      setTasks(prev => prev.map(t => t.id === active.id ? { ...t, status: overContainer } : t));
      if (overContainer === 'completed') {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.25 }, colors: ['#22c55e', '#10b981', '#34d399'] });
      }
      return;
    }

    // Reorder visually inside All list
    if (over.id !== active.id) {
      const activeIndex = tasks.findIndex(t => t.id === active.id);
      const overIndex = tasks.findIndex(t => t.id === over.id);
      setTasks(items => arrayMove(items, activeIndex, overIndex));
    }
  };

  // --- CRUD handlers ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const openAddModal = () => { 
    setEditingTask(null); 
    setIsModalOpen(true); 
  };
  
  const openEditModal = (task) => { 
    console.log('Opening edit modal for task:', task);
    setEditingTask(task); 
    setIsModalOpen(true); 
  };
  
  const closeModal = () => { 
    console.log('Closing modal');
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const saveTask = ({ title, description, priority, status }) => {
    console.log('Saving task:', { title, description, priority, status });
    if (!title.trim()) { closeModal(); return; }

    if (editingTask) {
      // Update existing
      console.log('Updating existing task:', editingTask.id);
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, title, description, priority, status } : t));
    } else {
      // Create new
      console.log('Creating new task');
      const newTask = {
        id: String(Date.now()),
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        createdAt: Date.now(),
      };
      setTasks(prev => [newTask, ...prev]);
    }
    
    if (status === 'completed' && !editingTask) {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.25 }, colors: ['#22c55e', '#10b981', '#34d399'] });
    }
    closeModal();
  };

  const deleteTask = (id) => {
    console.log('Deleting task with ID:', id);
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(prev => prev.filter(t => t.id !== id));
      console.log('Task deleted successfully');
    }
  };

  const columns = [
    { id: 'all', title: 'All' },
    { id: 'pending', title: 'Pending' },
    { id: 'ongoing', title: 'Ongoing' },
    { id: 'completed', title: 'Completed' },
  ];

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <div className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} min-h-screen p-4 md:p-6 transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto">
        {/* KPI Dashboard */}
        <div className="mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Task Management Board</h1>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Drag tasks between columns to update status</p>
            </div>
            <button 
              onClick={openAddModal} 
              className="w-full sm:w-auto inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
            >
              <FiPlus size={16} /> Add Task
            </button>
          </div>
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <KPICard 
              title="Total Tasks" 
              value={tasksByStatus.all.length} 
              icon={FiList} 
              color="bg-blue-500" 
              isDarkMode={isDarkMode} 
            />
            <KPICard 
              title="Pending" 
              value={tasksByStatus.pending.length} 
              icon={FiClock} 
              color="bg-yellow-500" 
              isDarkMode={isDarkMode} 
            />
            <KPICard 
              title="In Progress" 
              value={tasksByStatus.ongoing.length} 
              icon={FiPlay} 
              color="bg-blue-500" 
              isDarkMode={isDarkMode} 
            />
            <KPICard 
              title="Completed" 
              value={tasksByStatus.completed.length} 
              icon={FiCheckCircle} 
              color="bg-green-500" 
              isDarkMode={isDarkMode} 
            />
          </div>
        </div>

        <DndContext 
          sensors={sensors} 
          collisionDetection={pointerWithin} 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 md:mx-0 px-4 snap-x snap-mandatory">
            {/* All */}
            <DroppableColumn id="all" title="All" items={tasksByStatus.all} isDarkMode={isDarkMode}>
              <SortableContext items={tasksByStatus.all.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {tasksByStatus.all.map((task) => (
                  <SortableTaskCard key={task.id} task={task} onEdit={openEditModal} onDelete={deleteTask} />
                ))}
              </SortableContext>
            </DroppableColumn>

            {/* Pending */}
            <DroppableColumn id="pending" title="Pending" items={tasksByStatus.pending} isDarkMode={isDarkMode}>
              <SortableContext items={tasksByStatus.pending.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {tasksByStatus.pending.map((task) => (
                  <SortableTaskCard key={task.id} task={task} onEdit={openEditModal} onDelete={deleteTask} />
                ))}
              </SortableContext>
            </DroppableColumn>

            {/* Ongoing */}
            <DroppableColumn id="ongoing" title="Ongoing" items={tasksByStatus.ongoing} isDarkMode={isDarkMode}>
              <SortableContext items={tasksByStatus.ongoing.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {tasksByStatus.ongoing.map((task) => (
                  <SortableTaskCard key={task.id} task={task} onEdit={openEditModal} onDelete={deleteTask} />
                ))}
              </SortableContext>
            </DroppableColumn>

            {/* Completed */}
            <DroppableColumn id="completed" title="Completed" items={tasksByStatus.completed} isDarkMode={isDarkMode}>
              <SortableContext items={tasksByStatus.completed.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {tasksByStatus.completed.map((task) => (
                  <SortableTaskCard key={task.id} task={task} onEdit={openEditModal} onDelete={deleteTask} />
                ))}
              </SortableContext>
            </DroppableColumn>
          </div>

          {/* Drag Overlay for smooth animations */}
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} isOverlay={true} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={saveTask}
        initialData={editingTask}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default KanbanBoard;
