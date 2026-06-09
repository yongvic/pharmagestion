import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Phone, Mail, CheckCircle2, XCircle, Save, Loader2, FileEdit, Trash2, Power } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser } from '../api/users';
import { Card, Button, Modal, Input, Select, Badge, cn } from '../components/UI';
import { useToast, getErrorMessage } from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

const emptyForm = { username: '', password: '', first_name: '', last_name: '', email: '', role: 'CASHIER', phone: '' };

const ROLE_BADGES = {
  ADMIN: 'bg-purple-100 text-purple-700',
  PHARMACIST: 'bg-pharmacy-100 text-pharmacy-700',
  CASHIER: 'bg-medical-100 text-medical-700',
};

const UsersPage = () => {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers });
  const users = data?.data?.results || [];

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      const data = { ...payload };
      if (editing && !data.password) delete data.password;
      return editing ? updateUser(editing.id, data) : createUser(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      setEditing(null);
      setFormData(emptyForm);
      toast('Utilisateur enregistré.', 'success');
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => updateUser(id, { is_active }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast('Statut mis à jour.', 'success'); },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setDeleteTarget(null); toast('Utilisateur supprimé.', 'success'); },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const openEdit = (user) => {
    setEditing(user);
    setFormData({ username: user.username, password: '', first_name: user.first_name || '', last_name: user.last_name || '',
      email: user.email || '', role: user.role, phone: user.phone || '' });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Utilisateurs</h2>
          <p className="page-subtitle">Comptes employés et permissions.</p>
        </div>
        <Button icon={UserPlus} onClick={() => { setEditing(null); setFormData(emptyForm); setShowModal(true); }}>Nouvel utilisateur</Button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-pharmacy-600" size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {users.map((user) => (
              <motion.div key={user.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="p-6 h-full flex flex-col">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-xl uppercase">{user.username[0]}</div>
                    <div>
                      <h3 className="font-bold">{user.first_name} {user.last_name}</h3>
                      <p className="text-xs text-slate-400">@{user.username}</p>
                    </div>
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase">Rôle</span>
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', ROLE_BADGES[user.role])}>{user.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase">Statut</span>
                      <span className="flex items-center gap-1 text-[10px] font-bold">
                        {user.is_active ? <CheckCircle2 size={12} className="text-green-500" /> : <XCircle size={12} className="text-red-500" />}
                        {user.is_active ? 'ACTIF' : 'INACTIF'}
                      </span>
                    </div>
                    {user.phone && <div className="flex items-center gap-2 text-xs text-slate-500"><Phone size={14} />{user.phone}</div>}
                    {user.email && <div className="flex items-center gap-2 text-xs text-slate-500"><Mail size={14} />{user.email}</div>}
                  </div>
                  <div className="mt-6 pt-4 border-t flex gap-2">
                    <button onClick={() => openEdit(user)} className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold text-slate-500 hover:text-pharmacy-600 rounded-lg hover:bg-pharmacy-50">
                      <FileEdit size={14} /> Modifier
                    </button>
                    <button onClick={() => toggleMutation.mutate({ id: user.id, is_active: !user.is_active })}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold text-slate-500 hover:text-amber-600 rounded-lg hover:bg-amber-50">
                      <Power size={14} /> {user.is_active ? 'Désactiver' : 'Activer'}
                    </button>
                    <button onClick={() => setDeleteTarget(user)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Modifier' : 'Nouvel utilisateur'}>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Identifiant" name="username" value={formData.username} disabled={!!editing}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
            <Input label={editing ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'} type="password"
              value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            <Input label="Prénom" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
            <Input label="Nom" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
            <Select label="Rôle" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="col-span-2">
              <option value="ADMIN">Administrateur</option>
              <option value="PHARMACIST">Pharmacien</option>
              <option value="CASHIER">Caissier</option>
            </Select>
            <Input label="Téléphone" className="col-span-2" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <Button className="w-full py-4" icon={saveMutation.isPending ? Loader2 : Save}
            onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending}>
            Enregistrer
          </Button>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer" size="sm">
        <div className="p-6 space-y-4">
          <p>Supprimer <strong>{deleteTarget?.username}</strong> ?</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="danger" className="flex-1" onClick={() => deleteMutation.mutate(deleteTarget.id)}>Supprimer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;
