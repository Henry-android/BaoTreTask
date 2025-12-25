import React, { useState } from "react";
import { login, register } from "../services/authApi";

type Mode = "login" | "register";

interface AuthPanelProps {
  onAuthed: (token: string) => void;
}

const AuthPanel: React.FC<AuthPanelProps> = ({ onAuthed }) => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resp =
        mode === "login"
          ? await login(email, password)
          : await register(email, password);
      onAuthed(resp.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-[2rem] shadow-xl shadow-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <h1 className="text-2xl font-black text-indigo-600 flex items-center gap-2">
            <i className="fa-solid fa-shield-halved"></i>
            Guardian
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Đăng nhập để xem dashboard và nhận cảnh báo task trễ.
          </p>
        </div>

        <div className="p-8">
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all ${
                mode === "login"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all ${
                mode === "register"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 font-bold text-sm"
                placeholder="you@example.com"
                type="email"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Password
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 font-bold text-sm"
                placeholder="••••••••"
                type="password"
                required
              />
              <p className="mt-2 text-[11px] text-slate-400 font-medium">
                Tối thiểu 6 ký tự.
              </p>
            </div>

            <button
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-2xl font-black transition-all shadow-lg shadow-indigo-100"
              type="submit"
            >
              <i
                className={`fa-solid ${
                  loading ? "fa-spinner fa-spin" : "fa-right-to-bracket"
                }`}
              ></i>
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPanel;
