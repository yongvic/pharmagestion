import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tags, Plus, FileEdit, Trash2, Save, Loader2, Search, Pill } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/medications';
import { Card, Button, Modal, Input, cn } from '../components/UI';
import { useToast, getErrorMessage } from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

const emptyForm = { name: '', description: '' };

const CategoriesPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['categories', search],
    queryFn: () => getCategories(search ? { search } : {}),
  });
  const categories = data?.data?.results || data?.data || [];

  const saveMutation = useMutation({
    mutationFn: (payload) => (editing ? updateCategory(editing.id, payload) : createCategory(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowModal(false);
      setEditing(null);
      setFormData(emptyForm);
      toast(editing ? 'Catégorie mise à jour.' : 'Catégorie créée.', 'success');
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteTarget(null);
      toast('Catégorie supprimée.', 'success');
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const openEdit = (cat) => {
    setEditing(cat);
    setFormData({ name: cat.name, description: cat.description || '' });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="page-title">Catégories</h2>
          <p className="page-subtitle">Classer les médicaments par famille thérapeutique.</p>
        </div>
        <Button icon={Plus} onClick={() => { setEditing(null); setFormData(emptyForm); setShowModal(true); }}>
          Nouvelle catégorie
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher une catégorie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-pharmacy-500/20"
          />
        </div>
      </Card>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-pharmacy-600" size={32} />
        </div>
      ) : categories.length === 0 ? (
        <Card className="p-12 text-center">
          <Tags size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">Aucune catégorie trouvée.</p>
          <p className="text-sm text-slate-400 mt-1">Créez votre première catégorie pour organiser le catalogue.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {categories.map((cat) => (
              <motion.div key={cat.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="p-0 overflow-hidden h-full flex flex-col">
                  <div className="p-6 bg-pharmacy-50/50 border-b flex justify-between items-start">
                    <Tags size={24} className="text-pharmacy-600" />
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-white text-slate-600 border border-slate-200">
                      <Pill size={12} />
                      {cat.medication_count ?? 0} produit{(cat.medication_count ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="p-6 flex-1">
                    <h3 className="font-black text-xl text-slate-800">{cat.name}</h3>
                    <p className="text-sm text-slate-500 mt-3 italic line-clamp-3">{cat.description || 'Aucune description.'}</p>
                  </div>
                  <div className="p-4 border-t bg-slate-50/50 flex justify-end gap-2">
                    <button onClick={() => openEdit(cat)} className="p-2 text-slate-400 hover:text-pharmacy-600" title="Modifier">
                      <FileEdit size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(cat)}
                      disabled={(cat.medication_count ?? 0) > 0}
                      className={cn(
                        'p-2',
                        (cat.medication_count ?? 0) > 0
                          ? 'text-slate-200 cursor-not-allowed'
                          : 'text-slate-400 hover:text-red-500',
                      )}
                      title={(cat.medication_count ?? 0) > 0 ? 'Réassignez les médicaments avant suppression' : 'Supprimer'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}>
        <div className="p-6 space-y-4">
          <Input label="Nom" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="Ex. Médicaments contre la douleur et la fièvre"
            />
          </div>
          <Button
            className="w-full"
            icon={saveMutation.isPending ? Loader2 : Save}
            onClick={() => saveMutation.mutate(formData)}
            disabled={!formData.name.trim() || saveMutation.isPending}
          >
            Enregistrer
          </Button>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer" size="sm">
        <div className="p-6 space-y-4">
          <p>
            Supprimer la catégorie <strong>{deleteTarget?.name}</strong> ?
          </p>
          {(deleteTarget?.medication_count ?? 0) > 0 ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
              Cette catégorie contient {deleteTarget.medication_count} médicament(s). Réassignez-les avant suppression.
            </p>
          ) : (
            <p className="text-sm text-slate-500">Cette action est irréversible.</p>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending || (deleteTarget?.medication_count ?? 0) > 0}
            >
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoriesPage;
