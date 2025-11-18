import { useClients } from '@/app/features/clients/hooks/useClients';
import { usePaymentConfig } from '@/app/features/payments/hooks/usePaymentConfig';
import { Button } from '@/components/ui/button';
import { AlertCircle, CreditCard, UserPlus } from 'lucide-react';
import { useHistory } from 'react-router-dom';

interface SetupRequirementBannerProps {
  onContinue?: () => void;
}

export const SetupRequirementBanner: React.FC<SetupRequirementBannerProps> = ({ onContinue }) => {
  const { clients } = useClients();
  const { config, loading: loadingConfig } = usePaymentConfig();
  const history = useHistory();

  const hasClients = clients.length > 0;
  const hasPaymentConfig = !!config && !!config.pricing && Object.keys(config.pricing).length > 0;

  // If still loading, don't show anything
  if (loadingConfig) return null;

  // If everything is configured, allow to continue
  if (hasClients && hasPaymentConfig) {
    if (onContinue) onContinue();
    return null;
  }

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-lg">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">
            Configuración Requerida
          </h3>
          <p className="text-sm text-amber-700 mb-3">
            Antes de agendar clases, necesitas completar la siguiente configuración:
          </p>
          <div className="space-y-2">
            {!hasClients && (
              <div className="flex items-center justify-between bg-white p-3 rounded-md border border-amber-200">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-gray-700">Agregar al menos un cliente</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => history.push('/clients')}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  Ir a Clientes
                </Button>
              </div>
            )}
            {!hasPaymentConfig && (
              <div className="flex items-center justify-between bg-white p-3 rounded-md border border-amber-200">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-gray-700">
                    Configurar método de pago y precios
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => history.push('/payment-settings')}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  Configurar Pagos
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
