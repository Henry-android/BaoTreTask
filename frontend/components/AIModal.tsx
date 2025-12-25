import React, { useState, useEffect } from "react";
import { AIRiskResult, Task } from "../types";
import { analyzeTask } from "../services/backendApi";

interface AIModalProps {
  task: Task | null;
  onClose: () => void;
}

const AIModal: React.FC<AIModalProps> = ({ task, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AIRiskResult | null>(null);

  useEffect(() => {
    if (task) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const data = await analyzeTask(task.id);
          setTimeout(() => {
            setResult(data);
            setLoading(false);
          }, 1500);
        } catch (error) {
          console.error(error);
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [task]);

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 rotate-3 group-hover:rotate-0 transition-transform">
              <i className="fa-solid fa-robot text-2xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Guardian AI</h2>
              <p className="text-xs text-indigo-600 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                Strategic Analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-white hover:shadow-sm text-slate-400 hover:text-red-500 transition-all flex items-center justify-center"
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-8 max-h-[65vh] overflow-y-auto">
          <div className="mb-8 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50">
            <p className="text-[10px] text-indigo-400 uppercase tracking-[0.2em] font-black mb-1">
              Analyzing Target
            </p>
            <p className="text-xl font-bold text-slate-900 leading-tight">
              {task.title}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-xs font-bold text-red-500 bg-white px-3 py-1 rounded-full shadow-sm">
                <i className="fa-solid fa-calendar-xmark mr-1.5"></i>
                {task.deadline}
              </span>
              <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm">
                <i className="fa-solid fa-user mr-1.5"></i>
                {task.assignee.name}
              </span>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex gap-5">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex-shrink-0 flex items-center justify-center text-indigo-500 border border-slate-100">
                <i className="fa-solid fa-comment-dots"></i>
              </div>

              {loading ? (
                <div className="flex items-center gap-1.5 p-4 bg-slate-50 rounded-3xl rounded-tl-none border border-slate-100">
                  <span className="typing-dot w-2 h-2 bg-indigo-400 rounded-full"></span>
                  <span className="typing-dot w-2 h-2 bg-indigo-400 rounded-full"></span>
                  <span className="typing-dot w-2 h-2 bg-indigo-400 rounded-full"></span>
                  <span className="ml-3 text-xs font-bold text-slate-400 italic">
                    Processing neural patterns...
                  </span>
                </div>
              ) : (
                <div className="space-y-8 flex-1">
                  {/* Risk Section */}
                  <div className="animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center text-red-600 text-[10px]">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-red-600">
                        The Risk
                      </h3>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed font-medium pl-8">
                      {result?.risk}
                    </p>
                  </div>

                  {/* Solution Section */}
                  <div className="animate-in slide-in-from-bottom-4 duration-700 fill-mode-backwards">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 text-[10px]">
                        <i className="fa-solid fa-lightbulb"></i>
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600">
                        The Solution
                      </h3>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed font-medium pl-8">
                      {result?.solution}
                    </p>
                  </div>

                  {/* Reminder Section */}
                  <div className="animate-in slide-in-from-bottom-4 duration-1000 fill-mode-backwards">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px]">
                        <i className="fa-solid fa-bell"></i>
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600">
                        Guardian Note
                      </h3>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 italic text-slate-500 text-sm leading-relaxed relative overflow-hidden">
                      <i className="fa-solid fa-quote-left absolute -top-2 -left-1 text-slate-200 text-4xl opacity-50"></i>
                      <p className="relative z-10">{result?.reminder}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-white hover:bg-slate-100 text-slate-600 font-black rounded-2xl transition-all border border-slate-200 shadow-sm text-sm"
          >
            Dismiss
          </button>
          <button
            onClick={onClose}
            className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-100 text-sm"
          >
            Execute Solution
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIModal;
