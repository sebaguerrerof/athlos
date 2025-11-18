import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import { BankDetailsModal } from './BankDetailsModal';
import { usePaymentConfig } from './hooks/usePaymentConfig';
import { toast } from 'sonner';

interface PaymentButtonProps {
  appointmentId: string;
  amount: number;
  disabled?: boolean;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  appointmentId,
  amount,
  disabled = false,
}) => {
  const [showBankModal, setShowBankModal] = useState(false);
  const { config, loading } = usePaymentConfig();

  const handlePayment = () => {
    if (!config) {
      toast.error('Configuración de pagos no disponible');
      return;
    }

    if (config.provider === 'manual') {
      // Show bank details for manual transfer
      setShowBankModal(true);
    } else if (config.provider === 'mercadopago') {
      // Generate Mercado Pago link (will be implemented in Day 4)
      toast.info('Funcionalidad de Mercado Pago próximamente');
    }
  };

  return (
    <>
      <Button
        onClick={handlePayment}
        disabled={disabled || loading || !config}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
      >
        <CreditCard className="h-4 w-4" />
        Realizar Pago ${amount.toLocaleString('es-CL')}
      </Button>

      {config?.provider === 'manual' && (
        <BankDetailsModal
          open={showBankModal}
          onOpenChange={setShowBankModal}
          bankInfo={config.bankInfo}
          appointmentId={appointmentId}
          amount={amount}
        />
      )}
    </>
  );
};
