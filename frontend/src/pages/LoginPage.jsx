import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Lock, User, ArrowRight, Shield, Sparkles } from 'lucide-react';
import { DoubleBezel, Button } from '../components/UI';
import PharmacyLogo3D from '../components/PharmacyLogo3D';
import useAuthStore from '../store/useAuthStore';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const home = user.role === 'ADMIN' ? '/' : user.role === 'PHARMACIST' ? '/medications' : '/pos';
      navigate(home, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  if (isAuthenticated) return <Navigate to="/home" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const success = await login(username, password);
    if (success) {
      const role = useAuthStore.getState().user?.role;
      const home = role === 'ADMIN' ? '/' : role === 'PHARMACIST' ? '/medications' : '/pos';
      navigate(home);
    } else {
      setError('Identifiants incorrects ou serveur injoignable.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[55%] sidebar-gradient relative overflow-hidden items-center justify-center p-16">
        <div className="absolute inset-0">
          <div className="absolute top-16 left-16 w-72 h-72 rounded-full bg-indigo-400/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-violet-400/15 blur-3xl" />
        </div>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="relative z-10 flex flex-col items-center text-center max-w-lg">
          <PharmacyLogo3D size="xl" className="mb-10" />
          <h1 className="text-5xl font-black tracking-tight text-white leading-none">PharmaGestion</h1>
          <p className="text-indigo-200/75 mt-5 text-lg leading-relaxed max-w-sm">
            Logiciel professionnel de gestion de pharmacie — stock, ventes, assurances.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-indigo-300/60 text-sm">
            <span className="flex items-center gap-2"><Shield size={15} className="text-indigo-300" /> Données sécurisées</span>
            <span className="flex items-center gap-2"><Sparkles size={15} className="text-indigo-300" /> Application desktop</span>
          </div>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <PharmacyLogo3D size="md" className="mb-5" />
            <h1 className="text-2xl font-black text-slate-900">PharmaGestion</h1>
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900">Connexion</h2>
            <p className="text-slate-600 mt-1 text-sm">Accédez à votre espace professionnel</p>
          </div>
          <DoubleBezel className="w-full">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nom d'utilisateur</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                    className="input-field pl-10" placeholder="User Name" required autoComplete="username" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10" placeholder="••••••••" required autoComplete="current-password" />
                </div>
              </div>
              {error && <p className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
              <Button type="submit" className="w-full py-4" icon={ArrowRight} disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>
          </DoubleBezel>
          <p className="text-center text-slate-400 text-xs mt-8">© 2026 PharmaGestion Pro — v2.0</p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
