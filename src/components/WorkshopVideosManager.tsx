import { useEffect, useState } from 'react';
import {
  DEFAULT_WORKSHOP_VIDEOS,
  fetchWorkshopVideosSettings,
  getStoredWorkshopVideos,
  updateWorkshopVideosSettings,
  type WorkshopStageVideo
} from '@/config/workshopVideos';
import { WorkshopVideoPlayer } from '@/components/WorkshopVideoPlayer';
import { toast } from '@/components/Toast';

export function WorkshopVideosManager() {
  const [stages, setStages] = useState<WorkshopStageVideo[]>(() => getStoredWorkshopVideos());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchWorkshopVideosSettings()
      .then(loaded => {
        if (mounted) setStages(loaded);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  function handleToggleActive(stageId: string) {
    setStages(prev => {
      const target = prev.find(s => s.id === stageId);
      if (!target) return prev;

      const nextActive = !target.isActive;
      const activeCount = prev.filter(s => s.isActive).length;

      // Impede deixar 0 vídeos ativos na vitrine
      if (!nextActive && activeCount <= 1) {
        toast.show({
          title: 'Pelo menos 1 etapa deve ficar ativa',
          message: 'Ative outra etapa antes de ocultar esta para não deixar o player vazio.',
          type: 'info',
          icon: '🎥'
        });
        return prev;
      }

      const updated = prev.map(s => {
        if (s.id !== stageId) return s;
        return {
          ...s,
          isActive: nextActive,
          isInitialDefault: nextActive ? s.isInitialDefault : false
        };
      });

      // Se a etapa desativada era a principal, transfere o default para a primeira ativa
      if (!updated.some(s => s.isActive && s.isInitialDefault)) {
        const firstActive = updated.find(s => s.isActive);
        if (firstActive) {
          return updated.map(s => ({
            ...s,
            isInitialDefault: s.id === firstActive.id
          }));
        }
      }

      return updated;
    });
  }

  function handleSetInitialDefault(stageId: string) {
    setStages(prev =>
      prev.map(s => ({
        ...s,
        // Ao definir como vídeo principal de abertura, garante que a etapa também fique ativa
        isActive: s.id === stageId ? true : s.isActive,
        isInitialDefault: s.id === stageId
      }))
    );
  }

  function handleFieldChange(stageId: string, field: 'title' | 'subtitle' | 'localPath', value: string) {
    setStages(prev =>
      prev.map(s => (s.id === stageId ? { ...s, [field]: value } : s))
    );
  }

  async function handleSaveSettings() {
    setIsSaving(true);
    try {
      const saved = await updateWorkshopVideosSettings(stages);
      setStages(saved);
      toast.show({
        title: 'Bastidores atualizados!',
        message: 'As preferências dos vídeos da oficina foram salvas com sucesso.',
        type: 'success',
        icon: '🎬'
      });
    } catch (err: any) {
      toast.show({
        title: 'Erro ao salvar',
        message: err?.message || 'Não foi possível salvar as configurações.',
        type: 'error',
        icon: '⚠️'
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleRestoreDefaults() {
    const reset = DEFAULT_WORKSHOP_VIDEOS.map(v => ({ ...v }));
    setStages(reset);
    toast.show({
      title: 'Padrões restaurados',
      message: 'Clique em "Salvar Preferências" para confirmar a restauração.',
      type: 'info',
      icon: '↺'
    });
  }

  const activeCount = stages.filter(s => s.isActive).length;

  return (
    <div className="flex flex-col gap-6 text-slate-100">
      {/* Cabeçalho do Módulo */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-950/60 text-[#F97316] border border-orange-800/40 mb-2">
            🎬 Bastidores da Oficina • Player Contínuo
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white">
            Gestão dos Vídeos de Bastidores (/public/videos)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Controle quais etapas aparecem no modal da vitrine, qual vídeo inicia a reprodução e personalize os títulos exibidos ao cliente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowPreview(prev => !prev)}
            className="h-10 px-4 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 transition-all cursor-pointer"
          >
            {showPreview ? 'Ocultar Preview' : '👁️ Simular Player'}
          </button>

          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="h-10 px-3.5 rounded-xl text-xs font-semibold border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            Restaurar Padrão
          </button>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="h-10 px-5 rounded-xl text-xs font-extrabold bg-[#F97316] hover:bg-orange-600 text-white shadow-lg shadow-orange-950/50 transition-all cursor-pointer disabled:opacity-60"
          >
            {isSaving ? 'Salvando...' : '💾 Salvar Preferências'}
          </button>
        </div>
      </div>

      {/* Preview Opcional em Tempo Real */}
      {showPreview && (
        <div className="p-5 rounded-2xl bg-[#090D16] border border-orange-500/30 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
              Preview ao Vivo da Vitrine ({activeCount} {activeCount === 1 ? 'etapa ativa' : 'etapas ativas'})
            </span>
            <span className="text-[11px] text-slate-400">
              Transição automática onEnded ativada
            </span>
          </div>
          <WorkshopVideoPlayer stages={stages} />
        </div>
      )}

      {/* Lista das 3 Etapas Cadastradas */}
      {isLoading ? (
        <div className="p-12 rounded-2xl bg-[#0F172A] border border-slate-800 text-center text-xs text-slate-400">
          Carregando configurações das etapas...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {stages.map(stage => (
            <div
              key={stage.id}
              className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                stage.isActive
                  ? 'bg-[#0F172A] border-slate-700/90 shadow-lg'
                  : 'bg-[#0F172A]/50 border-slate-800/70 opacity-80'
              }`}
              style={
                stage.isInitialDefault && stage.isActive
                  ? { borderColor: 'rgba(249, 115, 22, 0.55)', boxShadow: '0 0 20px rgba(249, 115, 22, 0.08)' }
                  : undefined
              }
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                {/* Identificação da Etapa + Caminho Local */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-mono text-sm font-extrabold shrink-0 border ${
                      stage.isActive
                        ? 'bg-orange-500/15 border-orange-500/40 text-[#F97316]'
                        : 'bg-slate-800/70 border-slate-700 text-slate-500'
                    }`}
                  >
                    0{stage.stepNumber}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-white">
                        Etapa {stage.stepNumber}: {stage.title}
                      </span>
                      {stage.isInitialDefault && stage.isActive && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-orange-500/20 text-[#F97316] border border-orange-500/40">
                          ★ Vídeo Principal de Abertura
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[11px] text-slate-400">Arquivo local:</span>
                      <code className="px-2 py-0.5 rounded bg-[#090D16] border border-slate-800 text-[11px] font-mono text-orange-300">
                        /public{stage.localPath}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Controles Rápidos: Rádio Vídeo Principal + Toggle Switch [Ativo / Oculto] */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Rádio / Checkbox: Definir como Vídeo Principal de Abertura */}
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#090D16]/90 border border-slate-800 hover:border-slate-700 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="initialDefaultStage"
                      checked={stage.isInitialDefault}
                      onChange={() => handleSetInitialDefault(stage.id)}
                      className="accent-[#F97316] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-200">
                      Definir como Vídeo Principal de Abertura
                    </span>
                  </label>

                  {/* Toggle Switch [Ativo / Oculto] */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={stage.isActive}
                    onClick={() => handleToggleActive(stage.id)}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-2.5 transition-all cursor-pointer ${
                      stage.isActive
                        ? 'bg-emerald-950/50 border-emerald-700/50 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-8 h-4 rounded-full relative transition-colors ${
                        stage.isActive ? 'bg-[#F97316]' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                          stage.isActive ? 'left-4' : 'left-0.5'
                        }`}
                      />
                    </span>
                    <span>{stage.isActive ? 'Ativo na Vitrine' : 'Oculto'}</span>
                  </button>
                </div>
              </div>

              {/* Campos Editáveis: Título e Descrição da Etapa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Título da Etapa
                  </label>
                  <input
                    type="text"
                    value={stage.title}
                    onChange={e => handleFieldChange(stage.id, 'title', e.target.value)}
                    placeholder="Ex: Impressão 3D de Precisão"
                    className="w-full h-10 px-3.5 rounded-xl text-sm bg-[#090D16] border border-slate-800 focus:border-[#F97316] text-white outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Descrição / Subtítulo da Etapa
                  </label>
                  <input
                    type="text"
                    value={stage.subtitle}
                    onChange={e => handleFieldChange(stage.id, 'subtitle', e.target.value)}
                    placeholder="Ex: Construção milimétrica camada por camada"
                    className="w-full h-10 px-3.5 rounded-xl text-sm bg-[#090D16] border border-slate-800 focus:border-[#F97316] text-white outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WorkshopVideosManager;
