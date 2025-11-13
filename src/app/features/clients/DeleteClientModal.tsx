import { useState } from 'react';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useClients, Client } from './hooks/useClients';

interface DeleteClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export const DeleteClientModal: React.FC<DeleteClientModalProps> = ({
  open,
  onOpenChange,
  client,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { deleteClient } = useClients();

  const handleDelete = async () => {
    if (!client) return;
    
    setIsLoading(true);
    try {
      await deleteClient(client.id);
      
      toast.success('Cliente eliminado', {
        description: `${client.name} ha sido eliminado exitosamente`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      toast.error('Error', {
        description: 'No se pudo eliminar el cliente. Intenta nuevamente',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Eliminar Cliente"
      description="Esta acción no se puede deshacer"
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">
              ¿Estás seguro de eliminar a {client?.name}?
            </p>
            <p className="text-sm text-red-700 mt-1">
              Se eliminarán todos los datos asociados: citas, pagos, rutinas, etc.
              Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? 'Eliminando...' : 'Eliminar Cliente'}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
};
