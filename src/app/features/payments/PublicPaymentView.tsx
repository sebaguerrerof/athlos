import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Payment } from './types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy, CheckCircle2, Upload, X } from 'lucide-react';

interface PublicPaymentViewProps {
  payment: Payment;
}

export const PublicPaymentView: React.FC<PublicPaymentViewProps> = ({ payment }) => {
  const [appointment, setAppointment] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load appointment details
        const appointmentDoc = await getDoc(
          doc(db, 'tenants', payment.tenantId, 'appointments', payment.appointmentId)
        );
        if (appointmentDoc.exists()) {
          setAppointment({ id: appointmentDoc.id, ...appointmentDoc.data() });
        }

        // Load payment config
        const configQuery = collection(db, 'tenants', payment.tenantId, 'paymentConfig');
        const configSnapshot = await getDocs(configQuery);
        if (!configSnapshot.empty) {
          setConfig(configSnapshot.docs[0].data());
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [payment]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      alert('Solo se permiten imágenes');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('El archivo no debe superar los 5MB');
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      // Upload to Firebase Storage
      const storageRef = ref(
        storage,
        `paymentProofs/${payment.tenantId}/${payment.appointmentId}_${Date.now()}.${file.name.split('.').pop()}`
      );
      
      await uploadBytes(storageRef, file);
      const proofUrl = await getDownloadURL(storageRef);

      // Update payment record
      await updateDoc(
        doc(db, 'tenants', payment.tenantId, 'payments', payment.id),
        {
          proofUrl,
          proofStatus: 'pending',
          updatedAt: new Date(),
        }
      );

      setUploadComplete(true);
    } catch (error) {
      console.error('Error uploading proof:', error);
      alert('Error al subir el comprobante');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (uploadComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Comprobante Enviado!</h1>
          <p className="text-gray-600 mb-6">
            Tu comprobante ha sido enviado exitosamente. El instructor lo revisará pronto y recibirás una confirmación por email.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              Revisa tu correo electrónico para más información.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">💪 Athlos</h1>
          <p className="text-gray-600">Pago de Clase</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Clase Confirmada</h2>
            <p className="opacity-90">Completa tu pago para asegurar tu cupo</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Class Details */}
            {appointment && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 text-lg">📋 Detalles de la Clase</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deporte:</span>
                    <span className="font-medium text-gray-900">{appointment.sportType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(appointment.date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hora:</span>
                    <span className="font-medium text-gray-900">{appointment.startTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duración:</span>
                    <span className="font-medium text-gray-900">{appointment.duration} min</span>
                  </div>
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-6 text-center">
              <Label className="text-sm text-emerald-700 block mb-2">Monto a pagar</Label>
              <p className="text-4xl font-bold text-emerald-600">
                ${payment.amount.toLocaleString('es-CL')}
              </p>
              <p className="text-sm text-emerald-700 mt-1">CLP</p>
            </div>

            {/* Bank Details */}
            {config?.provider === 'manual' && config?.bankInfo && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 text-lg">🏦 Datos de Transferencia</h3>
                
                {config.bankInfo.bank && (
                  <div>
                    <Label className="text-gray-600 text-sm">Banco</Label>
                    <div className="flex items-center justify-between mt-1 p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900 font-medium">{config.bankInfo.bank}</p>
                      <button
                        onClick={() => copyToClipboard(config.bankInfo.bank, 'bank')}
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

                {config.bankInfo.accountNumber && (
                  <div>
                    <Label className="text-gray-600 text-sm">Número de Cuenta</Label>
                    <div className="flex items-center justify-between mt-1 p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900 font-mono font-medium">
                        {config.bankInfo.accountNumber}
                      </p>
                      <button
                        onClick={() => copyToClipboard(config.bankInfo.accountNumber, 'account')}
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

                {config.bankInfo.name && (
                  <div>
                    <Label className="text-gray-600 text-sm">Titular</Label>
                    <div className="flex items-center justify-between mt-1 p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900 font-medium">{config.bankInfo.name}</p>
                      <button
                        onClick={() => copyToClipboard(config.bankInfo.name, 'holder')}
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

                {config.bankInfo.rut && (
                  <div>
                    <Label className="text-gray-600 text-sm">RUT</Label>
                    <div className="flex items-center justify-between mt-1 p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900 font-mono font-medium">{config.bankInfo.rut}</p>
                      <button
                        onClick={() => copyToClipboard(config.bankInfo.rut, 'rut')}
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
              </div>
            )}

            {/* Upload Section */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 text-lg mb-4">📤 Subir Comprobante</h3>
              
              {!file ? (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click para subir</span> o arrastra una imagen
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG o JPEG (máx. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={preview!}
                    alt="Preview"
                    className="w-full h-64 object-contain bg-gray-100 rounded-lg border-2"
                  />
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-900 font-medium">{file.name}</p>
                    <p className="text-xs text-blue-700">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
              )}

              {file && (
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-lg"
                >
                  {uploading ? 'Enviando...' : 'Enviar Comprobante'}
                </Button>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>📧 Importante:</strong> Después de subir tu comprobante, el instructor lo revisará y recibirás una confirmación por email.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 text-sm">
          <p>© {new Date().getFullYear()} Athlos. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};
