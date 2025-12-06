import React, { useState, useEffect } from 'react';
import { Menu, AlertCircle } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { SummaryView } from './views/SummaryView';
import { SavingsView } from './views/SavingsView';
import { CardsView } from './views/CardsView';
import { ReportsView } from './views/ReportsView';
import { ConfigView } from './views/ConfigView';
import { Modal, Button, Input } from './components/UI';
import { Transaction, UserData, Categories, CardData, WishlistItem, Acquisition, PaidMonths } from './types';

// Default Data
const defaultCategories = {
  ingreso: ['Salario', 'Ventas', 'Freelance'],
  gasto: ['Alimentación', 'Transporte', 'Servicios', 'Ocio', 'Salud', 'Educación', 'Pago Tarjeta']
};
const defaultCards = [
  { id: 1, name: 'Visa Principal', limit: 1000000 },
  { id: 2, name: 'Mastercard', limit: 500000 }
];

// Helper to generate seed data
const generateSeedTransactions = (): Transaction[] => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed

  // Helper to format date YYYY-MM-DD
  const fmtDate = (y: number, m: number, d: number) => {
    // Handle month wrap-around for past years
    const date = new Date(y, m, d);
    return date.toISOString().split('T')[0];
  };

  return [
    // --- INGRESOS ---
    { id: 1, type: 'ingreso', category: 'Salario', description: 'Sueldo Mensual', amount: 1500000, date: fmtDate(year, month, 1) },
    { id: 2, type: 'ingreso', category: 'Freelance', description: 'Proyecto Web E-commerce', amount: 450000, date: fmtDate(year, month - 1, 15) },
    { id: 3, type: 'ingreso', category: 'Ventas', description: 'Venta Consola Antigua', amount: 120000, date: fmtDate(year, month, 10) },
    { id: 4, type: 'ingreso', category: 'Salario', description: 'Bono Trimestral', amount: 300000, date: fmtDate(year, month - 2, 1) },

    // --- GASTOS (Efectivo/Débito) ---
    // Alimentación
    { id: 10, type: 'gasto', category: 'Alimentación', description: 'Supermercado Lider', amount: 85000, date: fmtDate(year, month, 5) },
    { id: 11, type: 'gasto', category: 'Alimentación', description: 'Feria Verduras Semanal', amount: 25000, date: fmtDate(year, month, 12) },
    { id: 12, type: 'gasto', category: 'Alimentación', description: 'Cena Restaurante Italiano', amount: 45000, date: fmtDate(year, month, 20) },
    
    // Servicios
    { id: 13, type: 'gasto', category: 'Servicios', description: 'Internet Fibra', amount: 25990, date: fmtDate(year, month, 10) },
    { id: 14, type: 'gasto', category: 'Servicios', description: 'Cuenta de Luz', amount: 35000, date: fmtDate(year, month, 15) },
    { id: 15, type: 'gasto', category: 'Servicios', description: 'Plan Celular', amount: 19990, date: fmtDate(year, month, 2) },

    // Transporte
    { id: 16, type: 'gasto', category: 'Transporte', description: 'Carga Bip!', amount: 15000, date: fmtDate(year, month, 3) },
    { id: 17, type: 'gasto', category: 'Transporte', description: 'Uber al Aeropuerto', amount: 22000, date: fmtDate(year, month, 25) },

    // Ocio
    { id: 18, type: 'gasto', category: 'Ocio', description: 'Entradas Cine IMAX', amount: 18000, date: fmtDate(year, month, 8) },
    { id: 19, type: 'gasto', category: 'Ocio', description: 'Juego Nintendo Switch', amount: 45000, date: fmtDate(year, month - 1, 20) },

    // Salud
    { id: 20, type: 'gasto', category: 'Salud', description: 'Farmacia Remedios', amount: 12500, date: fmtDate(year, month, 18) },
    { id: 21, type: 'gasto', category: 'Salud', description: 'Consulta Dental', amount: 50000, date: fmtDate(year, month - 1, 5) },

    // Educación
    { id: 22, type: 'gasto', category: 'Educación', description: 'Curso Online Inglés', amount: 75000, date: fmtDate(year, month - 1, 10) },

    // --- TARJETAS DE CRÉDITO ---
    // Visa Principal (Compras grandes/Cuotas)
    { id: 30, type: 'gasto', category: 'Visa Principal', description: 'TV Smart 55" Samsung', amount: 329990, date: fmtDate(year, month - 1, 10), installments: 3, firstPaymentDate: fmtDate(year, month, 5) },
    { id: 31, type: 'gasto', category: 'Visa Principal', description: 'Pasajes Vacaciones Sur', amount: 450000, date: fmtDate(year, month - 2, 15), installments: 6, firstPaymentDate: fmtDate(year, month - 1, 5) },
    { id: 32, type: 'gasto', category: 'Visa Principal', description: 'Ropa Temporada Falabella', amount: 120000, date: fmtDate(year, month, 2), installments: 3, firstPaymentDate: fmtDate(year, month + 1, 5) },
    { id: 33, type: 'gasto', category: 'Visa Principal', description: 'Notebook Trabajo', amount: 890000, date: fmtDate(year, month - 3, 20), installments: 12, firstPaymentDate: fmtDate(year, month - 2, 5) },

    // Mastercard (Suscripciones y gastos menores)
    { id: 40, type: 'gasto', category: 'Mastercard', description: 'Netflix Premium', amount: 10790, date: fmtDate(year, month, 15), installments: 1, firstPaymentDate: fmtDate(year, month, 15) },
    { id: 41, type: 'gasto', category: 'Mastercard', description: 'Spotify Duo', amount: 9500, date: fmtDate(year, month, 20), installments: 1, firstPaymentDate: fmtDate(year, month, 20) },
    { id: 42, type: 'gasto', category: 'Mastercard', description: 'Uber Eats Cena', amount: 28500, date: fmtDate(year, month, 12), installments: 1, firstPaymentDate: fmtDate(year, month + 1, 5) },
    { id: 43, type: 'gasto', category: 'Mastercard', description: 'Suscripción Gym', amount: 35000, date: fmtDate(year, month, 1), installments: 1, firstPaymentDate: fmtDate(year, month, 1) },

    // --- AHORROS ---
    { id: 50, type: 'ahorro', category: 'Ahorro General', description: 'Ahorro Mes Actual', amount: 150000, date: fmtDate(year, month, 28) },
    { id: 51, type: 'ahorro', category: 'Ahorro General', description: 'Ahorro Mes Pasado', amount: 120000, date: fmtDate(year, month - 1, 28) },
    { id: 52, type: 'ahorro', category: 'Ahorro General', description: 'Ahorro hace 2 meses', amount: 100000, date: fmtDate(year, month - 2, 28) },
    { id: 53, type: 'ahorro', category: 'Ahorro General', description: 'Ahorro hace 3 meses', amount: 90000, date: fmtDate(year, month - 3, 28) },
    { id: 54, type: 'ahorro', category: 'Ahorro General', description: 'Bono Navidad Ahorrado', amount: 200000, date: fmtDate(year, month - 4, 25) },
  ];
};

