import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '../../auth/AuthContext';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  status: 'active' | 'invited' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenant, user } = useAuth();

  useEffect(() => {
    if (!tenant?.id) {
      setClients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Firestore path: tenants/{tenantId}/clients
    const clientsRef = collection(db, 'tenants', tenant.id, 'clients');
    const q = query(clientsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const clientsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            notes: data.notes,
            status: data.status || 'active',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Client;
        });
        setClients(clientsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching clients:', err);
        setError('Error al cargar clientes');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenant?.id]);

  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    if (!tenant?.id) throw new Error('No tenant ID');

    // Validar que el correo del cliente no sea el mismo que el del tenant
    if (user?.email && clientData.email.toLowerCase() === user.email.toLowerCase()) {
      throw new Error('NO_PUEDE_CREAR_CLIENTE_CON_SU_PROPIO_EMAIL');
    }

    const clientsRef = collection(db, 'tenants', tenant.id, 'clients');
    const now = Timestamp.now();

    const newClient = {
      ...clientData,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(clientsRef, newClient);
    return docRef.id;
  };

  const updateClient = async (clientId: string, updates: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>) => {
    if (!tenant?.id) throw new Error('No tenant ID');

    // Validar que si se está actualizando el email, no sea el mismo que el del tenant
    if (updates.email && user?.email && updates.email.toLowerCase() === user.email.toLowerCase()) {
      throw new Error('NO_PUEDE_ACTUALIZAR_CLIENTE_CON_SU_PROPIO_EMAIL');
    }

    const { doc, updateDoc } = await import('firebase/firestore');
    const clientRef = doc(db, 'tenants', tenant.id, 'clients', clientId);
    
    await updateDoc(clientRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  };

  const deleteClient = async (clientId: string) => {
    if (!tenant?.id) throw new Error('No tenant ID');

    const { doc, deleteDoc } = await import('firebase/firestore');
    const clientRef = doc(db, 'tenants', tenant.id, 'clients', clientId);
    
    await deleteDoc(clientRef);
  };

  return {
    clients,
    loading,
    error,
    addClient,
    updateClient,
    deleteClient,
  };
};
