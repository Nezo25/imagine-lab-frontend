import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from '@/components/Toast';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Senha padrão administrativa ou token de API
    if (password === 'admin123' || password === 'imaginelab2026' || password === '123456') {
      sessionStorage.setItem('__adm_token', 'imaginelab_auth_token_' + Date.now());
      toast.success('Login administrativo realizado!');
      navigate('/admin');
    } else {
      toast.error('Senha incorreta. Verifique suas credenciais.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0A0D14] flex items-center justify-center p-4 selection:bg-purple-900/50 selection:text-cyan-300">
      <div className="w-full max-w-md p-8 rounded-3xl glass-panel border border-[#222D42] shadow-2xl flex flex-col gap-6 relative">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-purple-500/40 bg-[#111726] p-1 flex items-center justify-center glow-purple">
            <img src="/images/logo.png" alt="ImagineLab" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-heading font-black text-2xl text-white">Acesso do Laboratório</h1>
            <p className="text-xs text-slate-400 mt-1">
              Painel de Gestão & Produção ImagineLab (Pinhalzinho-SP)
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
              Senha de Administrador
            </label>
            <input
              type="password"
              required
              placeholder="Digite sua chave de acesso"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-4 rounded-xl text-sm bg-[#121828] border border-[#222D42] text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Dica de teste: <code>admin123</code> ou <code>imaginelab2026</code>
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl font-black text-xs uppercase tracking-wider bg-[#5E488C] hover:bg-[#4D3974] text-white shadow-lg glow-purple transition-all"
          >
            {loading ? 'Validando...' : 'Entrar no Painel 🔐'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#1C2638]">
          <Link to="/" className="text-xs font-semibold text-cyan-300 hover:underline">
            ← Voltar para a loja pública
          </Link>
        </div>
      </div>
    </div>
  );
}
