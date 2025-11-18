import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Phone, User } from 'lucide-react';
import { toast } from 'sonner';
import { useClients, Client } from './hooks/useClients';
import { useAuth } from '../auth/AuthContext';

const clientSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es demasiado largo'),
  email: z
    .string()
    .email('Correo electrónico inválido')
    .min(1, 'El correo es requerido'),
  phone: z
    .string()
    .min(8, 'El teléfono debe tener al menos 8 dígitos')
    .optional()
    .or(z.literal('')),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface EditClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({
  open,
  onOpenChange,
  client,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { updateClient } = useClients();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  // Reset form when client changes
  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        notes: client.notes || '',
      });
    }
  }, [client, reset]);

  const onSubmit = async (data: ClientFormData) => {
    if (!client) return;

    // Validar que el correo del cliente no sea el mismo que el del tenant
    if (user?.email && data.email.toLowerCase() === user.email.toLowerCase()) {
      toast.error('Correo inválido', {
        description: 'No puedes usar tu propio correo electrónico para un cliente',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await updateClient(client.id, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
      });
      
      toast.success('Cliente actualizado', {
        description: `${data.name} ha sido actualizado exitosamente`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      toast.error('Error', {
        description: 'No se pudo actualizar el cliente. Intenta nuevamente',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Editar Cliente"
      description="Actualiza la información del cliente"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Nombre Completo <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              id="name"
              placeholder="Juan Pérez"
              {...register('name')}
              disabled={isLoading}
              className="pl-10"
            />
          </div>
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">
            Correo Electrónico <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="juan@ejemplo.com"
              {...register('email')}
              disabled={isLoading}
              className="pl-10"
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              id="phone"
              type="tel"
              placeholder="+56 9 1234 5678"
              {...register('phone')}
              disabled={isLoading}
              className="pl-10"
            />
          </div>
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">
            Notas <span className="text-gray-400">(opcional)</span>
          </Label>
          <textarea
            id="notes"
            {...register('notes')}
            disabled={isLoading}
            rows={3}
            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            placeholder="Información adicional, objetivos, restricciones médicas, etc."
          />
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
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
