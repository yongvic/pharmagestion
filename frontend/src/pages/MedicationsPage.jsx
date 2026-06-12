import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, FileEdit, Trash2, ChevronLeft, ChevronRight, Save, Barcode, Loader2, AlertCircle, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { getMedications, createMedication, updateMedication, deleteMedication, getCategories, createCategory, importMedications, downloadImportTemplate } from '../api/medications';
import { Card, Button, DoubleBezel, Modal, Input, cn } from '../components/UI';
import { useToast, getErrorMessage } from '../components/Toast';
import useAuthStore from '../store/useAuthStore';
import { formatCurrency, formatDate } from '../utils/format';

const emptyForm = {
  name: '', generic_name: '', category: '', dosage: '',
  purchase_price: '', selling_price: '', stock_quantity: 0,
  min_stock: 5, expiry_date: '', barcode: '',
};

const emptyCategoryForm = { name: '', description: '' };

const MedicationsPage = () => {
  const { isAdmin } = useAuthStore();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearch(q);
  }, [searchParams]);
  const [page, setPage] = useState(1);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [importResult, setImportResult] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['medications', search, page, lowStockOnly, categoryFilter],
    queryFn: () => getMedications({
      search,
      page,
      ...(lowStockOnly ? { low_stock: true } : {}),
      ...(categoryFilter ? { category: categoryFilter } : {}),
    }),
  });

  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const categories = catData?.data?.results || catData?.data || [];
  const meds = data?.data?.results || [];

  const saveMutation = useMutation({
    mutationFn: (payload) => editing ? updateMedication(editing.id, payload) : createMedication(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      setShowModal(false);
      setEditing(null);
      setFormData(emptyForm);
      toast(editing ? 'Médicament mis à jour.' : 'Médicament ajouté.', 'success');
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMedication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      setDeleteTarget(null);
      toast('Médicament supprimé.', 'success');
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setFormData((prev) => ({ ...prev, category: String(res.data.id) }));
      setShowCategoryModal(false);
      setCategoryForm(emptyCategoryForm);
      toast('Catégorie créée et sélectionnée.', 'success');
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const importMutation = useMutation({
    mutationFn: () => importMedications(importFile, updateExisting),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setImportResult(res.data);
      setImportFile(null);
      const { created, updated, skipped, categories_created: categoriesCreated } = res.data;
      toast(
        `${created} créé(s), ${updated} mis à jour${categoriesCreated ? `, ${categoriesCreated} catégorie(s) créée(s)` : ''}.`,
        'success',
      );
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const openImport = () => {
    setImportFile(null);
    setImportResult(null);
    setUpdateExisting(true);
    setShowImportModal(true);
  };

  const openCreate = () => { setEditing(null); setFormData(emptyForm); setShowModal(true); };
  const openEdit = (med) => {
    setEditing(med);
    setFormData({
      name: med.name, generic_name: med.generic_name || '', category: med.category || '',
      dosage: med.dosage || '', purchase_price: med.purchase_price, selling_price: med.selling_price,
      stock_quantity: med.stock_quantity, min_stock: med.min_stock,
      expiry_date: med.expiry_date, barcode: med.barcode || '',
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="page-title">Médicaments</h2>
          <p className="page-subtitle">Catalogue produits et niveaux de stock.</p>
        </div>
        {isAdmin() && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" icon={Upload} onClick={openImport}>Importer Excel/CSV</Button>
            <Button icon={Plus} onClick={openCreate}>Ajouter un médicament</Button>
          </div>
        )}
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Rechercher..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-pharmacy-500/20" />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium bg-white text-slate-600 min-w-[11rem]"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.medication_count ?? 0})</option>
            ))}
          </select>
          <button onClick={() => { setLowStockOnly(!lowStockOnly); setPage(1); }}
            className={cn('flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-colors',
              lowStockOnly ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-600')}>
            <Filter size={16} /> {lowStockOnly ? 'Stock faible actif' : 'Filtrer stock faible'}
          </button>
        </div>
      </Card>

      <DoubleBezel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                {['Médicament', 'Catégorie', 'Prix', 'Stock', 'Expiration', isAdmin() && 'Actions'].filter(Boolean).map((h) => (
                  <th key={h} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center"><Loader2 className="animate-spin mx-auto text-pharmacy-500" /></td></tr>
              ) : meds.map((med) => (
                <tr key={med.id} className="hover:bg-slate-50/50 group">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-800">{med.name}</span>
                    <span className="block text-xs text-slate-400">{med.generic_name || '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-medical-50 text-medical-700 rounded-full text-[11px] font-bold">
                      {med.category_name || 'Sans catégorie'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold">{formatCurrency(med.selling_price)}</td>
                  <td className="px-6 py-4">
                    <span className={cn('font-bold', med.stock_quantity <= med.min_stock && 'text-red-500')}>{med.stock_quantity}</span>
                    {med.stock_quantity <= med.min_stock && <AlertCircle size={14} className="inline ml-1 text-red-500" />}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDate(med.expiry_date)}</td>
                  {isAdmin() && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(med)} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-medical-600"><FileEdit size={16} /></button>
                        <button onClick={() => setDeleteTarget(med)} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-slate-50/30 border-t flex justify-between items-center">
          <span className="text-xs text-slate-500">{data?.data?.count || 0} résultats</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-lg disabled:opacity-30"><ChevronLeft size={16} /></button>
            <button disabled={!data?.data?.next} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-lg disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        </div>
      </DoubleBezel>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Modifier le médicament' : 'Nouveau médicament'} size="lg">
        <div className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Input label="Nom commercial" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <Input label="Nom générique" value={formData.generic_name} onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })} />
            <Input label="Dosage" value={formData.dosage} onChange={(e) => setFormData({ ...formData, dosage: e.target.value })} placeholder="500mg" />
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Catégorie *</label>
              <div className="flex gap-2">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field cursor-pointer flex-1"
                  required
                >
                  <option value="">Choisir une catégorie...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {isAdmin() && (
                  <button
                    type="button"
                    onClick={() => { setCategoryForm(emptyCategoryForm); setShowCategoryModal(true); }}
                    className="shrink-0 px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-pharmacy-600 hover:bg-pharmacy-50 transition-colors"
                    title="Nouvelle catégorie"
                  >
                    <Plus size={18} />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Code-barres</label>
              <div className="relative"><Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} className="input-field pl-10" />
              </div>
            </div>
            <Input label="Prix d'achat" type="number" value={formData.purchase_price} onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })} />
            <Input label="Prix de vente" type="number" value={formData.selling_price} onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })} />
            {!editing && <Input label="Stock initial" type="number" value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })} />}
            <Input label="Stock minimum" type="number" value={formData.min_stock} onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })} />
            <Input label="Date d'expiration" type="date" value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} />
          </div>
          <Button className="w-full py-4" icon={saveMutation.isPending ? Loader2 : Save}
            onClick={() => saveMutation.mutate(formData)}
            disabled={saveMutation.isPending || !formData.name || !formData.category || !formData.expiry_date}>
            {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmer la suppression" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-slate-600">Supprimer <strong>{deleteTarget?.name}</strong> ?</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="danger" className="flex-1" onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}>Supprimer</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Nouvelle catégorie" size="sm">
        <div className="p-6 space-y-4">
          <Input
            label="Nom"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            placeholder="Ex. Analgésiques"
          />
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
            <textarea
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              className="input-field"
              rows={2}
              placeholder="Optionnel"
            />
          </div>
          <Button
            className="w-full"
            icon={createCategoryMutation.isPending ? Loader2 : Plus}
            onClick={() => createCategoryMutation.mutate(categoryForm)}
            disabled={!categoryForm.name.trim() || createCategoryMutation.isPending}
          >
            Créer et sélectionner
          </Button>
        </div>
      </Modal>

      <Modal open={showImportModal} onClose={() => setShowImportModal(false)} title="Importer des médicaments" size="lg">
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="rounded-xl border border-pharmacy-100 bg-pharmacy-50/50 p-4 space-y-2">
            <p className="text-sm font-semibold text-pharmacy-800">Classification par catégorie</p>
            <p className="text-sm text-slate-600">
              Chaque produit doit avoir une <strong>catégorie</strong> (colonne <code className="text-xs bg-white px-1 rounded">categorie</code> obligatoire).
              Les fichiers inventaire hôpital <strong>MEG / CHP / NTG</strong> sont reconnus automatiquement
              (colonnes DESIGATTION, PEREMP., CDMT — catégories LES COMPRIMES, INJECTABLES, etc.).
            </p>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {categories.map((c) => (
                  <span key={c.id} className="px-2 py-0.5 bg-white border border-pharmacy-100 rounded-full text-[11px] font-medium text-pharmacy-700">
                    {c.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" icon={Download} onClick={() => downloadImportTemplate('xlsx')}>
              Modèle Excel
            </Button>
            <Button variant="outline" icon={Download} onClick={() => downloadImportTemplate('csv')}>
              Modèle CSV
            </Button>
          </div>

          <label className="block cursor-pointer">
            <div className={cn(
              'border-2 border-dashed rounded-2xl p-8 text-center transition-colors',
              importFile ? 'border-pharmacy-300 bg-pharmacy-50/40' : 'border-slate-200 hover:border-pharmacy-200 hover:bg-slate-50',
            )}>
              <FileSpreadsheet className="mx-auto text-pharmacy-500 mb-3" size={36} />
              {importFile ? (
                <>
                  <p className="font-semibold text-slate-800">{importFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Cliquez pour changer de fichier</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-slate-700">Glissez ou cliquez pour choisir un fichier</p>
                  <p className="text-xs text-slate-400 mt-1">.xlsx ou .csv</p>
                </>
              )}
            </div>
            <input
              type="file"
              accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              className="hidden"
              onChange={(e) => { setImportFile(e.target.files?.[0] || null); setImportResult(null); }}
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              checked={updateExisting}
              onChange={(e) => setUpdateExisting(e.target.checked)}
            />
            Mettre à jour si le code-barres existe déjà
          </label>

          <Button
            className="w-full"
            icon={importMutation.isPending ? Loader2 : Upload}
            onClick={() => importMutation.mutate()}
            disabled={!importFile || importMutation.isPending}
          >
            {importMutation.isPending ? 'Import en cours...' : 'Lancer l\'import'}
          </Button>

          {importResult && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              {importResult.format === 'meg_chp_inventaire' && (
                <p className="text-xs font-semibold text-pharmacy-700 bg-pharmacy-50 border border-pharmacy-100 rounded-lg px-3 py-2">
                  Format inventaire MEG/CHP détecté — feuille importée : <strong>{importResult.sheet}</strong>
                </p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                <div><p className="text-2xl font-black text-emerald-600">{importResult.created}</p><p className="text-xs text-slate-500">Créés</p></div>
                <div><p className="text-2xl font-black text-pharmacy-600">{importResult.updated}</p><p className="text-xs text-slate-500">Mis à jour</p></div>
                <div><p className="text-2xl font-black text-indigo-600">{importResult.categories_created ?? 0}</p><p className="text-xs text-slate-500">Catégories créées</p></div>
                <div><p className="text-2xl font-black text-amber-600">{importResult.skipped}</p><p className="text-xs text-slate-500">Ignorés</p></div>
                <div><p className="text-2xl font-black text-slate-700">{importResult.total_rows}</p><p className="text-xs text-slate-500">Lignes traitées</p></div>
              </div>
              {importResult.errors?.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  <p className="text-xs font-bold text-red-600 uppercase">Erreurs ({importResult.errors.length})</p>
                  {importResult.errors.map((err) => (
                    <p key={`${err.line}-${err.message}`} className="text-xs text-red-600">
                      Ligne {err.line} : {err.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MedicationsPage;