const generateSeedWishlist = (): WishlistItem[] => [
  { id: 101, name: 'PlayStation 5', link: '', price: 549990 },
  { id: 102, name: 'Viaje a Brasil', link: '', price: 850000 },
  { id: 103, name: 'iPhone 15', link: '', price: 949990 },
  { id: 104, name: 'Bicicleta Trek', link: '', price: 380000 },
  { id: 105, name: 'Silla Gamer', link: '', price: 189990 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('resumen');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null);
  const [isDeletingAcquisition, setIsDeletingAcquisition] = useState(false);
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({ description: '', amount: '', date: '' });

  // Persistent State
  const [userData, setUserData] = useState<UserData>(() => {
    const s = localStorage.getItem('gf_userData');
    const p = s ? JSON.parse(s) : { name: 'Usuario', phone: '', email: '' };
    if (!p.countryCode) p.countryCode = '+56';
    return p;
  });

  const [categories, setCategories] = useState<Categories>(() => 
    JSON.parse(localStorage.getItem('gf_categories') || JSON.stringify(defaultCategories))
  );

  const [cards, setCards] = useState<CardData[]>(() => 
    JSON.parse(localStorage.getItem('gf_cards') || JSON.stringify(defaultCards))
  );

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('gf_transactions');
    return saved ? JSON.parse(saved) : generateSeedTransactions();
  });

  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    const saved = localStorage.getItem('gf_wishlist');
    return saved ? JSON.parse(saved) : generateSeedWishlist();
  });

  const [acquisitions, setAcquisitions] = useState<Acquisition[]>(() => 
    JSON.parse(localStorage.getItem('gf_acquisitions') || '[]')
  );

  const [paidMonths, setPaidMonths] = useState<PaidMonths>(() => 
    JSON.parse(localStorage.getItem('gf_paid_months') || '{}')
  );

  // Persistence Effects
  useEffect(() => localStorage.setItem('gf_userData', JSON.stringify(userData)), [userData]);
  useEffect(() => localStorage.setItem('gf_categories', JSON.stringify(categories)), [categories]);
  useEffect(() => localStorage.setItem('gf_cards', JSON.stringify(cards)), [cards]);
  useEffect(() => localStorage.setItem('gf_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('gf_wishlist', JSON.stringify(wishlist)), [wishlist]);
  useEffect(() => localStorage.setItem('gf_acquisitions', JSON.stringify(acquisitions)), [acquisitions]);
  useEffect(() => localStorage.setItem('gf_paid_months', JSON.stringify(paidMonths)), [paidMonths]);

  // Actions
  const handleResetApp = () => {
    if (window.confirm('¿Cerrar sesión y borrar los datos locales?')) {
        localStorage.clear();
        window.location.reload();
    }
  };

  const addTransaction = (newTrans: Transaction) => setTransactions([newTrans, ...transactions]);

  const promptDelete = (id: number, isAcquisition = false) => {
    setTransactionToDelete(id);
    setIsDeletingAcquisition(isAcquisition);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      if (isDeletingAcquisition) {
        setAcquisitions(acquisitions.filter(a => a.id !== transactionToDelete));
      } else {
        setTransactions(transactions.filter(t => t.id !== transactionToDelete));
      }
      setTransactionToDelete(null);
      setDeleteModalOpen(false);
    }
  };

  const saveEdit = () => {
    if (!transactionToEdit) return;
    setTransactions(transactions.map(t => 
      t.id === transactionToEdit.id 
        ? { ...t, description: editForm.description, amount: parseFloat(editForm.amount), date: editForm.date } 
        : t
    ));
    setEditModalOpen(false);
    setTransactionToEdit(null);
  };

  const summary = transactions.reduce((acc, curr) => {
    const amount = curr.amount;
    if (curr.type === 'ingreso') acc.ingresos += amount;
    if (curr.type === 'gasto') acc.egresos += amount;
    if (curr.type === 'ahorro') acc.ahorros += amount;
    return acc;
  }, { ingresos: 0, egresos: 0, ahorros: 0 });

  const totalBalance = summary.ingresos - summary.egresos - summary.ahorros;

  const renderContent = () => {
    switch (activeTab) {
      case 'resumen':
        return <SummaryView 
          transactions={transactions} 
          addTransaction={addTransaction} 
          categories={categories} 
          cards={cards} 
          totalBalance={totalBalance} 
          summary={summary} 
          promptDelete={(id) => promptDelete(id, false)}
          paidMonths={paidMonths}
        />;
      case 'ahorros':
        return <SavingsView 
          transactions={transactions} 
          wishlist={wishlist} 
          setWishlist={setWishlist} 
          acquisitions={acquisitions} 
          setAcquisitions={setAcquisitions} 
        />;
      case 'tarjetas':
        return <CardsView 
          cards={cards} 
          transactions={transactions} 
          paidMonths={paidMonths} 
          setPaidMonths={setPaidMonths} 
          setActiveTab={setActiveTab} 
        />;
      case 'reporte':
        return <ReportsView 
          transactions={transactions} 
          cards={cards} 
          userData={userData} 
          paidMonths={paidMonths}
        />;
      case 'configuracion':
        return <ConfigView 
          userData={userData} 
          setUserData={setUserData} 
          categories={categories} 
          setCategories={setCategories} 
          cards={cards} 
          setCards={setCards} 
          handleResetApp={handleResetApp} 
        />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden print:overflow-visible print:h-auto">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 z-40 flex items-center px-4 shadow-md print:hidden">
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-white mr-4">
          <Menu />
        </button>
        <span className="text-white font-bold text-lg">Finanzas App</span>
      </div>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); }} 
        isMobileMenuOpen={isMobileMenuOpen} 
        userData={userData} 
      />

      {/* Main Content Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <main className="flex-1 overflow-auto w-full pt-16 md:pt-0 print:overflow-visible print:h-auto print:static">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 capitalize">
              {activeTab === 'configuracion' ? 'Configuración' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <p className="text-slate-500">
              {activeTab === 'resumen' && 'Bienvenido de vuelta, aquí está tu estado financiero.'}
              {activeTab === 'ahorros' && 'Gestiona tus metas y fondo de ahorro.'}
              {activeTab === 'tarjetas' && 'Controla tus cupos de crédito y pagos.'}
              {activeTab === 'reporte' && 'Visualiza en qué estás gastando tu dinero.'}
              {activeTab === 'configuracion' && 'Personaliza tu experiencia.'}
            </p>
          </header>
          {renderContent()}
        </div>
      </main>

      {/* Delete Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Eliminar Registro">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 mb-4">
            <AlertCircle className="h-6 w-6 text-rose-600" />
          </div>
          <p className="text-slate-600 mb-6">¿Estás seguro de que deseas eliminar este elemento?</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setDeleteModalOpen(false)} variant="secondary">Cancelar</Button>
            <Button onClick={confirmDelete} variant="danger">Sí, Eliminar</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Transacción">
        <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }}>
          <Input 
            label="Descripción" 
            value={editForm.description} 
            onChange={e => setEditForm({ ...editForm, description: e.target.value })} 
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Monto" 
              type="number" 
              value={editForm.amount} 
              onChange={e => setEditForm({ ...editForm, amount: e.target.value })} 
            />
            <Input 
              label="Fecha" 
              type="date" 
              value={editForm.date} 
              onChange={e => setEditForm({ ...editForm, date: e.target.value })} 
            />
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <Button onClick={() => setEditModalOpen(false)} variant="secondary">Cancelar</Button>
            <Button type="submit" variant="primary">Guardar Cambios</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}