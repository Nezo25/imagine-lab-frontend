import { fetchApi } from '@/api/client';

export interface WorkshopStageVideo {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  localPath: string; // Ex: '/videos/etapa1_impressao.mp4'
  posterPath?: string;
  isActive: boolean;
  isInitialDefault: boolean;
}

export const DEFAULT_WORKSHOP_VIDEOS: WorkshopStageVideo[] = [
  {
    id: 'stage-1',
    stepNumber: 1,
    title: 'Impressão 3D de Precisão',
    subtitle: 'Construção milimétrica camada por camada',
    localPath: '/videos/etapa1_impressao.mp4',
    posterPath: '/images/thumb-impressao.jpg',
    isActive: true,
    isInitialDefault: true
  },
  {
    id: 'stage-2',
    stepNumber: 2,
    title: 'Cura e Pós-Processamento',
    subtitle: 'Remoção de suportes e lixamento progressivo',
    localPath: '/videos/etapa2_acabamento.mp4',
    posterPath: '/images/thumb-acabamento.jpg',
    isActive: true,
    isInitialDefault: false
  },
  {
    id: 'stage-3',
    stepNumber: 3,
    title: 'Pintura & Acabamento Manual',
    subtitle: 'Pintura artesanal feita individualmente à mão',
    localPath: '/videos/etapa3_pintura.mp4',
    posterPath: '/images/thumb-pintura.jpg',
    isActive: true,
    isInitialDefault: false
  }
];

const STORAGE_KEY = 'forja_workshop_videos_v1';

export function normalizeWorkshopVideos(videos?: WorkshopStageVideo[] | null): WorkshopStageVideo[] {
  if (!Array.isArray(videos) || videos.length === 0) {
    return DEFAULT_WORKSHOP_VIDEOS.map(v => ({ ...v }));
  }

  const merged = DEFAULT_WORKSHOP_VIDEOS.map(def => {
    const found = videos.find(v => v.id === def.id || v.stepNumber === def.stepNumber);
    if (!found) return { ...def };
    return {
      ...def,
      ...found,
      stepNumber: def.stepNumber,
      localPath: found.localPath || def.localPath,
      posterPath: found.posterPath || def.posterPath,
      isActive: Boolean(found.isActive),
      isInitialDefault: Boolean(found.isInitialDefault)
    };
  });

  // Garante que haja pelo menos 1 vídeo inicial padrão entre os ativos
  const hasActive = merged.some(v => v.isActive);
  if (!hasActive) {
    merged[0].isActive = true;
  }

  const activeDefault = merged.find(v => v.isActive && v.isInitialDefault);
  if (!activeDefault) {
    const firstActive = merged.find(v => v.isActive) || merged[0];
    merged.forEach(v => {
      v.isInitialDefault = v.id === firstActive.id;
    });
  } else {
    merged.forEach(v => {
      v.isInitialDefault = v.id === activeDefault.id;
    });
  }

  return merged;
}

export function getStoredWorkshopVideos(): WorkshopStageVideo[] {
  if (typeof window === 'undefined') {
    return DEFAULT_WORKSHOP_VIDEOS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WORKSHOP_VIDEOS;
    const parsed = JSON.parse(raw) as WorkshopStageVideo[];
    return normalizeWorkshopVideos(parsed);
  } catch {
    return DEFAULT_WORKSHOP_VIDEOS;
  }
}

export function saveStoredWorkshopVideos(videos: WorkshopStageVideo[]): WorkshopStageVideo[] {
  const normalized = normalizeWorkshopVideos(videos);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      window.dispatchEvent(new CustomEvent('forja-workshop-videos-updated', { detail: normalized }));
    } catch {
      // Ignore storage quota errors
    }
  }
  return normalized;
}

export async function fetchWorkshopVideosSettings(): Promise<WorkshopStageVideo[]> {
  try {
    const remote = await fetchApi<WorkshopStageVideo[]>('/workshop-videos/settings');
    if (Array.isArray(remote) && remote.length > 0) {
      return saveStoredWorkshopVideos(remote);
    }
  } catch {
    // Fallback local resiliente se o backend estiver offline ou em cold start
  }
  return getStoredWorkshopVideos();
}

export async function updateWorkshopVideosSettings(videos: WorkshopStageVideo[]): Promise<WorkshopStageVideo[]> {
  const normalized = saveStoredWorkshopVideos(videos);
  try {
    const savedRemote = await fetchApi<WorkshopStageVideo[]>('/admin/workshop-videos/settings', {
      method: 'PUT',
      body: JSON.stringify(normalized)
    });
    if (Array.isArray(savedRemote) && savedRemote.length > 0) {
      return saveStoredWorkshopVideos(savedRemote);
    }
  } catch {
    // Mantém persistência local garantida mesmo se o endpoint remoto ainda não estiver publicado
  }
  return normalized;
}
