import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Plus, FileEdit, Trash2, Save, Loader2 } from 'lucide-react';
import { getInsurances, createInsurance, updateInsurance, deleteInsurance } from '../api/insurance';
import { Card, Button, Modal, Input, cn } from '../components/UI';
import { useToast, getErrorMessage } from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

const emptyForm = { name: '', coverage_rate: 80, description: '', is_active: true };

const InsurancePage = () => {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['insurances'], queryFn: getInsurances });
  const insurances = data?.data?.results || [];

  const saveMutation = useMutation({
    mutationFn: (payload) => editing ? updateInsurance(editing.id, payload) : createInsurance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurances'] });
      setShowModal(false);
      setEditing(null);
      setFormData(emptyForm);
      toast('Assurance enregistrée.', 'success');
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInsurance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurances'] });
      setDeleteTarget(null);
      toast('Assurance supprimée.', 'success');
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const openEdit = (ins) => {
    setEditing(ins);
    setFormData({ name: ins.name, coverage_rate: ins.coverage_rate, description: ins.description || '', is_active: ins.is_active });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Assurances</h2>
          <p className="page-subtitle">Taux de couverture par organisme.</p>
        </div>
        <Button icon={Plus} onClick={() => { setEditing(null); setFormData(emptyForm); setShowModal(true); }}>Nouvelle assurance</Button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-pharmacy-600" size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {insurances.map((ins) => (
              <motion.div key={ins.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="p-0 overflow-hidden h-full flex flex-col">
                  <div className="p-6 bg-medical-50/50 border-b flex justify-between">
                    <ShieldCheck size={24} className="text-medical-600" />
                    <span className={cn('px-2 py-1 rounded-full text-[10px] font-bold uppercase',
                      ins.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                      {ins.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="p-6 flex-1">
                    <h3 className="font-black text-xl">{ins.name}</h3>
                    <p className="text-3xl font-black text-medical-600 mt-2">{ins.coverage_rate}%</p>
                    <p className="text-sm text-slate-500 mt-3 italic">{ins.description || '—'}</p>
                  </div>
                  <div className="p-4 border-t bg-slate-50/50 flex justify-end gap-2">
                    <button onClick={() => openEdit(ins)} className="p-2 text-slate-400 hover:text-medical-600"><FileEdit size={16} /></button>
                    <button onClick={() => setDeleteTarget(ins)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Modifier' : 'Nouvelle assurance'}>
        <div className="p-6 space-y-4">
          <Input label="Nom" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <Input label="Taux (%)" type="number" value={formData.coverage_rate} onChange={(e) => setFormData({ ...formData, coverage_rate: e.target.value })} />
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field" rows={3} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
            Assurance active
          </label>
          <Button className="w-full" icon={saveMutation.isPending ? Loader2 : Save}
            onClick={() => saveMutation.mutate(formData)} disabled={!formData.name || saveMutation.isPending}>
            Enregistrer
          </Button>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer" size="sm">
        <div className="p-6 space-y-4">
          <p>Supprimer <strong>{deleteTarget?.name}</strong> ?</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="danger" className="flex-1" onClick={() => deleteMutation.mutate(deleteTarget.id)}>Supprimer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InsurancePage;
