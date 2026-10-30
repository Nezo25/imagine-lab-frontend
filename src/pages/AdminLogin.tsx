import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || (import.meta.env as any).NEXT_PUBLIC_API_URL || 'https://api.imaginelab.seudominio.com.br';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const cleanApi = String(API).trim().replace(/\/+$/, '');
      const rootUrl = cleanApi.endsWith('/api/v1') ? cleanApi.replace(/\/api\/v1$/, '') : cleanApi;
      const res = await fetch(`${rootUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError('E-mail ou senha incorretos.');
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data.userRole !== 'ROLE_ADMIN') {
        setError('Acesso não autorizado.');
        setLoading(false);
        return;
      }

      sessionStorage.setItem('__adm_token', data.accessToken);
      sessionStorage.setItem('__adm_name', data.fullName ?? data.email);
      navigate('/admin');
    } catch {
      setError('Falha na conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0D13]">
      <div className="w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7C3AED] via-[#6C4AB6] to-[#38BDF8] p-[2px] shadow-xl shadow-purple-900/40">
            <div className="w-full h-full bg-[#0B0D13] rounded-[14px] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#38BDF8]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.12 6.4-6.05-4.06a2 2 0 0 0-2.17-.05L2.9 8.4A2 2 0 0 0 2 10.1v7.8a2 2 0 0 0 1.05 1.76l6.05 3.94a2 2 0 0 0 2.17.05l9.95-6.11A2 2 0 0 0 22 15.8V8a2 2 0 0 0-.88-1.6Z"/>
                <path d="m10 22 10-6"/>
                <path d="M10 22V10"/>
                <path d="m2 10 10-6"/>
              </svg>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-extrabold text-white">ImagineLab 3D</h1>
            <p className="text-xs mt-1 text-[#94A3B8]">Painel Administrativo • Monte Alegre-SP</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 flex flex-col gap-4 bg-[#131722] border border-[#2E384D] shadow-2xl">
          <h2 className="text-base font-bold text-center text-white">Entrar no Painel</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1 text-[#94A3B8]">E-mail</label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="admin@imaginelab.3d"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-xl text-sm outline-none transition-all bg-[#1E2433] border border-[#2E384D] text-white focus:border-[#7C3AED]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1 text-[#94A3B8]">Senha</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-xl text-sm outline-none transition-all bg-[#1E2433] border border-[#2E384D] text-white focus:border-[#7C3AED]"
              />
            </div>

            {error && (
              <div className="text-xs px-3 py-2 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl font-extrabold text-sm transition-all mt-1 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white shadow-lg shadow-purple-950/50 cursor-pointer disabled:opacity-50 ring-1 ring-purple-400/40"
            >
              {loading ? 'Entrando...' : 'Entrar no Painel →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6 text-[#64748B]">
          ImagineLab © {new Date().getFullYear()} • Monte Alegre-SP
        </p>
      </div>
    </div>
  );
}
