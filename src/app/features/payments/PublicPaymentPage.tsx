import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Payment } from './types';
import { PublicPaymentView } from './PublicPaymentView';

export const PublicPaymentPage = () => {
  const { token } = useParams<{ token: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPayment = async () => {
      if (!token) {
        setError('Token inválido');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Loading payment with token:', token);

        // Search for payment with this token across all tenants
        // First, we need to find which tenant has this payment
        // This is a bit inefficient but necessary for public access
        
        // Get all tenants (we'll need a better solution for scale)
        const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
        
        let foundPayment: Payment | null = null;
        
        for (const tenantDoc of tenantsSnapshot.docs) {
          const paymentsRef = collection(db, 'tenants', tenantDoc.id, 'payments');
          const q = query(paymentsRef, where('paymentToken', '==', token));
          const paymentSnapshot = await getDocs(q);
          
          if (!paymentSnapshot.empty) {
            const paymentDoc = paymentSnapshot.docs[0];
            const data = paymentDoc.data();
            foundPayment = {
              id: paymentDoc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              paidAt: data.paidAt?.toDate() || null,
              reviewedAt: data.reviewedAt?.toDate() || null,
            } as Payment;
            break;
          }
        }

        if (!foundPayment) {
          setError('Pago no encontrado');
          setLoading(false);
          return;
        }

        console.log('✅ Payment found:', foundPayment);
        setPayment(foundPayment);
        setLoading(false);
      } catch (err) {
        console.error('Error loading payment:', err);
        setError('Error al cargar el pago');
        setLoading(false);
      }
    };

    loadPayment();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pago no encontrado</h1>
          <p className="text-gray-600">{error || 'El link de pago no es válido o ha expirado'}</p>
        </div>
      </div>
    );
  }

  return <PublicPaymentView payment={payment} />;
};
