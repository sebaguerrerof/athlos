import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAvailability } from './hooks/useAvailability';
import { Availability } from './types';

const availabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:mm'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:mm'),
  duration: z.number().min(15).max(480), // 15 min to 8 hours
}).refine(data => data.endTime > data.startTime, {
  message: 'La hora de fin debe ser mayor que la de inicio',
  path: ['endTime'],
});

type AvailabilityFormData = z.infer<typeof availabilitySchema>;

const daysOfWeek = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

export const AvailabilitySettings: React.FC = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { availabilities, loading, addAvailability, deleteAvailability, updateAvailability } = useAvailability();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AvailabilityFormData>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '18:00',
      duration: 60,
    },
  });

  const onSubmit = async (data: AvailabilityFormData) => {
    setIsLoading(true);
    try {
      await addAvailability({
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.duration,
        isActive: true,
      });
      
      toast.success('Disponibilidad agregada', {
        description: `Horario configurado para ${daysOfWeek.find(d => d.value === data.dayOfWeek)?.label}`,
      });
      
      reset();
      setIsAdding(false);
    } catch (error) {
      console.error('Error al agregar disponibilidad:', error);
      toast.error('Error', {
        description: 'No se pudo agregar la disponibilidad',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAvailability(id);
      toast.success('Disponibilidad eliminada');
    } catch (error) {
      console.error('Error al eliminar disponibilidad:', error);
      toast.error('Error', {
        description: 'No se pudo eliminar la disponibilidad',
      });
    }
  };

  const handleToggleActive = async (availability: Availability) => {
    try {
      await updateAvailability(availability.id, {
        isActive: !availability.isActive,
      });
      toast.success(availability.isActive ? 'Disponibilidad desactivada' : 'Disponibilidad activada');
    } catch (error) {
      console.error('Error al actualizar disponibilidad:', error);
      toast.error('Error', {
        description: 'No se pudo actualizar la disponibilidad',
      });
    }
  };

  // Group availabilities by day
  const availabilitiesByDay = daysOfWeek.map(day => ({
    ...day,
    slots: availabilities.filter(av => av.dayOfWeek === day.value),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Disponibilidad</h2>
          <p className="text-gray-500 mt-1">Configura tus horarios disponibles para clases</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? 'Cancelar' : <><Plus className="h-4 w-4 mr-2" />Agregar Horario</>}
        </Button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Nuevo Horario Disponible</CardTitle>
            <CardDescription>Define un bloque de tiempo disponible</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Day of Week */}
                <div className="space-y-2">
                  <Label htmlFor="dayOfWeek">Día de la Semana</Label>
                  <select
                    id="dayOfWeek"
                    {...register('dayOfWeek', { valueAsNumber: true })}
                    disabled={isLoading}
                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {daysOfWeek.map(day => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                  {errors.dayOfWeek && (
                    <p className="text-sm text-red-500">{errors.dayOfWeek.message}</p>
                  )}
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration">Duración por Clase (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="60"
                    {...register('duration', { valueAsNumber: true })}
                    disabled={isLoading}
                  />
                  {errors.duration && (
                    <p className="text-sm text-red-500">{errors.duration.message}</p>
                  )}
                </div>

                {/* Start Time */}
                <div className="space-y-2">
                  <Label htmlFor="startTime">Hora de Inicio</Label>
                  <Input
                    id="startTime"
                    type="time"
                    {...register('startTime')}
                    disabled={isLoading}
                  />
                  {errors.startTime && (
                    <p className="text-sm text-red-500">{errors.startTime.message}</p>
                  )}
                </div>

                {/* End Time */}
                <div className="space-y-2">
                  <Label htmlFor="endTime">Hora de Fin</Label>
                  <Input
                    id="endTime"
                    type="time"
                    {...register('endTime')}
                    disabled={isLoading}
                  />
                  {errors.endTime && (
                    <p className="text-sm text-red-500">{errors.endTime.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset();
                    setIsAdding(false);
                  }}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar Horario'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Availabilities List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500">Cargando disponibilidad...</p>
          </div>
        ) : availabilitiesByDay.every(day => day.slots.length === 0) ? (
          <div className="col-span-full text-center py-12">
            <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay horarios configurados
            </h3>
            <p className="text-gray-500 mb-6">
              Agrega tus horarios disponibles para que los clientes puedan reservar clases
            </p>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Primer Horario
            </Button>
          </div>
        ) : (
          availabilitiesByDay.map(day => {
            if (day.slots.length === 0) return null;
            
            return (
              <div key={day.value}>
                <h3 className="font-semibold text-gray-900 mb-3">{day.label}</h3>
                <div className="space-y-2">
                  {day.slots.map(slot => (
                    <Card
                      key={slot.id}
                      className={`transition-all ${
                        slot.isActive
                          ? 'border-blue-200 bg-white'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm font-medium">
                              <Clock className="h-4 w-4 mr-2 text-blue-600" />
                              {slot.startTime} - {slot.endTime}
                            </div>
                            <p className="text-xs text-gray-500">
                              {slot.duration} min por clase
                            </p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(slot)}
                              className="h-8 w-8 p-0"
                            >
                              <span className="sr-only">
                                {slot.isActive ? 'Desactivar' : 'Activar'}
                              </span>
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  slot.isActive ? 'bg-green-500' : 'bg-gray-400'
                                }`}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(slot.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
