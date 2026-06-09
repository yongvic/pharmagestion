import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowUpCircle, ArrowDownCircle, Search, History, AlertTriangle, Save, Loader2 } from 'lucide-react';
import { getInventoryMovements, createStockMovement } from '../api/inventory';
import { getMedications } from '../api/medications';
import { Card, Button, DoubleBezel, Modal, Input, Select, cn } from '../components/UI';
import { useToast, getErrorMessage } from '../components/Toast';
import useAuthStore from '../store/useAuthStore';
import { formatDateTime } from '../utils/format';

const InventoryPage = () => {
  const { isAdmin } = useAuthStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ medication: '', type: 'ENTRY', quantity: '', reason: '' });
  const queryClient = useQueryClient();

  const { data: movementsData } = useQuery({
    queryKey: ['inventory-movements', search],
    queryFn: () => getInventoryMovements({ search }),
  });

  const { data: lowStockData } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => getMedications({ low_stock: true }),
  });

  const { data: medsData } = useQuery({
    queryKey: ['meds-list'],
    queryFn: () => getMedications({ page_size: 200 }),
  });

  const movements = movementsData?.data?.results || [];
  const lowStockMeds = lowStockData?.data?.results || [];
  const allMeds = medsData?.data?.results || [];

  const createMutation = useMutation({
    mutationFn: createStockMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      setShowModal(false);
      setForm({ medication: '', type: 'ENTRY', quantity: '', reason: '' });
      toast('Mouvement enregistré.', 'success');
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Gestion de Stock</h2>
          <p className="page-subtitle">Entrées, sorties et historique des mouvements.</p>
        </div>
        {isAdmin() && <Button icon={Plus} onClick={() => setShowModal(true)}>Nouveau mouvement</Button>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-amber-50/60 border-amber-100 p-5">
            <div className="flex items-center gap-3 text-orange-600 mb-2">
              <AlertTriangle size={20} /><h4 className="font-bold text-sm uppercase">Alertes</h4>
            </div>
            <p className="text-3xl font-black text-orange-700">{lowStockMeds.length}</p>
            <p className="text-xs text-orange-600/70 mt-1">Produits sous le seuil</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3 text-medical-600 mb-2">
              <History size={20} /><h4 className="font-bold text-sm uppercase">Mouvements</h4>
            </div>
            <p className="text-3xl font-black text-slate-800">{movementsData?.data?.count || movements.length}</p>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <DoubleBezel className="overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><History size={18} /> Historique</h3>
              <div className="relative w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Filtrer..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 rounded-full py-1.5 pl-9 pr-4 text-xs outline-none focus:ring-2 focus:ring-pharmacy-500/20" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    {['Type', 'Médicament', 'Quantité', 'Date', 'Auteur'].map((h) => (
                      <th key={h} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {movements.map((move) => (
                    <tr key={move.id} className="hover:bg-slate-50/30">
                      <td className="px-6 py-4">
                        <span className={cn('flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full w-max',
                          move.type === 'ENTRY' ? 'bg-green-50 text-green-600' : move.type === 'EXIT' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600')}>
                          {move.type === 'ENTRY' ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                          {move.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold">{move.medication_name}</p>
                        <p className="text-[10px] text-slate-400">{move.reason || '—'}</p>
                      </td>
                      <td className="px-6 py-4 font-black">{move.type === 'EXIT' ? '-' : '+'}{move.quantity}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{formatDateTime(move.created_at)}</td>
                      <td className="px-6 py-4 text-xs">{move.user_name}</td>
                    </tr>
                  ))}
                  {movements.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-300 italic">Aucun mouvement.</td></tr>}
                </tbody>
              </table>
            </div>
          </DoubleBezel>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nouveau mouvement de stock">
        <div className="p-6 space-y-4">
          <Select label="Médicament" value={form.medication} onChange={(e) => setForm({ ...form, medication: e.target.value })}>
            <option value="">Sélectionner...</option>
            {allMeds.map((m) => <option key={m.id} value={m.id}>{m.name} (stock: {m.stock_quantity})</option>)}
          </Select>
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="ENTRY">Entrée</option>
            <option value="EXIT">Sortie</option>
            <option value="RETURN">Retour</option>
            <option value="ADJUSTMENT">Ajustement (+/-)</option>
          </Select>
          <Input label="Quantité" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <Input label="Raison / Note" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder={form.type === 'ADJUSTMENT' ? 'Préfixer par - pour retirer' : 'Réception fournisseur...'} />
          <Button className="w-full py-4" icon={createMutation.isPending ? Loader2 : Save}
            disabled={!form.medication || !form.quantity || createMutation.isPending}
            onClick={() => createMutation.mutate({ ...form, quantity: parseInt(form.quantity, 10) })}>
            Enregistrer
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default InventoryPage;
