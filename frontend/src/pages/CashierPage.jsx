import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Printer, Banknote, Eye, X } from 'lucide-react';
import { getSales, updateSale } from '../api/sales';
import { getSettings } from '../api/settings';
import { Button, DoubleBezel, Modal, cn } from '../components/UI';
import { useToast, getErrorMessage } from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatDate } from '../utils/format';

const CashierPage = () => {
  const { toast } = useToast();
  const [selectedSale, setSelectedSale] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const queryClient = useQueryClient();

  const { data: salesData } = useQuery({
    queryKey: ['pending-sales'],
    queryFn: () => getSales({ status: 'PENDING' }),
    refetchInterval: 5000,
  });

  const { data: settingsData } = useQuery({ queryKey: ['settings'], queryFn: getSettings });

  const completeMutation = useMutation({
    mutationFn: (id) => updateSale(id, { status: 'COMPLETED' }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['pending-sales'] });
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      setSelectedSale(res.data);
      setShowReceipt(true);
      toast('Paiement validé.', 'success');
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const pendingSales = salesData?.data?.results || [];
  const settings = settingsData?.data || {};

  const handlePrint = () => {
    if (window.electronAPI?.printReceipt) {
      window.electronAPI.printReceipt();
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Caisse</h2>
          <p className="page-subtitle">Validez les commandes et encaissez les paiements.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-pharmacy-50 text-pharmacy-700 rounded-full text-xs font-bold">
          <Clock size={14} /> {pendingSales.length} en attente
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {pendingSales.map((sale) => (
            <motion.div key={sale.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedSale(sale)}
              className={cn('glass-card p-5 border-2 cursor-pointer transition-all',
                selectedSale?.id === sale.id ? 'border-pharmacy-500' : 'border-transparent')}>
              <div className="flex justify-between mb-4">
                <div>
                  <h4 className="font-bold">Facture {sale.invoice_number}</h4>
                  <p className="text-xs text-slate-400">Par {sale.pharmacist_name}</p>
                </div>
                <p className="text-xl font-black">{formatCurrency(sale.client_amount)}</p>
              </div>
              <div className="flex justify-between pt-4 border-t">
                <span className="text-xs text-slate-400">{sale.items?.length} articles</span>
                <div className="flex gap-2">
                  <Button variant="outline" className="px-3 py-1.5 text-xs" icon={Eye}>Détails</Button>
                  <Button variant="primary" className="px-4 py-1.5 text-xs" icon={Banknote}
                    onClick={(e) => { e.stopPropagation(); completeMutation.mutate(sale.id); }}>
                    Encaisser
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
          {pendingSales.length === 0 && (
            <div className="h-64 glass-card flex flex-col items-center justify-center text-slate-300">
              <Clock size={48} className="mb-4 opacity-20" /><p>Aucune commande en attente</p>
            </div>
          )}
        </div>

        <div>
          {selectedSale ? (
            <DoubleBezel className="sticky top-24 p-0">
              <div className="p-6 border-b bg-slate-50/50">
                <h3 className="font-bold">Détails</h3>
                <p className="text-xs text-slate-400">{selectedSale.invoice_number}</p>
              </div>
              <div className="p-6 space-y-3 max-h-80 overflow-y-auto">
                {selectedSale.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="font-medium">{item.medication_name} x{item.quantity}</span>
                    <span className="font-bold">{formatCurrency(item.total_price)}</span>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t bg-slate-50/50">
                <div className="flex justify-between items-end">
                  <span className="font-black">À PAYER</span>
                  <span className="text-2xl font-black text-pharmacy-600">{formatCurrency(selectedSale.client_amount)}</span>
                </div>
              </div>
            </DoubleBezel>
          ) : (
            <div className="glass-card p-12 text-center text-slate-300 italic border-dashed border-2">Sélectionnez une commande</div>
          )}
        </div>
      </div>

      <Modal open={showReceipt} onClose={() => setShowReceipt(false)} title="Vente terminée" size="sm">
        <div className="p-6 text-center">
          <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
          <p className="text-slate-600 mb-6">Paiement de {formatCurrency(selectedSale?.client_amount)} validé.</p>
          <div className="p-4 bg-slate-50 rounded-2xl text-left font-mono text-xs border border-dashed mb-6 receipt-print">
            <div className="text-center mb-3">
              <p className="font-bold uppercase">{settings.name || 'PHARMAGESTION'}</p>
              <p className="text-slate-500">{settings.address}</p>
              <p className="text-slate-500">{settings.phone}</p>
            </div>
            <p>Facture: {selectedSale?.invoice_number}</p>
            <p>Date: {formatDate(new Date())}</p>
            <hr className="my-2 border-slate-200" />
            {selectedSale?.items?.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.medication_name?.substring(0, 18)} x{item.quantity}</span>
                <span>{item.total_price}</span>
              </div>
            ))}
            <hr className="my-2 border-slate-200" />
            <div className="flex justify-between font-bold">
              <span>TOTAL</span><span>{formatCurrency(selectedSale?.client_amount)}</span>
            </div>
            {settings.receipt_footer && <p className="text-center mt-3 text-slate-400">{settings.receipt_footer}</p>}
          </div>
          <Button className="w-full py-4" icon={Printer} onClick={handlePrint}>Imprimer</Button>
        </div>
      </Modal>
    </div>
  );
};

export default CashierPage;
