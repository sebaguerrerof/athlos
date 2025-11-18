import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, CheckCircle2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useAuth } from '@/app/features/auth/AuthContext';
import { usePayments } from './hooks/usePayments';
import { toast } from 'sonner';

interface PaymentProofUploadProps {
  appointmentId: string;
  amount: number;
  onComplete: () => void;
  onCancel: () => void;
}

export const PaymentProofUpload: React.FC<PaymentProofUploadProps> = ({
  appointmentId,
  amount,
  onComplete,
  onCancel,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { tenant } = useAuth();
  const { addPayment } = usePayments();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('El archivo no debe superar los 5MB');
      return;
    }

    setFile(selectedFile);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !tenant) return;

    setUploading(true);
    try {
      // Upload to Firebase Storage
      const storageRef = ref(
        storage,
        `paymentProofs/${tenant.id}/${appointmentId}_${Date.now()}.${file.name.split('.').pop()}`
      );
      
      await uploadBytes(storageRef, file);
      const proofUrl = await getDownloadURL(storageRef);

      // Create payment record
      await addPayment({
        appointmentId,
        amount,
        method: 'transfer',
        proofUrl,
        proofStatus: 'pending',
      });

      toast.success('Comprobante enviado exitosamente');
      onComplete();
    } catch (error) {
      console.error('Error uploading proof:', error);
      toast.error('Error al subir el comprobante');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <>
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">Subir Comprobante</h2>
        <p className="text-sm text-gray-600 mt-1">
          Sube una foto o captura de pantalla de tu transferencia
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Amount */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <Label className="text-sm text-emerald-700">Monto pagado</Label>
          <p className="text-3xl font-bold text-emerald-600 mt-1">
            ${amount.toLocaleString('es-CL')}
          </p>
        </div>

        {/* File Upload */}
        <div>
          <Label>Comprobante de pago</Label>
          
          {!file ? (
            <label className="mt-2 flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
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
            <div className="mt-2 relative">
              <img
                src={preview!}
                alt="Preview"
                className="w-full h-64 object-contain bg-gray-100 rounded-lg"
              />
              <button
                onClick={removeFile}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            El comprobante será revisado por el profesor. Recibirás un email cuando sea aprobado.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t space-y-3">
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {uploading ? 'Enviando...' : 'Enviar Comprobante'}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="w-full"
          disabled={uploading}
        >
          Volver
        </Button>
      </div>
    </>
  );
};
