import React, { useState, useEffect } from 'react';
import { Menu, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext';
import { db } from './firebase';
import { doc, getDoc, onSnapshot, collection, addDoc, updateDoc, deleteDoc, writeBatch, query, orderBy, getDocs } from 'firebase/firestore';
import { Sidebar } from './components/Sidebar';
import { SummaryView } from './views/SummaryView';
import { SavingsView } from './views/SavingsView';
import { CardsView } from './views/CardsView';
import { ReportsView } from './views/ReportsView';
import { ConfigView } from './views/ConfigView';
import { LoginView } from './views/LoginView';
import { Modal, Button, Input } from './components/UI';
import { Transaction, UserData, Categories, CardData, WishlistItem, Acquisition, PaidMonths } from './types';

// Default Data for new users
const defaultCategories = {
  ingreso: ['Salario', 'Ventas', 'Freelance'],
  gasto: ['Alimentación', 'Transporte', 'Servicios', 'Ocio', 'Salud', 'Educación', 'Pago Tarjeta']
};
const defaultCards = [
  { name: 'Visa Principal', limit: 1000000 },
  { name: 'Mastercard', limit: 500000 }
];

// Helper to generate seed data for new users
const generateSeedTransactions = (): Omit<Transaction, 'id'>[] => {
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
    { type: 'ingreso', category: 'Salario', description: 'Sueldo Mensual', amount: 1500000, date: fmtDate(year, month, 1) },
    { type: 'ingreso', category: 'Freelance', description: 'Proyecto Web E-commerce', amount: 450000, date: fmtDate(year, month - 1, 15) },
    { type: 'ingreso', category: 'Ventas', description: 'Venta Consola', amount: 120000, date: fmtDate(year, month, 10) },
    { type: 'ingreso', category: 'Salario', description: 'Bono Trimestral', amount: 300000, date: fmtDate(year, month - 2, 1) },

    // --- GASTOS (Efectivo/Débito) ---
    // Alimentación
    { type: 'gasto', category: 'Alimentación', description: 'Supermercado Lider', amount: 85000, date: fmtDate(year, month, 5) },
    { type: 'gasto', category: 'Alimentación', description: 'Feria Verduras Semanal', amount: 25000, date: fmtDate(year, month, 12) },
    { type: 'gasto', category: 'Alimentación', description: 'Cena Restaurante Italiano', amount: 45000, date: fmtDate(year, month, 20) },
    
    // Servicios
    { type: 'gasto', category: 'Servicios', description: 'Internet Fibra', amount: 25990, date: fmtDate(year, month, 10) },
    { type: 'gasto', category: 'Servicios', description: 'Cuenta de Luz', amount: 35000, date: fmtDate(year, month, 15) },
    { type: 'gasto', category: 'Servicios', description: 'Plan Celular', amount: 19990, date: fmtDate(year, month, 2) },

    // Transporte
    { type: 'gasto', category: 'Transporte', description: 'Carga Bip!', amount: 15000, date: fmtDate(year, month, 3) },
    { type: 'gasto', category: 'Transporte', description: 'Uber al Aeropuerto', amount: 22000, date: fmtDate(year, month, 25) },

    // Ocio
    { type: 'gasto', category: 'Ocio', description: 'Entradas Cine IMAX', amount: 18000, date: fmtDate(year, month, 8) },
    { type: 'gasto', category: 'Ocio', description: 'Juego Nintendo Switch', amount: 45000, date: fmtDate(year, month - 1, 20) },

    // Salud
    { type: 'gasto', category: 'Salud', description: 'Farmacia Remedios', amount: 12500, date: fmtDate(year, month, 18) },
    { type: 'gasto', category: 'Salud', description: 'Consulta Dental', amount: 50000, date: fmtDate(year, month - 1, 5) },

    // Educación
    { type: 'gasto', category: 'Educación', description: 'Curso Online Inglés', amount: 75000, date: fmtDate(year, month - 1, 10) },

    // --- TARJETAS DE CRÉDITO ---
    // Visa Principal (Compras grandes/Cuotas)
    { type: 'gasto', category: 'Visa Principal', description: 'TV Smart 55" Samsung', amount: 329990, date: fmtDate(year, month - 1, 10), installments: 3, firstPaymentDate: fmtDate(year, month, 5) },
    { type: 'gasto', category: 'Visa Principal', description: 'Pasajes Vacaciones Sur', amount: 450000, date: fmtDate(year, month - 2, 15), installments: 6, firstPaymentDate: fmtDate(year, month - 1, 5) },
    { type: 'gasto', category: 'Visa Principal', description: 'Ropa Temporada Falabella', amount: 120000, date: fmtDate(year, month, 2), installments: 3, firstPaymentDate: fmtDate(year, month + 1, 5) },
    { type: 'gasto', category: 'Visa Principal', description: 'Notebook Trabajo', amount: 890000, date: fmtDate(year, month - 3, 20), installments: 12, firstPaymentDate: fmtDate(year, month - 2, 5) },

    // Mastercard (Suscripciones y gastos menores)
    { type: 'gasto', category: 'Mastercard', description: 'Netflix Premium', amount: 10790, date: fmtDate(year, month, 15), installments: 1, firstPaymentDate: fmtDate(year, month, 15) },
    { type: 'gasto', category: 'Mastercard', description: 'Spotify Duo', amount: 9500, date: fmtDate(year, month, 20), installments: 1, firstPaymentDate: fmtDate(year, month, 20) },
    { type: 'gasto', category: 'Mastercard', description: 'Uber Eats Cena', amount: 28500, date: fmtDate(year, month, 12), installments: 1, firstPaymentDate: fmtDate(year, month + 1, 5) },
    { type: 'gasto', category: 'Mastercard', description: 'Suscripción Gym', amount: 35000, date: fmtDate(year, month, 1), installments: 1, firstPaymentDate: fmtDate(year, month, 1) },

    // --- AHORROS ---
    { type: 'ahorro', category: 'Ahorro General', description: 'Ahorro Mes Actual', amount: 150000, date: fmtDate(year, month, 28) },
    { type: 'ahorro', category: 'Ahorro General', description: 'Ahorro Mes Pasado', amount: 120000, date: fmtDate(year, month - 1, 28) },
    { type: 'ahorro', category: 'Ahorro General', description: 'Ahorro hace 2 meses', amount: 100000, date: fmtDate(year, month - 2, 28) },
    { type: 'ahorro', category: 'Ahorro General', description: 'Ahorro hace 3 meses', amount: 90000, date: fmtDate(year, month - 3, 28) },
    { type: 'ahorro', category: 'Ahorro General', description: 'Bono Navidad Ahorrado', amount: 200000, date: fmtDate(year, month - 4, 25) },
  ] as Omit<Transaction, 'id'>[];
};

