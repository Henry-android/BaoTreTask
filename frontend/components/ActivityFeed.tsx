
import React from 'react';
import { ActivityLog } from '../types';

interface ActivityFeedProps {
  logs: ActivityLog[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ logs }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl flex flex-col h-full overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">
          <i className="fa-solid fa-bolt-lightning mr-2 text-indigo-500"></i>
          Dòng sự kiện
        </h3>
        <span className="flex h-2 w-2 rounded-full bg-emerald-500">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-40">
            <i className="fa-solid fa-satellite-dish text-2xl mb-2"></i>
            <p className="text-slate-500 text-xs font-bold italic">Đang lắng nghe sự kiện...</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="group relative pl-5 border-l-2 border-slate-100 hover:border-indigo-400 transition-colors">
              <div className="absolute -left-[6px] top-0 w-[10px] h-[10px] rounded-full bg-white border-2 border-slate-200 group-hover:border-indigo-500 transition-colors"></div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{log.timestamp}</p>
              <p className="text-xs font-bold text-slate-700 mt-1 leading-snug">
                <span className="text-indigo-600">AI:</span> {log.message}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 font-medium bg-slate-50 px-2 py-0.5 rounded-md inline-block">Công việc: {log.taskTitle}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
