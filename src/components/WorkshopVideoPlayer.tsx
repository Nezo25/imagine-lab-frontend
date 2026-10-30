import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_WORKSHOP_VIDEOS,
  fetchWorkshopVideosSettings,
  getStoredWorkshopVideos,
  type WorkshopStageVideo
} from '@/config/workshopVideos';

interface WorkshopVideoPlayerProps {
  stages?: WorkshopStageVideo[];
}

const SHORT_PILL_LABELS: Record<number, string> = {
  1: '1. Impressão',
  2: '2. Cura & Lixa',
  3: '3. Pintura'
};

export function WorkshopVideoPlayer({ stages }: WorkshopVideoPlayerProps) {
  const [configuredStages, setConfiguredStages] = useState<WorkshopStageVideo[]>(
    () => stages ?? getStoredWorkshopVideos()
  );
  const [currentStageId, setCurrentStageId] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [failedStageIds, setFailedStageIds] = useState<Record<string, boolean>>({});
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Carrega configurações salvas (API + localStorage fallback) quando não passadas via prop
  useEffect(() => {
    if (stages && stages.length > 0) {
      setConfiguredStages(stages);
      return;
    }

    let mounted = true;
    fetchWorkshopVideosSettings().then(loaded => {
      if (mounted) {
        setConfiguredStages(loaded);
      }
    });

    const handleStorageUpdate = (event: Event) => {
      const custom = event as CustomEvent<WorkshopStageVideo[]>;
      if (custom.detail && Array.isArray(custom.detail)) {
        setConfiguredStages(custom.detail);
      } else {
        setConfiguredStages(getStoredWorkshopVideos());
      }
    };

    window.addEventListener('forja-workshop-videos-updated', handleStorageUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('forja-workshop-videos-updated', handleStorageUpdate);
    };
  }, [stages]);

  // Filtra estritamente as etapas com isActive = true
  const activeStages = useMemo(() => {
    const filtered = (configuredStages.length > 0 ? configuredStages : DEFAULT_WORKSHOP_VIDEOS)
      .filter(stage => stage.isActive)
      .sort((a, b) => a.stepNumber - b.stepNumber);

    return filtered.length > 0 ? filtered : [DEFAULT_WORKSHOP_VIDEOS[0]];
  }, [configuredStages]);

  // Define o vídeo inicial padrão (isInitialDefault = true ou o primeiro ativo)
  useEffect(() => {
    setCurrentStageId(prevId => {
      if (prevId && activeStages.some(s => s.id === prevId)) {
        return prevId;
      }
      const initial = activeStages.find(s => s.isInitialDefault) || activeStages[0];
      return initial.id;
    });
  }, [activeStages]);

  const currentIndex = useMemo(() => {
    const idx = activeStages.findIndex(s => s.id === currentStageId);
    return idx >= 0 ? idx : 0;
  }, [activeStages, currentStageId]);

  const currentStage = activeStages[currentIndex] || activeStages[0];
  const hasVideoError = Boolean(currentStage && failedStageIds[currentStage.id]);

  // Dispara autoplay seguro sempre que a etapa ativa mudar
  useEffect(() => {
    setProgress(0);
    const videoEl = videoRef.current;
    if (!videoEl || hasVideoError) return;

    videoEl.currentTime = 0;
    const playPromise = videoEl.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay pode aguardar interação caso o navegador bloqueie
      });
    }
  }, [currentStage?.id, currentStage?.localPath, hasVideoError]);

  // Ao finalizar o vídeo atual, avança para o próximo ativo em loop contínuo
  function handleVideoEnded() {
    if (activeStages.length <= 1) {
      const videoEl = videoRef.current;
      if (videoEl) {
        videoEl.currentTime = 0;
        videoEl.play().catch(() => {});
      }
      return;
    }
    const nextIndex = (currentIndex + 1) % activeStages.length;
    setCurrentStageId(activeStages[nextIndex].id);
  }

  function handleSelectStage(stage: WorkshopStageVideo) {
    setProgress(0);
    setCurrentStageId(stage.id);
  }

  function handleTimeUpdate() {
    const videoEl = videoRef.current;
    if (!videoEl || !videoEl.duration || Number.isNaN(videoEl.duration)) {
      setProgress(0);
      return;
    }
    const pct = Math.min(100, Math.max(0, (videoEl.currentTime / videoEl.duration) * 100));
    setProgress(pct);
  }

  function toggleMute() {
    const videoEl = videoRef.current;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoEl) {
      videoEl.muted = nextMuted;
    }
  }

  return (
    <div className="flex flex-col gap-3.5">
      {/* Barra Superior de Navegação das Etapas Ativas */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#090D16]/90 border border-slate-800/90 p-2 rounded-2xl">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1">
          {activeStages.map((stage, idx) => {
            const isCurrent = stage.id === currentStage.id;
            const pillLabel = SHORT_PILL_LABELS[stage.stepNumber] || `${stage.stepNumber}. ${stage.title}`;

            return (
              <div key={stage.id} className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectStage(stage)}
                  className={`relative overflow-hidden px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    isCurrent
                      ? 'bg-[#0F172A] text-white shadow-md shadow-purple-950/30'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/80'
                  }`}
                  style={
                    isCurrent
                      ? { border: '1px solid #7C3AED', boxShadow: '0 0 14px rgba(124, 58, 237, 0.25)' }
                      : undefined
                  }
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isCurrent ? 'bg-[#38BDF8] animate-pulse' : 'bg-slate-600'
                    }`}
                  />
                  <span>{pillLabel}</span>

                  {/* Barra de progresso visual da etapa em reprodução */}
                  {isCurrent && (
                    <span
                      className="absolute bottom-0 left-0 h-[2.5px] bg-gradient-to-r from-[#7C3AED] to-[#38BDF8] transition-all duration-150"
                      style={{ width: `${Math.max(progress, 6)}%` }}
                    />
                  )}
                </button>

                {idx < activeStages.length - 1 && (
                  <span className="text-slate-600 text-xs font-mono select-none hidden sm:inline">
                    →
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <span className="text-[11px] font-mono text-slate-400 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 hidden md:inline-block">
          Etapa {currentIndex + 1}/{activeStages.length} • Loop Contínuo
        </span>
      </div>

      {/* Container 16:9 do Player Local */}
      <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-[#060911] shadow-inner group">
        {!hasVideoError ? (
          <>
            <video
              key={currentStage.localPath}
              ref={videoRef}
              src={currentStage.localPath}
              poster={currentStage.posterPath}
              playsInline
              preload="metadata"
              muted={isMuted}
              autoPlay
              controls
              onEnded={handleVideoEnded}
              onTimeUpdate={handleTimeUpdate}
              onError={() =>
                setFailedStageIds(prev => ({
                  ...prev,
                  [currentStage.id]: true
                }))
              }
              className="w-full h-full object-cover"
            >
              <source src={currentStage.localPath} type="video/mp4" />
              Seu navegador não suporta reprodução de vídeo.
            </video>

            {/* Overlay discreto do título da etapa atual + Botão de Áudio */}
            <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-start justify-between gap-3 z-10">
              <div className="px-3 py-1.5 rounded-xl bg-[#090D16]/85 backdrop-blur-md border border-slate-800/90 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#38BDF8]">
                    Etapa 0{currentStage.stepNumber}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs font-bold text-white">{currentStage.title}</span>
                </div>
                <p className="text-[11px] text-slate-400">{currentStage.subtitle}</p>
              </div>

              {/* Botão de Controle de Áudio Discreto no Canto */}
              <button
                type="button"
                onClick={toggleMute}
                title={isMuted ? 'Ativar som do vídeo' : 'Silenciar vídeo'}
                className="pointer-events-auto px-3 py-2 rounded-xl bg-[#090D16]/85 hover:bg-[#0F172A] text-slate-200 hover:text-white border border-slate-700/80 hover:border-[#7C3AED]/60 backdrop-blur-md transition-all flex items-center gap-1.5 text-xs font-semibold shadow-lg cursor-pointer"
              >
                {isMuted ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2">
                      <path d="M11 5L6 9H2v6h4l5 4V5z" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                    <span className="hidden sm:inline text-[11px] text-slate-300">Som Mudo</span>
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>
                    <span className="hidden sm:inline text-[11px] text-emerald-400">Som Ativo</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Fallback Cinematográfico Elegante caso o arquivo .mp4 ainda não esteja em /public/videos */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#0F172A] to-slate-950">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center max-w-md">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-[#38BDF8] shadow-lg shadow-purple-950/50">
                  <span className="w-16 h-16 rounded-full bg-purple-500/20 absolute animate-ping opacity-50" />
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              </div>

              <span className="inline-block text-[11px] font-bold text-[#38BDF8] uppercase tracking-widest bg-purple-950/60 border border-purple-800/40 px-3 py-1 rounded-full mb-2">
                🎥 Etapa 0{currentStage.stepNumber} • Bastidores do Laboratório
              </span>
              <h3 className="text-lg md:text-xl font-bold text-white mb-1.5">
                {currentStage.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                {currentStage.subtitle}
              </p>
              <code className="text-[11px] font-mono text-purple-300/90 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-lg mb-4">
                Arquivo esperado: public{currentStage.localPath}
              </code>

              {activeStages.length > 1 && (
                <button
                  type="button"
                  onClick={handleVideoEnded}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#7C3AED] hover:bg-purple-600 text-white transition-all cursor-pointer shadow-lg shadow-purple-950/50"
                >
                  Próxima Etapa Ativa →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkshopVideoPlayer;
