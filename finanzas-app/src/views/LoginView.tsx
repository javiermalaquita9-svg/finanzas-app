import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Button, Input } from '../components/UI';

export const LoginView: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    try {
      if (isLoginMode) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Correo o contraseña incorrectos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Ocurrió un error. Inténtalo de nuevo.');
      }
      console.error(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="p-8 bg-white rounded-lg shadow-xl max-w-sm w-full">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 text-center">
          {isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </h1>
        <p className="text-slate-500 mb-6 text-center">
          {isLoginMode ? 'Ingresa para controlar tus finanzas' : 'Regístrate para empezar'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Correo Electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-sm text-rose-600 text-center">{error}</p>}
          <Button type="submit" variant="primary" className="w-full">{isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'}</Button>
        </form>

        <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-300" /></div><div className="relative flex justify-center text-sm"><span className="bg-white px-2 text-slate-500">O continúa con</span></div></div>

        <div className="flex flex-col gap-4">
          <Button 
            onClick={signInWithGoogle} 
            variant="secondary" 
            className="w-full flex items-center justify-center gap-2"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google icon" className="w-5 h-5" />
            <span>{isLoginMode ? 'Iniciar sesión' : 'Registrarse'} con Google</span>
          </Button>
        </div>

        <div className="mt-6 text-center text-sm">
          <button onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }} className="font-medium text-emerald-600 hover:text-emerald-500">
            {isLoginMode ? '¿No tienes cuenta? Crea una aquí' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};