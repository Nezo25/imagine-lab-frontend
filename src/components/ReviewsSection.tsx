import { useEffect, useState } from 'react';
import { fetchPublicReviews, type CustomerReview } from '@/services/reviews';

interface Props {
  onOpenSubmitReview: () => void;
}

export function ReviewsSection({ onOpenSubmitReview }: Props) {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadReviews() {
    try {
      const data = await fetchPublicReviews();
      setReviews(data);
    } catch (err) {
      console.warn('Erro ao carregar avaliações:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();

    const handleUpdate = () => {
      loadReviews();
    };

    window.addEventListener('forja_reviews_updated', handleUpdate);
    return () => {
      window.removeEventListener('forja_reviews_updated', handleUpdate);
    };
  }, []);

  return (
    <section id="avaliacoes" className="relative w-full max-w-full py-16 md:py-24 px-4 md:px-8 bg-[#090D16] border-b border-[#262626] text-white overflow-hidden">
      {/* Luz ambiente de fundo sutil */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1440px] mx-auto relative z-10">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] md:text-xs font-black tracking-widest uppercase bg-purple-950/70 border border-purple-500/40 text-[#A855F7] mb-3.5 shadow-sm">
              <span>VOZES DA IMAGINELAB</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-wide text-white leading-none">
              O que dizem os clientes
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl leading-relaxed">
              Depoimentos reais de quem já transformou sua ideia em realidade 3D com a ImagineLab em Monte Alegre-SP.
            </p>
          </div>

          <button
            onClick={onOpenSubmitReview}
            className="h-11 px-6 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] border border-purple-500/40 hover:border-purple-500 text-[#38BDF8] hover:text-white transition-all shadow-md shadow-purple-950/20 active:scale-95 cursor-pointer shrink-0 w-full sm:w-auto"
          >
            <span>+ Enviar minha avaliação</span>
          </button>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-6 rounded-2xl bg-[#0F172A]/60 border border-slate-800 animate-pulse h-48" />
            ))}
          </div>
        )}

        {/* Estado Vazio Elegante (Sem avaliações publicadas) */}
        {!loading && reviews.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-3xl bg-[#0F172A]/50 border border-slate-800 max-w-2xl mx-auto shadow-inner">
            <div className="w-14 h-14 rounded-2xl bg-orange-950/50 border border-orange-800/40 flex items-center justify-center text-2xl mb-4 text-orange-400 shadow-md">
              💬
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-2">
              Ainda não temos avaliações publicadas
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed mb-6">
              Já recebeu uma encomenda da ImagineLab? Seja o primeiro a compartilhar sua experiência e ter seu depoimento estampado aqui!
            </p>
            <button
              onClick={onOpenSubmitReview}
              className="w-full sm:w-auto h-11 px-6 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white shadow-lg shadow-purple-950/40 active:scale-95 transition-all cursor-pointer ring-1 ring-purple-400/40"
            >
              <span>Avaliar minha encomenda agora</span>
              <span>⭐</span>
            </button>
          </div>
        )}

        {/* Grid de Depoimentos Reais */}
        {!loading && reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map(review => (
              <div
                key={review.id}
                className="relative p-6 sm:p-7 rounded-2xl bg-[#0F172A] border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between group shadow-lg"
              >
                {/* Aspas decorativas */}
                <div className="absolute top-4 right-5 text-4xl font-serif text-purple-500/20 group-hover:text-purple-500/40 transition-colors pointer-events-none select-none">
                  “
                </div>

                <div>
                  {/* Estrelas */}
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        className={`text-base ${
                          star <= review.rating ? 'text-[#38BDF8]' : 'text-slate-700'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                    <span className="text-[11px] font-mono text-slate-400 ml-1.5 font-bold">
                      {review.rating}.0
                    </span>
                  </div>

                  {/* Depoimento em itálico */}
                  <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed mb-6 font-normal">
                    "{review.comment}"
                  </p>
                </div>

                {/* Rodapé do Card */}
                <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs sm:text-sm text-white">
                      {review.customerName}
                    </span>
                    {review.customerCity && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        📍 {review.customerCity}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-orange-400 bg-orange-950/60 border border-orange-800/40 px-2 py-0.5 rounded-md truncate max-w-full">
                      {review.productName}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
