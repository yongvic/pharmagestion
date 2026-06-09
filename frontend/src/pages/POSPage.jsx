import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ShoppingCart, Plus, Minus, ShieldCheck, CreditCard, Banknote, Smartphone, CheckCircle2, X, Loader2 } from 'lucide-react';
import { getMedications } from '../api/medications';
import { getInsurances, createSale } from '../api/sales';
import { Card, Button, DoubleBezel, cn } from '../components/UI';
import { useToast, getErrorMessage } from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';
import { formatCurrency } from '../utils/format';

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Espèces', icon: Banknote },
  { id: 'MOBILE_MONEY', label: 'Mobile Money', icon: Smartphone },
  { id: 'CARD', label: 'Carte', icon: CreditCard },
];

const POSPage = () => {
  const { isPharmacist } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const { data: medsData, isFetching } = useQuery({
    queryKey: ['medications-pos', search],
    queryFn: () => getMedications({ search, page_size: 10 }),
    enabled: search.length > 1,
  });

  const { data: insuranceData } = useQuery({
    queryKey: ['insurances-active'],
    queryFn: () => getInsurances({ active_only: true }),
  });

  const addToCart = (med) => {
    if (med.stock_quantity <= 0) {
      toast(`${med.name} est en rupture de stock.`, 'warning');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.id === med.id);
      const newQty = existing ? existing.quantity + 1 : 1;
      if (newQty > med.stock_quantity) {
        toast(`Stock insuffisant (${med.stock_quantity} disponible).`, 'warning');
        return prev;
      }
      if (existing) return prev.map((i) => i.id === med.id ? { ...i, quantity: newQty } : i);
      return [...prev, { ...med, quantity: 1 }];
    });
    setSearch('');
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const newQty = item.quantity + delta;
      if (newQty < 1) return item;
      if (newQty > item.stock_quantity) {
        toast(`Stock max: ${item.stock_quantity}`, 'warning');
        return item;
      }
      return { ...item, quantity: newQty };
    }));
  };

  const totalAmount = cart.reduce((s, i) => s + parseFloat(i.selling_price) * i.quantity, 0);
  const insuranceCoverage = selectedInsurance ? totalAmount * parseFloat(selectedInsurance.coverage_rate) / 100 : 0;
  const clientAmount = totalAmount - insuranceCoverage;
  const insurances = insuranceData?.data?.results || [];

  const saleMutation = useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      setCart([]);
      setSelectedInsurance(null);
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['pending-sales'] });
      toast(isPharmacist() ? 'Commande envoyée à la caisse.' : 'Vente enregistrée.', 'success');
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const handleProcessSale = () => {
    if (!cart.length) return;
    saleMutation.mutate({
      items: cart.map((i) => ({ medication: i.id, quantity: i.quantity })),
      insurance: selectedInsurance?.id || null,
      payment_method: paymentMethod,
      status: isPharmacist() ? 'PENDING' : 'COMPLETED',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      <div className="lg:col-span-7 flex flex-col gap-6 overflow-hidden">
        <Card className="p-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder={isPharmacist() ? 'Préparer une commande...' : 'Rechercher un produit...'}
              value={search} onChange={(e) => setSearch(e.target.value)} autoFocus
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-12 text-lg outline-none focus:ring-4 focus:ring-pharmacy-500/10 focus:border-pharmacy-500" />
            {isFetching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-pharmacy-500" size={20} />}
          </div>
        </Card>
        <div className="flex-1 overflow-y-auto space-y-3">
          <AnimatePresence>
            {search.length > 1 && medsData?.data?.results?.map((med) => (
              <motion.div key={med.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                onClick={() => addToCart(med)}
                className="glass-card p-4 flex items-center justify-between cursor-pointer hover:border-pharmacy-300 group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-pharmacy-50 rounded-xl flex items-center justify-center font-bold text-pharmacy-600">{med.name[0]}</div>
                  <div>
                    <h4 className="font-bold">{med.name}</h4>
                    <p className="text-xs text-slate-400">{med.dosage}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-pharmacy-600">{formatCurrency(med.selling_price)}</p>
                  <p className={cn('text-[10px] font-bold uppercase', med.stock_quantity <= med.min_stock ? 'text-red-500' : 'text-slate-400')}>
                    Stock: {med.stock_quantity}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="lg:col-span-5 flex flex-col">
        <DoubleBezel className="flex-1 flex flex-col p-0 overflow-hidden">
          <div className="p-6 border-b flex justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2"><ShoppingCart size={20} className="text-pharmacy-600" />
              {isPharmacist() ? 'Préparation' : 'Panier'}</h3>
            <span className="bg-pharmacy-100 text-pharmacy-700 px-3 py-1 rounded-full text-xs font-bold">{cart.length} articles</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="bg-slate-50/50 p-3 rounded-xl border flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-sm truncate">{item.name}</h5>
                  <p className="text-[10px] text-slate-400">{formatCurrency(item.selling_price)} / unité</p>
                </div>
                <div className="flex items-center gap-1 bg-white rounded-lg p-1 border">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1"><Minus size={14} /></button>
                  <span className="w-8 text-center font-bold text-xs">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1"><Plus size={14} /></button>
                </div>
                <p className="font-bold text-sm w-24 text-right">{formatCurrency(parseFloat(item.selling_price) * item.quantity)}</p>
                <button onClick={() => setCart((p) => p.filter((i) => i.id !== item.id))} className="text-slate-300 hover:text-red-500"><X size={16} /></button>
              </div>
            ))}
          </div>
          <div className="p-6 bg-slate-50/50 space-y-4 border-t">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mb-2"><ShieldCheck size={14} /> Assurance</label>
              <select className="input-field" value={selectedInsurance?.id || ''} onChange={(e) => {
                const ins = insurances.find((i) => i.id === parseInt(e.target.value, 10));
                setSelectedInsurance(ins || null);
              }}>
                <option value="">Aucune</option>
                {insurances.map((ins) => <option key={ins.id} value={ins.id}>{ins.name} ({ins.coverage_rate}%)</option>)}
              </select>
            </div>
            {!isPharmacist() && (
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Mode de paiement</label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setPaymentMethod(id)}
                      className={cn('flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-semibold transition-all',
                        paymentMethod === id ? 'border-pharmacy-500 bg-pharmacy-50 text-pharmacy-700' : 'border-slate-200 text-slate-500')}>
                      <Icon size={16} />{label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span>Sous-total</span><span className="font-bold">{formatCurrency(totalAmount)}</span></div>
              {selectedInsurance && <div className="flex justify-between text-sm text-medical-600 font-bold"><span>Assurance</span><span>- {formatCurrency(insuranceCoverage)}</span></div>}
              <div className="pt-3 border-t flex justify-between items-end">
                <span className="font-black uppercase text-xs">Net à payer</span>
                <span className="text-3xl font-black text-pharmacy-600">{formatCurrency(clientAmount)}</span>
              </div>
            </div>
            <Button className="w-full py-4 text-lg" icon={saleMutation.isPending ? Loader2 : CheckCircle2}
              onClick={handleProcessSale} disabled={!cart.length || saleMutation.isPending}>
              {saleMutation.isPending ? 'Enregistrement...' : isPharmacist() ? 'Envoyer à la Caisse' : 'Finaliser la Vente'}
            </Button>
          </div>
        </DoubleBezel>
      </div>
    </div>
  );
};

export default POSPage;
