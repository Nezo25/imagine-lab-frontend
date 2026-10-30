import { fetchApi } from '@/api/client';
import React, { useState, useEffect } from 'react';
import { toast } from './Toast';

// Interface matching the backend DTOs
export interface TcgProductRequestDTO {
  name: string;
  itemType: 'BOOSTER_PACK' | 'BOOSTER_BOX' | 'ETB' | 'BLISTER' | 'DECK' | 'ACCESSORY';
  expansionName: string;
  language: 'PT_BR' | 'EN' | 'JA';
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  isActive: boolean;
}

interface NewTcgProductModalProps {
  onClose: () => void;
  onSave: () => void; // now just triggers a refresh after successful POST
  initialData?: any;
}

export function NewTcgProductModal({ onClose, onSave, initialData }: NewTcgProductModalProps) {
  const [form, setForm] = useState<TcgProductRequestDTO>({
    name: initialData?.name || '',
    itemType: initialData?.itemType || 'BOOSTER_PACK',
    expansionName: initialData?.expansionName || '',
    language: initialData?.language || 'PT_BR',
    price: initialData?.price || 0,
    stockQuantity: initialData?.stockQuantity || 0,
    imageUrl: initialData?.imageUrl || '',
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
  });
  
  const [loading, setLoading] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // File to base64 for local uploads (if API accepts it as imageUrl)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      try {
        setIsProcessingImage(true);
        const b64 = await fileToBase64(e.target.files[0]);
        setForm(f => ({ ...f, imageUrl: b64 }));
      } catch (err) {
        console.error('Erro ao processar imagem:', err);
      } finally {
        setIsProcessingImage(false);
      }
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.price === undefined || form.price <= 0) {
      toast.show({ title: 'Erro de validação', message: 'Preencha o nome e um preço válido!', type: 'error' });
      return;
    }
    
    setLoading(true);
    
    try {
      const method = initialData?.id ? 'PUT' : 'POST';
      const endpoint = initialData?.id ? `/admin/tcg-products/${initialData.id}` : `/admin/tcg-products`;
      
      await fetchApi(endpoint, {
        method,
        body: JSON.stringify(form)
      });

      toast.show({ title: 'Sucesso!', message: 'Produto TCG cadastrado com sucesso!', type: 'success' });
      onSave(); // Trigger parent refresh
      onClose(); // Close modal
    } catch (err: any) {
      console.error(err);
      toast.show({ title: 'Erro de Servidor', message: err.message || 'Houve um erro ao processar a requisição.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-gray-900/95 backdrop-blur-md border-b border-gray-700 rounded-t-xl">
          <div>
            <h2 className="font-extrabold text-lg text-gray-100">{initialData ? 'Editar Produto TCG' : 'Novo Produto TCG / Cartas'}</h2>
            <p className="text-xs text-gray-400">Cadastre boosters, caixas seladas, decks ou acessórios originais</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm px-3 py-1 rounded-lg text-gray-400 hover:text-white bg-gray-800 border border-gray-700">
            X
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto">
          <form id="tcg-form" onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Nome do Produto *</label>
              <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="w-full h-9 px-3 rounded-lg text-sm outline-none bg-gray-800 border border-gray-700 text-gray-100 focus:border-orange-500" placeholder="Ex: Booster Pack - Fagulhas Impetuosas" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tipo de Item TCG *</label>
                <select value={form.itemType} onChange={e => setForm(f => ({...f, itemType: e.target.value as any}))} className="w-full h-9 px-3 rounded-lg text-sm outline-none bg-gray-800 border border-gray-700 text-gray-100 focus:border-orange-500">
                  <option value="BOOSTER_PACK">Booster Avulso</option>
                  <option value="BOOSTER_BOX">Booster Box 36 un</option>
                  <option value="ETB">Elite Trainer Box - ETB</option>
                  <option value="BLISTER">Blister / Kit</option>
                  <option value="DECK">Deck Pronto para Jogar</option>
                  <option value="ACCESSORY">Acessório Oficial TCG</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Idioma da Carta *</label>
                <select value={form.language} onChange={e => setForm(f => ({...f, language: e.target.value as any}))} className="w-full h-9 px-3 rounded-lg text-sm outline-none bg-gray-800 border border-gray-700 text-gray-100 focus:border-orange-500">
                  <option value="PT_BR">Português (PT-BR)</option>
                  <option value="EN">Inglês (EN)</option>
                  <option value="JA">Japonês (JA)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Coleção / Expansão *</label>
              <input required value={form.expansionName} onChange={e => setForm(f => ({...f, expansionName: e.target.value}))} className="w-full h-9 px-3 rounded-lg text-sm outline-none bg-gray-800 border border-gray-700 text-gray-100 focus:border-orange-500" placeholder="Ex: Escarlate e Violeta 8" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Preço Unitário de Venda (R$) *</label>
                <input required type="number" step="0.01" min="0" value={form.price === 0 ? '' : form.price} onChange={e => setForm(f => ({...f, price: parseFloat(e.target.value)}))} className="w-full h-9 px-3 rounded-lg text-sm outline-none bg-gray-800 border border-gray-700 text-gray-100 focus:border-orange-500" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Quantidade em Estoque (Unidades) *</label>
                <input required type="number" min="0" step="1" value={form.stockQuantity === 0 ? '' : form.stockQuantity} onChange={e => setForm(f => ({...f, stockQuantity: parseInt(e.target.value, 10)}))} className="w-full h-9 px-3 rounded-lg text-sm outline-none bg-gray-800 border border-gray-700 text-gray-100 focus:border-orange-500" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Imagem do Produto</label>
              <div className="flex gap-4 items-start">
                {form.imageUrl && (
                  <div className="w-20 h-24 shrink-0 rounded-lg border border-gray-600 bg-gray-800 overflow-hidden flex items-center justify-center">
                    <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 flex flex-col gap-2">
                  <input value={form.imageUrl} onChange={e => setForm(f => ({...f, imageUrl: e.target.value}))} className="w-full h-9 px-3 rounded-lg text-sm outline-none bg-gray-800 border border-gray-700 text-gray-100 focus:border-orange-500" placeholder="URL da Imagem oficial" />
                  <div className="text-xs text-gray-500 text-center">ou</div>
                  <label className="relative cursor-pointer flex items-center justify-center h-9 px-4 rounded-lg bg-gray-800 border border-gray-600 hover:bg-gray-700 transition-colors text-xs font-semibold text-gray-200">
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    {isProcessingImage ? 'Processando...' : '📤 Upload de arquivo local'}
                  </label>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-2 text-sm text-gray-200 bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({...f, isActive: e.target.checked}))} className="w-4 h-4 accent-orange-500 rounded" />
              <span className="font-medium">Produto visível e disponível para venda na vitrine</span>
            </label>
          </form>
        </div>
        
        <div className="p-5 border-t border-gray-700 bg-gray-900/95 rounded-b-xl">
          <button type="submit" form="tcg-form" disabled={loading} className="w-full py-3 rounded-lg text-sm font-extrabold text-white bg-orange-600 hover:bg-orange-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20">
            {loading ? 'Processando...' : 'Salvar Produto TCG 🃏'}
          </button>
        </div>
      </div>
    </div>
  );
}
