import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Store, CreditCard, Save, Loader2 } from 'lucide-react';
import { getSettings, updateSettings } from '../api/settings';
import { Button, DoubleBezel, Input } from '../components/UI';
import { useToast, getErrorMessage } from '../components/Toast';

const SettingsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settingsData, isLoading } = useQuery({ queryKey: ['settings'], queryFn: getSettings });

  const [formData, setFormData] = useState({
    name: '', address: '', phone: '', email: '', currency: 'FCFA',
    tva_rate: 0, receipt_header: '', receipt_footer: '',
  });

  useEffect(() => {
    if (settingsData?.data) setFormData(settingsData.data);
  }, [settingsData]);

  const mutation = useMutation({
    mutationFn: (data) => updateSettings(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast('Paramètres enregistrés.', 'success');
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-pharmacy-600" size={32} /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="page-title">Paramètres</h2>
        <p className="page-subtitle">Identité de la pharmacie et préférences de facturation.</p>
      </div>

      <DoubleBezel className="p-8 space-y-8">
        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><Store size={20} className="text-pharmacy-600" /> Pharmacie</h3>
          <Input label="Nom" name="name" value={formData.name || ''} onChange={handleChange} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Téléphone" name="phone" value={formData.phone || ''} onChange={handleChange} />
            <Input label="Email" name="email" value={formData.email || ''} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Adresse</label>
            <textarea name="address" value={formData.address || ''} onChange={handleChange} rows={3} className="input-field" />
          </div>
        </section>

        <hr className="border-slate-100" />

        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><CreditCard size={20} className="text-medical-600" /> Facturation</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Devise" name="currency" value={formData.currency || 'FCFA'} onChange={handleChange} />
            <Input label="TVA (%)" name="tva_rate" type="number" value={formData.tva_rate} onChange={handleChange} />
          </div>
          <Input label="En-tête ticket" name="receipt_header" value={formData.receipt_header || ''} onChange={handleChange} />
          <Input label="Pied de page ticket" name="receipt_footer" value={formData.receipt_footer || ''} onChange={handleChange} />
        </section>

        <Button className="w-full py-4" icon={mutation.isPending ? Loader2 : Save}
          onClick={() => mutation.mutate(formData)} disabled={mutation.isPending}>
          Enregistrer les modifications
        </Button>
      </DoubleBezel>
    </div>
  );
};

export default SettingsPage;
