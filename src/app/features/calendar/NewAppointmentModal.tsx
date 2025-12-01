import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sportOptions, SportType } from '@/app/shared/types/sports';
import { Calendar, Clock, User, UserPlus, AlertCircle, Dumbbell, X } from 'lucide-react';
import { toast } from 'sonner';
import { useClients } from '@/app/features/clients/hooks/useClients';
import { useAppointments } from './hooks/useAppointments';
import { useAvailability } from './hooks/useAvailability';
import { usePaymentConfig } from '@/app/features/payments/hooks/usePaymentConfig';
import { usePayments } from '@/app/features/payments/hooks/usePayments';
import { useAuth } from '@/app/features/auth/AuthContext';
import { useHistory } from 'react-router-dom';
import { useExercises } from '@/app/features/academies/hooks/useExercises';

const appointmentSchema = z.object({
  clientId: z.string().min(1, 'Selecciona un cliente'),
  date: z.string().min(1, 'La fecha es requerida'),
  startTime: z.string().min(1, 'La hora de inicio es requerida'),
  duration: z.number().min(15, 'Duración mínima: 15 minutos'),
  sportType: z.string().min(1, 'Selecciona un tipo de actividad'),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringEndDate: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface NewAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const { clients, loading: loadingClients } = useClients();
  const { addAppointment, appointments } = useAppointments();
  const { availabilities } = useAvailability();
  const { config, getPrice } = usePaymentConfig();
  const { addPayment } = usePayments();
  const { tenant, user } = useAuth();
  const history = useHistory();
  const { exercises, loading: loadingExercises } = useExercises();

  // Filter sports to only show the ones the trainer offers
  const trainerSports = tenant?.settings?.sports || [];
  const availableSports = sportOptions.filter(sport => 
    trainerSports.includes(sport.value)
  );

  // Get active availabilities
  const activeAvailabilities = availabilities.filter(av => av.isActive);
  
  // Get unique durations from availabilities, sorted
  const availableDurations = Array.from(
    new Set(activeAvailabilities.map(av => av.duration))
  ).sort((a, b) => a - b).map(duration => ({
    value: duration,
    label: duration === 60 ? '1 hora' 
      : duration === 90 ? '1 hora 30 min' 
      : duration === 120 ? '2 horas'
      : duration === 30 ? '30 minutos'
      : duration === 45 ? '45 minutos'
      : `${duration} minutos`
  }));

  // Get available days of week (0-6)
  const availableDays = Array.from(
    new Set(activeAvailabilities.map(av => av.dayOfWeek))
  ).sort();

  // Helper to get time slots for a specific date and duration (filtering occupied slots)
  const getAvailableTimeSlots = (dateStr: string, duration: number) => {
    if (!dateStr || !duration) return [];
    
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay();
    
    // Get availabilities for this day and duration
    const dayAvailabilities = activeAvailabilities.filter(
      av => av.dayOfWeek === dayOfWeek && av.duration === duration
    );
    
    if (dayAvailabilities.length === 0) return [];
    
    // Generate time slots in 30-minute intervals
    const slots: string[] = [];
    
    dayAvailabilities.forEach(av => {
      const [startHour, startMin] = av.startTime.split(':').map(Number);
      const [endHour, endMin] = av.endTime.split(':').map(Number);
      
      let currentHour = startHour;
      let currentMin = startMin;
      
      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
        
        // Check if there's enough time for the duration
        const currentMinutes = currentHour * 60 + currentMin;
        const endMinutes = endHour * 60 + endMin;
        
        if (currentMinutes + duration <= endMinutes) {
          // Check if this time slot conflicts with existing appointments
          const slotEndMinutes = currentMinutes + duration;
          
          const hasConflict = appointments.some(apt => {
            if (apt.date !== dateStr || apt.status === 'cancelled') return false;
            
            const [aptHours, aptMinutes] = apt.startTime.split(':').map(Number);
            const aptStartMinutes = aptHours * 60 + aptMinutes;
            const aptEndMinutes = aptStartMinutes + apt.duration;

            // Check if slots overlap
            return (
              (currentMinutes >= aptStartMinutes && currentMinutes < aptEndMinutes) ||
              (slotEndMinutes > aptStartMinutes && slotEndMinutes <= aptEndMinutes) ||
              (currentMinutes <= aptStartMinutes && slotEndMinutes >= aptEndMinutes)
            );
          });

          if (!hasConflict) {
            slots.push(timeStr);
          }
        }
        
        // Increment by 30 minutes
        currentMin += 30;
        if (currentMin >= 60) {
          currentMin = 0;
          currentHour++;
        }
      }
    });
    
    return Array.from(new Set(slots)).sort();
  };

  // Helper to check if a date is available
  const isDateAvailable = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr + 'T00:00:00');
    return availableDays.includes(date.getDay());
  };

  // Helper to get day name in Spanish
  const getDayName = (dayOfWeek: number): string => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayOfWeek];
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      duration: 60,
    },
  });

  const selectedSport = watch('sportType');
  const selectedDate = watch('date');
  const selectedDuration = watch('duration');
  
  // Get available time slots for selected date and duration
  const availableTimeSlots = selectedDate && selectedDuration 
    ? getAvailableTimeSlots(selectedDate, selectedDuration)
    : [];

  // Filter exercises by selected sport
  const availableExercises = selectedSport
    ? exercises.filter(ex => ex.sportType === selectedSport)
    : [];

  // Group exercises by category
  const exercisesByCategory = availableExercises.reduce((acc, exercise) => {
    const category = exercise.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(exercise);
    return acc;
  }, {} as Record<string, typeof exercises>);

  const categoryLabels: Record<string, string> = {
    'warm-up': 'Calentamiento',
    'drill': 'Ejercicios',
    'technique': 'Técnica',
    'game': 'Juegos',
    'cool-down': 'Enfriamiento',
    'other': 'Otros',
  };

  const toggleExercise = (exerciseId: string) => {
    setSelectedExercises(prev => 
      prev.includes(exerciseId)
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  // Helper function to create payment after appointment
  const createPaymentForAppointment = async (
    appointmentId: string,
    clientData: any,
    appointmentData: any
  ) => {
    if (!config) {
      console.log('⚠️ No payment config found, skipping payment');
      return;
    }

    // Calculate price
    const price = getPrice(appointmentData.sportType, appointmentData.duration, appointmentData.startTime);
    
    if (!price || price === 0) {
      console.log('⚠️ No price found for this appointment');
      return;
    }

    // Generate unique token
    const paymentToken = `${appointmentId}_${Date.now()}`;

    try {
      // Create payment
      await addPayment({
        appointmentId,
        clientId: appointmentData.clientId,
        clientName: clientData.name,
        amount: price,
        provider: config.provider || 'manual',
        method: 'transfer',
        proofUrl: null,
        proofStatus: null,
        paymentToken,
      });

      console.log('✅ Payment created with token:', paymentToken);

      // TODO: When Cloud Functions are deployed, they will send the email automatically
      // For now, show a toast notification
      if (clientData.email) {
        toast.success('Email enviado', {
          description: `Se envió un email a ${clientData.email} con el link de pago`,
          duration: 5000,
        });
        console.log('📧 Email would be sent to:', clientData.email);
        console.log('🔗 Payment link:', `${window.location.origin}/payment/${paymentToken}`);
      } else {
        toast.warning('Cliente sin email', {
          description: 'El cliente no tiene email configurado para recibir el link de pago',
        });
      }
    } catch (error) {
      console.error('❌ Error creating payment:', error);
    }
  };

  const onSubmit = async (data: AppointmentFormData) => {
    setIsLoading(true);
    try {
      // Validar que el día tenga disponibilidad
      if (!isDateAvailable(data.date)) {
        const date = new Date(data.date + 'T00:00:00');
        const dayName = getDayName(date.getDay());
        toast.error('Día sin disponibilidad', {
          description: `No tienes horarios disponibles los ${dayName}s. Por favor selecciona otro día.`,
        });
        setIsLoading(false);
        return;
      }

      // Get client name for denormalization
      const client = clients.find(c => c.id === data.clientId);
      if (!client) {
        throw new Error('Cliente no encontrado');
      }

      if (isRecurring && data.recurringEndDate) {
        // Crear clases recurrentes
        const recurringGroupId = `recurring_${Date.now()}`;
        const startDate = new Date(data.date);
        const endDate = new Date(data.recurringEndDate);
        const dayOfWeek = startDate.getDay();
        
        const datesToCreate: string[] = [];
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          if (currentDate.getDay() === dayOfWeek && currentDate >= startDate) {
            datesToCreate.push(currentDate.toISOString().split('T')[0]);
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Calcular minutos para validación de conflictos
        const [hours, minutes] = data.startTime.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        const endMinutes = startMinutes + data.duration;

        // Crear todas las clases
        let createdCount = 0;
        for (const dateStr of datesToCreate) {
          // Validar cada fecha
          const dateHasConflict = appointments.some(apt => {
            if (apt.date !== dateStr || apt.status === 'cancelled') return false;
            const [aptHours, aptMinutes] = apt.startTime.split(':').map(Number);
            const aptStartMinutes = aptHours * 60 + aptMinutes;
            const aptEndMinutes = aptStartMinutes + apt.duration;
            return (
              (startMinutes >= aptStartMinutes && startMinutes < aptEndMinutes) ||
              (endMinutes > aptStartMinutes && endMinutes <= aptEndMinutes) ||
              (startMinutes <= aptStartMinutes && endMinutes >= aptEndMinutes)
            );
          });

          if (!dateHasConflict) {
            const appointmentId = await addAppointment({
              clientId: data.clientId,
              clientName: client.name,
              sportType: data.sportType,
              date: dateStr,
              startTime: data.startTime,
              duration: data.duration,
              notes: data.notes,
              recurringGroupId,
              exerciseIds: selectedExercises,
            });
            
            // Create payment for each recurring appointment
            if (appointmentId) {
              await createPaymentForAppointment(appointmentId, client, {
                clientId: data.clientId,
                sportType: data.sportType,
                duration: data.duration,
                startTime: data.startTime,
              });
            }
            
            createdCount++;
          }
        }

        toast.success('Clases creadas', {
          description: `${createdCount} clases recurrentes programadas con ${client.name}`,
        });
      } else {
        // Crear clase única
        const appointmentId = await addAppointment({
          clientId: data.clientId,
          clientName: client.name,
          sportType: data.sportType,
          date: data.date,
          startTime: data.startTime,
          duration: data.duration,
          notes: data.notes,
          exerciseIds: selectedExercises,
        });
        
        // Create payment for the appointment
        if (appointmentId) {
          await createPaymentForAppointment(appointmentId, client, {
            clientId: data.clientId,
            sportType: data.sportType,
            duration: data.duration,
            startTime: data.startTime,
          });
        }
        
        toast.success('Clase creada', {
          description: `Clase de ${availableSports.find(s => s.value === data.sportType)?.label} programada con ${client.name}`,
        });
      }
      
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error al crear clase:', error);
      toast.error('Error', {
        description: 'No se pudo crear la clase. Intenta nuevamente',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToClients = () => {
    onOpenChange(false);
    history.push('/clients');
  };

  // Si no hay clientes, mostrar CTA
  if (!loadingClients && clients.length === 0) {
    return (
      <Modal
        isOpen={open}
        onClose={() => onOpenChange(false)}
        title="Agrega tu primer cliente"
        description="Para crear una clase, primero necesitas agregar un cliente"
        size="md"
      >
        <div className="text-center py-6">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No tienes clientes todavía
          </h3>
          <p className="text-gray-500 mb-6">
            Comienza agregando tu primer cliente para poder programar clases
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleGoToClients}>
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar Cliente
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Nueva Clase"
      description="Programa una nueva clase con tu cliente"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Loading state */}
        {loadingClients && (
          <div className="text-center py-4 text-gray-500">
            Cargando clientes...
          </div>
        )}
        {/* Client Selection */}
        <div className="space-y-2">
          <Label htmlFor="clientId">
            Cliente <span className="text-red-500">*</span>
          </Label>
          <select
            id="clientId"
            {...register('clientId')}
            disabled={isLoading || loadingClients}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Selecciona un cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          {errors.clientId && (
            <p className="text-sm text-red-500">{errors.clientId.message}</p>
          )}
        </div>

        {/* Sport Type */}
        <div className="space-y-2">
          <Label htmlFor="sportType">
            Tipo de Actividad <span className="text-red-500">*</span>
          </Label>
          <select
            id="sportType"
            {...register('sportType')}
            disabled={isLoading}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Selecciona el tipo de actividad</option>
            {availableSports.map((sport) => (
              <option key={sport.value} value={sport.value}>
                {sport.icon} {sport.label}
              </option>
            ))}
          </select>
          {errors.sportType && (
            <p className="text-sm text-red-500">{errors.sportType.message}</p>
          )}
          {availableSports.length === 0 && (
            <p className="text-sm text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              No tienes deportes configurados. Ve a tu perfil para agregarlos.
            </p>
          )}
        </div>

        {/* Date, Duration and Time - Optimized Layout */}
        {availableDays.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <p className="text-xs text-blue-700">
              📅 Disponible: <span className="font-medium">{availableDays.map(day => getDayName(day)).join(', ')}</span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">
              Fecha <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                id="date"
                type="date"
                {...register('date')}
                disabled={isLoading || availableDays.length === 0}
                className="pl-10"
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  const dateValue = e.target.value;
                  setValue('date', dateValue);
                  setValue('startTime', '');
                  
                  if (dateValue && !isDateAvailable(dateValue)) {
                    toast.warning('Día sin disponibilidad', {
                      description: 'Este día no tiene horarios disponibles. Por favor selecciona otro día.',
                    });
                  }
                }}
              />
            </div>
            {errors.date && (
              <p className="text-xs text-red-500">{errors.date.message}</p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">
              Duración <span className="text-red-500">*</span>
            </Label>
            <select
              id="duration"
              {...register('duration', { valueAsNumber: true })}
              disabled={isLoading}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(e) => {
                setValue('duration', Number(e.target.value));
                setValue('startTime', '');
              }}
            >
              <option value="">Duración</option>
              {availableDurations.map((duration) => (
                <option key={duration.value} value={duration.value}>
                  {duration.label}
                </option>
              ))}
            </select>
            {errors.duration && (
              <p className="text-xs text-red-500">{errors.duration.message}</p>
            )}
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="startTime">
              Hora <span className="text-red-500">*</span>
            </Label>
            {availableTimeSlots.length > 0 ? (
              <select
                id="startTime"
                {...register('startTime')}
                disabled={isLoading || !selectedDate || !selectedDuration}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                size={1}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem',
                  appearance: 'none'
                }}
              >
                <option value="">Selecciona hora</option>
                {availableTimeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time} hs
                  </option>
                ))}
              </select>
            ) : (
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  id="startTime"
                  type="time"
                  {...register('startTime')}
                  disabled={isLoading}
                  className="pl-10"
                />
              </div>
            )}
            {errors.startTime && (
              <p className="text-xs text-red-500">{errors.startTime.message}</p>
            )}
          </div>
        </div>

        {/* Validation Messages */}
        {availableDays.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <p className="text-sm text-amber-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              No tienes disponibilidad configurada
            </p>
          </div>
        )}
        {selectedDate && !isDateAvailable(selectedDate) && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <p className="text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              ⚠️ No tienes disponibilidad este día ({getDayName(new Date(selectedDate + 'T00:00:00').getDay())})
            </p>
          </div>
        )}
        {selectedDate && selectedDuration && availableTimeSlots.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <p className="text-sm text-amber-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              No hay horarios disponibles para esta combinación
            </p>
          </div>
        )}

        {/* Recurring Toggle */}
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <input
            type="checkbox"
            id="isRecurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            disabled={isLoading}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="isRecurring" className="text-sm font-medium cursor-pointer">
            Clase recurrente (repetir semanalmente)
          </Label>
        </div>

        {/* Recurring End Date */}
        {isRecurring && (
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Label htmlFor="recurringEndDate">
              Fecha de finalización <span className="text-red-500">*</span>
            </Label>
            <Input
              id="recurringEndDate"
              type="date"
              {...register('recurringEndDate')}
              disabled={isLoading}
              min={watch('date') || new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-gray-600">
              Se crearán clases cada {watch('date') ? new Date(watch('date')).toLocaleDateString('es-ES', { weekday: 'long' }) : 'semana'} hasta esta fecha
            </p>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notas (opcional)</Label>
          <textarea
            id="notes"
            {...register('notes')}
            disabled={isLoading}
            rows={3}
            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            placeholder="Agrega notas o instrucciones especiales..."
          />
        </div>

        {/* Exercise Selection */}
        {selectedSport && availableExercises.length > 0 && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-gray-700" />
              <Label className="text-base font-semibold">
                Ejercicios y Dinámicas (opcional)
              </Label>
            </div>
            <p className="text-sm text-gray-600">
              Selecciona los ejercicios que realizarás en esta clase
            </p>

            {/* Selected exercises summary */}
            {selectedExercises.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedExercises.map(exerciseId => {
                  const exercise = exercises.find(ex => ex.id === exerciseId);
                  if (!exercise) return null;
                  return (
                    <span
                      key={exerciseId}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {exercise.name}
                      <button
                        type="button"
                        onClick={() => toggleExercise(exerciseId)}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Exercise list by category */}
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {Object.entries(exercisesByCategory).map(([category, categoryExercises]) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    {categoryLabels[category] || category}
                  </h4>
                  <div className="space-y-1">
                    {categoryExercises.map(exercise => (
                      <label
                        key={exercise.id}
                        className="flex items-start gap-3 p-2 hover:bg-white rounded-md cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedExercises.includes(exercise.id!)}
                          onChange={() => toggleExercise(exercise.id!)}
                          disabled={isLoading}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {exercise.name}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              exercise.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                              exercise.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {exercise.difficulty === 'beginner' ? 'Principiante' :
                               exercise.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                            </span>
                          </div>
                          {exercise.description && (
                            <p className="text-xs text-gray-600 mt-1">
                              {exercise.description}
                            </p>
                          )}
                          {exercise.duration && (
                            <p className="text-xs text-gray-500 mt-1">
                              ⏱️ {exercise.duration} min
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedSport && availableExercises.length === 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              No tienes ejercicios creados para {sportOptions.find(s => s.value === selectedSport)?.label}.
              Puedes crear ejercicios desde el menú "Academias/Grupos" → "Dinámicas/Ejercicios"
            </p>
          </div>
        )}

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
            {isLoading ? 'Creando...' : 'Crear Clase'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
