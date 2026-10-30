'use client';

import { Link } from 'react-router-dom';
import { SeasonalCampaignsManager } from '@/components/SeasonalCampaignsManager';

export default function AdminCampanhasPage() {
  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-4 sm:p-6 md:p-10">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0F172A] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            >
              ← Voltar ao Painel Admin
            </Link>
            <span className="text-xs text-slate-500 font-mono">/admin/campanhas</span>
          </div>
          <Link
            to="/"
            className="text-xs font-semibold text-[#F97316] hover:underline"
          >
            Ver Vitrine Pública →
          </Link>
        </div>

        <SeasonalCampaignsManager />
      </div>
    </div>
  );
}