const generateSeedWishlist = (): Omit<WishlistItem, 'id'>[] => [
  { name: 'PlayStation 5', link: '', price: 549990 },
  { name: 'Viaje a Brasil', link: '', price: 850000 },
  { name: 'iPhone 15', link: '', price: 949990 },
  { name: 'Bicicleta Trek', link: '', price: 380000 },
  { name: 'Silla Gamer', link: '', price: 189990 },
] as Omit<WishlistItem, 'id'>[];

export default function App() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('resumen');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [isDeletingAcquisition, setIsDeletingAcquisition] = useState(false);
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({ description: '', amount: '', date: '' });

  // App State - now loaded from Firestore
  const [userData, setUserData] = useState<UserData>({ name: '', phone: '', email: '', countryCode: '+56' });
  const [categories, setCategories] = useState<Categories>(defaultCategories);
  const [cards, setCards] = useState<CardData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [acquisitions, setAcquisitions] = useState<Acquisition[]>([]);
  const [paidMonths, setPaidMonths] = useState<PaidMonths>({});

  // Data loading and synchronization with Firestore
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      // Clear data on logout
      setUserData({ name: '', phone: '', email: '', countryCode: '+56' });
      setTransactions([]);
      setCards([]);
      setWishlist([]);
      setAcquisitions([]);
      return;
    }

    // This will hold all the unsubscribe functions for our listeners
    const unsubscribes: (() => void)[] = [];

    setIsLoading(true);
    const userDocRef = doc(db, 'users', user.uid);

    const setupListeners = () => {
      // Listener for user document (userData, categories, paidMonths)
      unsubscribes.push(onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({ name: data.name, email: data.email, phone: data.phone, countryCode: data.countryCode });
          setCategories(data.categories || defaultCategories);
          setPaidMonths(data.paidMonths || {});
        }
      }));

      // Listeners for sub-collections
      const collectionsToSync: { [key: string]: any } = {
        transactions: { setter: setTransactions, orderByField: 'date' },
        acquisitions: { setter: setAcquisitions, orderByField: 'date' },
        cards: { setter: setCards, orderByField: 'name' },
        wishlist: { setter: setWishlist, orderByField: 'price' },
      };

      Object.entries(collectionsToSync).forEach(([collectionName, config]) => {
        const collQuery = query(collection(db, `users/${user.uid}/${collectionName}`), orderBy(config.orderByField, 'desc'));
        unsubscribes.push(onSnapshot(collQuery, (snapshot) => {
          const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
          config.setter(items);
        }, (error) => console.error(`Error listening to ${collectionName}:`, error)));
      });
      
      setIsLoading(false);
    };

    getDoc(userDocRef).then(docSnap => {
      if (!docSnap.exists()) {
        // New user: create document with seed data
        console.log("New user detected. Creating seed data...");
        const batch = writeBatch(db);

        // 1. Set main user document
        batch.set(userDocRef, {
          name: user.displayName || 'Usuario',
          email: user.email || '',
          phone: '',
          countryCode: '+56',
          categories: defaultCategories,
          paidMonths: {},
        });

        // 2. Add transactions to sub-collection
        generateSeedTransactions().forEach(t => {
          const transDocRef = doc(collection(db, `users/${user.uid}/transactions`));
          batch.set(transDocRef, t);
        });

        // 3. Add cards to sub-collection
        defaultCards.forEach(c => {
          const cardDocRef = doc(collection(db, `users/${user.uid}/cards`));
          batch.set(cardDocRef, c);
        });

        // 4. Add wishlist to sub-collection
        generateSeedWishlist().forEach(w => {
          const wishDocRef = doc(collection(db, `users/${user.uid}/wishlist`));
          batch.set(wishDocRef, w);
        });

        // Commit the batch
        batch.commit().then(() => {
          console.log('Seed data created successfully!');
          setupListeners();
        }).catch(error => {
          console.error("Error creating seed data:", error);
          setIsLoading(false);
        });

      } else {
        // Existing user, just set up listeners
        setupListeners();
      }
    }).catch(error => {
      console.error("Error checking for user document:", error);
      setIsLoading(false);
    });

    // The cleanup function for useEffect. It will be called when the component
    // unmounts or when the `user` dependency changes (e.g., on logout).
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user]);

  // Actions
  const handleSignOut = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        signOut();
    }
  };

  const handleFullReset = async () => {
    if (!user) return;
    if (window.prompt('Esta acción es irreversible y borrará TODOS tus datos. Escribe "BORRAR" para confirmar.') !== 'BORRAR') {
        return;
    }

    setIsLoading(true);
    console.log("Iniciando reseteo completo de datos para el usuario:", user.uid);

    try {
        const userDocRef = doc(db, 'users', user.uid);
        const subCollections = ['transactions', 'cards', 'wishlist', 'acquisitions'];

        // Borrar todos los documentos en todas las sub-colecciones
        for (const sub of subCollections) {
            const subCollectionRef = collection(db, `users/${user.uid}/${sub}`);
            const snapshot = await getDocs(subCollectionRef);
            const batch = writeBatch(db);
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            console.log(`Sub-colección '${sub}' eliminada.`);
        }

        // Borrar el documento principal del usuario
        await deleteDoc(userDocRef);
        console.log("Documento principal del usuario eliminado.");

        // Finalmente, cerrar la sesión del usuario
        await signOut();

    } catch (error) {
        console.error("Error durante el reseteo completo:", error);
        alert("Ocurrió un error al resetear los datos. Por favor, inténtalo de nuevo.");
        setIsLoading(false);
    }
  };

  const updateUserData = async (newUserData: Partial<UserData>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      // Actualiza solo los campos proporcionados en la base de datos
      await updateDoc(userDocRef, newUserData);
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };

  const updateCategories = async (newCategories: Categories) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userDocRef, { categories: newCategories });
    } catch (error) {
      console.error("Error updating categories:", error);
    }
  };

  const updatePaidMonths = async (newPaidMonths: PaidMonths) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userDocRef, { paidMonths: newPaidMonths });
    } catch (error) {
      console.error("Error updating paid months:", error);
    }
  };

  const addWishlistItem = async (item: Omit<WishlistItem, 'id'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/wishlist`), item);
    } catch (error) {
      console.error("Error adding wishlist item:", error);
    }
  };

  const addAcquisition = async (item: Omit<Acquisition, 'id'>) => {
    if (!user) return;
    try {
      // Asumimos que también quieres guardar las adquisiciones en una colección
      // Si no, puedes ajustar esta lógica.
      await addDoc(collection(db, `users/${user.uid}/acquisitions`), item);
    } catch (error) {
      console.error("Error adding acquisition:", error);
    }
  };

  const deleteWishlistItem = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/wishlist`, id));
    } catch (error) {
      console.error("Error deleting wishlist item:", error);
    }
  };

  const deleteAcquisition = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/acquisitions`, id));
    } catch (error) {
      console.error("Error deleting acquisition:", error);
    }
  };

  const addCard = async (card: Omit<CardData, 'id'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/cards`), card);
    } catch (error) {
      console.error("Error adding card:", error);
    }
  };

  const deleteCard = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/cards`, id));
    } catch (error) {
      console.error("Error deleting card:", error);
    }
  };

  // --- Firestore CRUD Functions ---
  const addTransaction = async (newTransData: Omit<Transaction, 'id'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/transactions`), newTransData);
      console.log("¡Transacción agregada con éxito!"); // Mensaje de éxito
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Hubo un error al agregar la transacción. Revisa la consola para más detalles.");
    }
  };

  const promptDelete = (id: string, isAcquisition = false) => {
    setTransactionToDelete(id);
    setIsDeletingAcquisition(isAcquisition);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (transactionToDelete && user) {
      const collectionName = isDeletingAcquisition ? 'acquisitions' : 'transactions';
      try {
        await deleteDoc(doc(db, `users/${user.uid}/${collectionName}`, transactionToDelete));
      } catch (error) {
        console.error("Error deleting document:", error);
      }
      setTransactionToDelete(null);
      setDeleteModalOpen(false);
    }
  };

  const saveEdit = async () => {
    if (!transactionToEdit || !user) return;
    try {
      const docRef = doc(db, `users/${user.uid}/transactions`, transactionToEdit.id);
      await updateDoc(docRef, {
        description: editForm.description,
        amount: parseFloat(editForm.amount),
        date: editForm.date
      });
    } catch (error) {
      console.error("Error updating transaction:", error);
    } finally {
      setEditModalOpen(false);
      setTransactionToEdit(null);
    }
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
          addWishlistItem={addWishlistItem}
          deleteWishlistItem={deleteWishlistItem}
          acquisitions={acquisitions}
          addAcquisition={addAcquisition}
          deleteAcquisition={deleteAcquisition}
        />;
      case 'tarjetas':
        return <CardsView 
          cards={cards} 
          transactions={transactions} 
          paidMonths={paidMonths} 
          updatePaidMonths={updatePaidMonths}
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
          updateUserData={updateUserData}
          categories={categories}
          updateCategories={updateCategories}
          cards={cards} 
          addCard={addCard}
          deleteCard={deleteCard}
          handleSignOut={handleSignOut}
          handleFullReset={handleFullReset}
        />;
      default:
        return null;
    }
  };

  // Si no hay usuario, mostrar la pantalla de login
  if (!user) {
    return <LoginView />;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-100 text-slate-600">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="text-lg">Cargando tus datos...</p>
      </div>
    );
  }

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