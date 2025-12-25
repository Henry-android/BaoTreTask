import React from "react";
import { MenuTab } from "../types";

interface SidebarProps {
  activeTab: MenuTab;
  setActiveTab: (tab: MenuTab) => void;
  user?: { email: string; role: "admin" | "user" } | null;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogout,
}) => {
  const menuItems: {
    name: MenuTab;
    label: string;
    icon: string;
    badge?: boolean;
  }[] = [
    { name: "Dashboard", label: "Tổng quan", icon: "fa-gauge-high" },
    { name: "Projects", label: "Dự án", icon: "fa-briefcase" },
    { name: "AI Insights", label: "AI Insights", icon: "fa-brain", badge: true },
    { name: "Settings", label: "Cài đặt", icon: "fa-gear" },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 z-10">
      <div className="p-8 mb-4">
        <h1 className="text-2xl font-black text-indigo-600 flex items-center gap-2">
          <i className="fa-solid fa-shield-halved"></i>
          Guardian
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setActiveTab(item.name)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === item.name
                ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <i
                className={`fa-solid ${item.icon} w-5 text-center ${
                  activeTab === item.name
                    ? "text-indigo-600"
                    : "text-slate-400 group-hover:text-indigo-500"
                }`}
              ></i>
              <span className="font-bold text-sm">{item.label}</span>
            </div>
            {item.badge && (
              <span className="w-2 h-2 bg-red-500 rounded-full ring-4 ring-red-50"></span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/50">
          <img
            src={`https://picsum.photos/seed/${encodeURIComponent(
              user?.role || "user"
            )}/40/40`}
            alt={user?.email || "User"}
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
          />
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate text-slate-800">
              {user?.email || "User"}
            </p>
            <p className="text-[10px] text-indigo-600 uppercase font-black tracking-wider">
              {user?.role === "admin" ? "Quản trị" : "Người dùng"}
            </p>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold transition-all shadow-sm"
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            Đăng xuất
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
