import { useState, useEffect } from 'react';
import { submitCustomerReview, type ReviewSubmitPayload } from '@/services/reviews';
import { toast } from '@/components/Toast';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SubmitReviewModal({ open, onClose, onSuccess }: Props) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [customerName, setCustomerName] = useState('');
  const [productName, setProductName] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim() || !productName.trim() || !comment.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    if (rating < 1 || rating > 5) {
      alert('Selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ReviewSubmitPayload = {
        customerName: customerName.trim(),
        productName: productName.trim(),
        rating,
        comment: comment.trim(),
        customerCity: customerCity.trim() || undefined
      };

      await submitCustomerReview(payload);

      setIsSuccess(true);
      toast.show({
        title: 'Avaliação enviada com sucesso!',
        message: 'Obrigado! Sua avaliação será publicada após a moderação da equipe.',
        type: 'success',
        icon: '⭐'
      });

      if (onSuccess) onSuccess();

      setTimeout(() => {
        setIsSuccess(false);
        setCustomerName('');
        setProductName('');
        setCustomerCity('');
        setComment('');
        setRating(5);
        onClose();
      }, 2200);
    } catch (err: any) {
      alert('Não foi possível enviar a avaliação. Tente novamente em instantes.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md transition-opacity"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-[#090D16] border border-slate-800 text-slate-100 shadow-2xl p-6 sm:p-7 flex flex-col custom-scrollbar animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(234, 88, 12, 0.12)'
        }}
      >
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-3xl shadow-lg shadow-orange-950/40">
              ⭐
            </div>
            <h3 className="text-2xl font-extrabold text-white">
              Avaliação Recebida!
            </h3>
            <p className="text-sm text-slate-300 max-w-sm leading-relaxed">
              Obrigado! Sua avaliação foi enviada e será publicada após a moderação da equipe ImagineLab.
            </p>
            <div className="text-xs text-[#38BDF8] font-semibold bg-cyan-950/60 border border-cyan-800/40 px-3 py-1.5 rounded-full mt-2">
              Sua opinião fortalece o nosso laboratório 🤝
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Header do modal */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800/80">
              <div>
                <span className="text-[10px] font-black tracking-widest text-[#38BDF8] uppercase bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-0.5 rounded-full">
                  Depoimento Real
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-2">
                  Avaliar Minha Encomenda
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Conte como foi sua experiência com a peça recebida da ImagineLab.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700/60 shrink-0"
                title="Fechar (ESC)"
              >
                ✕
              </button>
            </div>

            {/* Seletor de Estrelas com Hover Reativo */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0F172A]/80 border border-slate-800 gap-2">
              <span className="text-xs font-semibold text-slate-300">
                Sua nota para a peça e atendimento:
              </span>
              <div className="flex items-center gap-1.5" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map(star => {
                  const filled = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      className="p-1 text-3xl sm:text-4xl transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                      title={`${star} estrelas`}
                    >
                      <span className={filled ? 'text-[#38BDF8] drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]' : 'text-slate-700'}>
                        ★
                      </span>
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] font-bold text-orange-400/90">
                {rating === 5 && 'Excepcional! Impecável (5/5)'}
                {rating === 4 && 'Muito boa, gostei muito! (4/5)'}
                {rating === 3 && 'Boa peça (3/5)'}
                {rating === 2 && 'Poderia melhorar (2/5)'}
                {rating === 1 && 'Não atendeu expectativas (1/5)'}
              </span>
            </div>

            {/* Nome do Cliente */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Seu Nome Completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Lucas Ferreira"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                maxLength={150}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            {/* Peça Adquirida */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Peça que você encomendou / adquiriu *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Charizard X 1:10, Booster Box Pokémon, STL Gengar..."
                value={productName}
                onChange={e => setProductName(e.target.value)}
                maxLength={150}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            {/* Cidade / Estado (Opcional) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Sua Cidade / Estado (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Florianópolis, SC"
                value={customerCity}
                onChange={e => setCustomerCity(e.target.value)}
                maxLength={100}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            {/* Depoimento Sincero */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Seu Depoimento Sincero *
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {comment.length}/500
                </span>
              </div>
              <textarea
                required
                rows={4}
                maxLength={500}
                placeholder="Conte o que achou dos detalhes, peso da peça, acabamento da pintura e cuidado no envio..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Botão de Envio */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-11 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-11 px-6 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] disabled:opacity-50 text-white shadow-lg shadow-purple-950/40 active:scale-95 transition-all cursor-pointer ring-1 ring-purple-400/40"
              >
                <span>{isSubmitting ? 'Enviando...' : 'Enviar Avaliação 💬'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
