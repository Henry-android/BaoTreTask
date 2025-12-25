
import React from 'react';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onAnalyze: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onAnalyze }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'To Do': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'In Progress': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'Done': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-amber-600';
      case 'Low': return 'text-emerald-600';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className={`group relative bg-white rounded-2xl p-6 transition-all duration-300 border shadow-sm hover:shadow-xl hover:-translate-y-1 ${
      task.isOverdue ? 'border-red-200 shadow-red-50' : 'border-slate-100 hover:border-indigo-200'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <span className={`text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-lg border ${getStatusColor(task.status)}`}>
          {task.status}
        </span>
        <span className={`text-xs font-bold flex items-center gap-1.5 ${getPriorityColor(task.priority)}`}>
          <i className="fa-solid fa-fire-flame-curved text-[10px]"></i>
          {task.priority}
        </span>
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-5 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
        {task.title}
      </h3>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <img src={task.assignee.avatar} alt={task.assignee.name} className="w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100" />
          <span className="text-xs font-bold text-slate-600">{task.assignee.name}</span>
        </div>
        
        <div className={`flex flex-col items-end ${task.isOverdue ? 'text-red-600' : 'text-slate-400'}`}>
          <span className="text-[9px] uppercase font-black tracking-widest opacity-60">Due Date</span>
          <span className="text-xs font-bold">{task.deadline}</span>
        </div>
      </div>

      {task.isOverdue && (
        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-red-600 text-[11px] font-black uppercase tracking-tighter animate-pulse">
            <i className="fa-solid fa-clock-rotate-left"></i>
            Overdue
          </span>
          <button
            onClick={() => onAnalyze(task)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-red-100"
          >
            <i className="fa-solid fa-robot"></i>
            AI Risk Analysis
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
