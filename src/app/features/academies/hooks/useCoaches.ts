import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';

export interface Coach {
  id: string;
  name: string;
  email: string;
}

export const useCoaches = () => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, tenant } = useAuth();

  useEffect(() => {
    // Por ahora, retornamos el usuario actual como único coach disponible
    // En el futuro, esto se puede expandir para obtener una lista de coaches desde Firestore
    if (user && tenant) {
      setCoaches([
        {
          id: user.uid,
          name: tenant.name || user.email || 'Coach',
          email: user.email || '',
        },
      ]);
    }
    setLoading(false);
  }, [user, tenant]);

  return {
    coaches,
    loading,
  };
};
