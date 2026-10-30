import { useState } from 'react';
import { addQuote } from '@/services/storage';
import { toast } from '@/components/Toast';

interface Props {
  open: boolean;
  onClose: () => void;
  whatsappNumber?: string;
}

export function OrcamentoModal({ open, onClose, whatsappNumber = '5511999999999' }: Props) {
  const [nome, setNome] = useState('');
  const [ideiaLink, setIdeiaLink] = useState('');
  const [dimensoesMaterial, setDimensoesMaterial] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [file, setFile] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (!open) return null;

  const envNumber = 
    (typeof import.meta !== 'undefined' && (import.meta.env.VITE_WHATSAPP_NUMBER || (import.meta.env as any).NEXT_PUBLIC_WHATSAPP_NUMBER)) ||
    whatsappNumber;
  const cleanNumber = String(envNumber).replace(/\D/g, '') || '5511999999999';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!nome.trim()) {
      alert('Por favor, informe seu nome.');
      return;
    }

    if (!ideiaLink.trim() && !file) {
      alert('Por favor, descreva sua ideia ou insira o link/arquivo do modelo.');
      return;
    }

    // 1. Montagem rigorosa da mensagem pré-formatada do WhatsApp conforme especificação ImagineLab
    let msg = `Olá, ImagineLab! Gostaria de fazer um orçamento de impressão 3D.\n`;
    msg += `Nome: ${nome.trim()}\n`;
    msg += `Ideia / Link do arquivo: ${ideiaLink.trim() || file || 'A combinar'}\n`;
    msg += `Dimensões aproximadas / Material: ${dimensoesMaterial.trim() || 'A definir / Consultar recomendação'}`;
    
    if (observacoes.trim()) {
      msg += `\nObservações: ${observacoes.trim()}`;
    }

    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;

    // 2. Persistência de backup local para o painel administrativo da ImagineLab
    try {
      addQuote({
        cliente: nome.trim(),
        contato: 'WhatsApp',
        arquivo: file || ideiaLink.trim() || 'modelo_custom',
        escala: dimensoesMaterial.trim() || 'Padrão',
        acabamento: 'A definir',
        detalhes: observacoes.trim() || ideiaLink.trim(),
      });
    } catch {
      // ignore
    }

    toast.show({
      title: 'Abrindo WhatsApp...',
      message: 'Você será redirecionado para enviar os dados para a ImagineLab.',
      type: 'success',
      icon: '💬'
    });

    setSent(true);

    // 3. Redirecionamento instantâneo para o WhatsApp
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
      setSent(false);
      onClose();
    }, 700);
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
      <div
        className="relative w-full md:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl md:rounded-2xl shadow-2xl"
        style={{ background: '#111722', border: '1px solid #2E384D' }}
        onClick={e => e.stopPropagation()}
      >
        {sent ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-4">
            <div className="text-5xl animate-bounce">💬</div>
            <h2 className="text-2xl font-extrabold text-[#38BDF8]">Redirecionando para o WhatsApp...</h2>
            <p className="text-sm text-slate-300">A equipe da ImagineLab está pronta para avaliar sua ideia!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Header do Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E384D] bg-[#0B0D13]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
                  <h2 className="font-extrabold text-lg text-white">Orçamento de Impressão 3D</h2>
                </div>
                <p className="text-xs text-[#94A3B8] mt-0.5">ImagineLab • Monte Alegre-SP</p>
              </div>
              <button 
                type="button" 
                onClick={onClose} 
                className="text-sm px-3 py-1.5 rounded-lg text-slate-400 hover:text-white bg-[#1E2433] hover:bg-[#2A3449] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              
              {/* Campo Nome */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Seu Nome ou Empresa"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl text-sm outline-none bg-[#1E2433] border border-[#2E384D] text-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
                />
              </div>

              {/* Campo Ideia / Link do Arquivo */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Ideia / Link do arquivo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Link do Thingiverse, Printables, Drive ou descreva sua ideia..."
                  value={ideiaLink}
                  onChange={e => setIdeiaLink(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl text-sm outline-none bg-[#1E2433] border border-[#2E384D] text-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
                />
                <span className="text-[11px] text-[#64748B] mt-1 block">
                  Pode ser um link da internet ou você pode enviar a foto/arquivo direto no WhatsApp.
                </span>
              </div>

              {/* Campo Dimensões aproximadas / Material */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Dimensões aproximadas / Material
                </label>
                <input
                  type="text"
                  placeholder="Ex: 15cm de altura, Resina 8K ou PLA..."
                  value={dimensoesMaterial}
                  onChange={e => setDimensoesMaterial(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl text-sm outline-none bg-[#1E2433] border border-[#2E384D] text-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
                />
              </div>

              {/* Campo Arquivo Opcional (Referência rápida) */}
              <div
                className="relative flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl cursor-pointer transition-all border border-dashed border-[#2E384D] hover:border-[#7C3AED] bg-[#0B0D13]/60"
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]?.name ?? null); }}
              >
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept=".stl,.obj,.3mf,.png,.jpg,.jpeg"
                  onChange={e => setFile(e.target.files?.[0]?.name ?? null)}
                />
                <div className="text-xl">{file ? '📎' : '📁'}</div>
                <div className="text-xs font-medium text-slate-300">{file ?? 'Anexar referência ou arquivo (opcional)'}</div>
                <div className="text-[10px] text-[#64748B]">Formatos: .STL, .OBJ, .3MF, Imagens</div>
              </div>

              {/* Campo Observações */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">Observações adicionais</label>
                <textarea
                  placeholder="Prazo desejado, se precisa de pintura especial, cores, etc..."
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none bg-[#1E2433] border border-[#2E384D] text-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
                />
              </div>

              {/* Botão de Envio WhatsApp */}
              <button 
                type="submit" 
                className="w-full h-12 rounded-xl font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white shadow-lg shadow-emerald-950/50 active:scale-[0.99] transition-all cursor-pointer ring-1 ring-emerald-400/40"
              >
                <span>Solicitar Orçamento no WhatsApp</span>
                <span className="text-lg">💬</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
