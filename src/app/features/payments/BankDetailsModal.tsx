import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy, CheckCircle2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentProofUpload } from './PaymentProofUpload';

interface BankInfo {
  accountHolder?: string;
  bank?: string;
  accountType?: string;
  accountNumber?: string;
  rut?: string;
  email?: string;
}

interface BankDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankInfo?: BankInfo;
  appointmentId: string;
  amount: number;
}

export const BankDetailsModal: React.FC<BankDetailsModalProps> = ({
  open,
  onOpenChange,
  bankInfo,
  appointmentId,
  amount,
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  if (!open) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    onOpenChange(false);
    toast.success('Comprobante enviado exitosamente');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {!showUpload ? (
          <>
            {/* Header */}
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Realizar Pago por Transferencia
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Realiza la transferencia a la siguiente cuenta
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Amount */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <Label className="text-sm text-emerald-700">Monto a pagar</Label>
                <p className="text-3xl font-bold text-emerald-600 mt-1">
                  ${amount.toLocaleString('es-CL')}
                </p>
              </div>

              {/* Bank Details */}
              <div className="space-y-4">
                {bankInfo?.bank && (
                  <div>
                    <Label className="text-gray-600">Banco</Label>
                    <div className="flex items-center justify-between mt-1 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 font-medium">{bankInfo.bank}</p>
                      <button
                        onClick={() => copyToClipboard(bankInfo.bank!, 'bank')}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {copied === 'bank' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {bankInfo?.accountType && (
                  <div>
                    <Label className="text-gray-600">Tipo de cuenta</Label>
                    <div className="flex items-center justify-between mt-1 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 font-medium">{bankInfo.accountType}</p>
                    </div>
                  </div>
                )}

                {bankInfo?.accountNumber && (
                  <div>
                    <Label className="text-gray-600">Número de cuenta</Label>
                    <div className="flex items-center justify-between mt-1 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 font-mono font-medium">
                        {bankInfo.accountNumber}
                      </p>
                      <button
                        onClick={() => copyToClipboard(bankInfo.accountNumber!, 'account')}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {copied === 'account' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {bankInfo?.accountHolder && (
                  <div>
                    <Label className="text-gray-600">Titular de la cuenta</Label>
                    <div className="flex items-center justify-between mt-1 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 font-medium">{bankInfo.accountHolder}</p>
                      <button
                        onClick={() => copyToClipboard(bankInfo.accountHolder!, 'holder')}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {copied === 'holder' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {bankInfo?.rut && (
                  <div>
                    <Label className="text-gray-600">RUT</Label>
                    <div className="flex items-center justify-between mt-1 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 font-mono font-medium">{bankInfo.rut}</p>
                      <button
                        onClick={() => copyToClipboard(bankInfo.rut!, 'rut')}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {copied === 'rut' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {bankInfo?.email && (
                  <div>
                    <Label className="text-gray-600">Email</Label>
                    <div className="flex items-center justify-between mt-1 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 font-medium">{bankInfo.email}</p>
                      <button
                        onClick={() => copyToClipboard(bankInfo.email!, 'email')}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {copied === 'email' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Importante:</strong> Después de realizar la transferencia, sube el
                  comprobante para que podamos confirmar tu pago.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t space-y-3">
              <Button
                onClick={() => setShowUpload(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <Upload className="h-4 w-4" />
                Subir Comprobante
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="w-full"
              >
                Cerrar
              </Button>
            </div>
          </>
        ) : (
          <PaymentProofUpload
            appointmentId={appointmentId}
            amount={amount}
            onComplete={handleUploadComplete}
            onCancel={() => setShowUpload(false)}
          />
        )}
      </div>
    </div>
  );
};
