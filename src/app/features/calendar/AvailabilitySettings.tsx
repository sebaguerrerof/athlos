import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/app/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Clock, Calendar as CalendarIcon, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Users, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useAvailability } from './hooks/useAvailability';
import { Availability } from './types';
import { usePaymentConfig } from '../payments/hooks/usePaymentConfig';
import { useAuth } from '../auth/AuthContext';
import type { PriceByParticipants } from '../payments/types';

const availabilitySchema = z.object({
  selectedDays: z.array(z.number()).min(1, 'Selecciona al menos un día'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:mm'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:mm'),
  selectedDurations: z.array(z.number()).min(1, 'Selecciona al menos una duración'),
  priceType: z.enum(['low', 'high', 'none']).optional(),
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

const durationOptions = [
  { value: 60, label: '60 minutos (1 hora)' },
  { value: 90, label: '90 minutos (1.5 horas)' },
  { value: 120, label: '120 minutos (2 horas)' },
];

export const AvailabilitySettings: React.FC = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDurations, setSelectedDurations] = useState<number[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [priceType, setPriceType] = useState<'low' | 'high' | 'none'>('none');
  const [showPricing, setShowPricing] = useState(false);
  const [courtCost, setCourtCost] = useState<number>(0);
  const [prices, setPrices] = useState<{ [duration: number]: PriceByParticipants }>({
    60: { 1: 0, 2: 0, 3: 0, 4: 0 },
    90: { 1: 0, 2: 0, 3: 0, 4: 0 },
    120: { 1: 0, 2: 0, 3: 0, 4: 0 },
  });
  const { availabilities, loading, addAvailability, deleteAvailability, updateAvailability } = useAvailability();
  const { config, updatePricing } = usePaymentConfig();
  const { tenant } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AvailabilityFormData>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      selectedDays: [],
      startTime: '09:00',
      endTime: '18:00',
      selectedDurations: [60],
      priceType: 'none',
    },
  });

  const toggleDay = (day: number) => {
    const newSelection = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day].sort();
    setSelectedDays(newSelection);
    setValue('selectedDays', newSelection);
  };

  const selectWeekdays = () => {
    const weekdays = [1, 2, 3, 4, 5]; // Lun-Vie
    setSelectedDays(weekdays);
    setValue('selectedDays', weekdays);
  };

  const selectWeekend = () => {
    const weekend = [0, 6]; // Dom-Sáb
    setSelectedDays(weekend);
    setValue('selectedDays', weekend);
  };

  const clearDays = () => {
    setSelectedDays([]);
    setValue('selectedDays', []);
  };

  const toggleDuration = (duration: number) => {
    const newSelection = selectedDurations.includes(duration)
      ? selectedDurations.filter(d => d !== duration)
      : [...selectedDurations, duration].sort();
    setSelectedDurations(newSelection);
    setValue('selectedDurations', newSelection);
  };

  const selectAllDurations = () => {
    const allDurations = durationOptions.map(d => d.value);
    setSelectedDurations(allDurations);
    setValue('selectedDurations', allDurations);
  };

  const clearDurations = () => {
    setSelectedDurations([]);
    setValue('selectedDurations', []);
  };

  const onSubmit = async (data: AvailabilityFormData) => {
    setIsLoading(true);
    
    const totalBlocks = data.selectedDays.length * data.selectedDurations.length;
    const loadingToast = toast.loading(`Creando ${totalBlocks} bloques de disponibilidad...`, {
      description: 'Por favor espera',
    });
    
    try {
      // Crear disponibilidad para cada combinación de día y duración
      for (const dayOfWeek of data.selectedDays) {
        for (const duration of data.selectedDurations) {
          await addAvailability({
            dayOfWeek,
            startTime: data.startTime,
            endTime: data.endTime,
            duration,
            priceType: priceType !== 'none' ? priceType : undefined,
            isActive: true,
          });
        }
      }
      
      // Cerrar toast de loading
      toast.dismiss(loadingToast);
      
      // Si se configuraron precios y hay deportes, actualizar configuración de precios
      if (showPricing && priceType !== 'none' && tenant?.settings?.sports && tenant.settings.sports.length > 0) {
        const currentPricing = config?.pricing || {};
        const sportType = tenant.settings.sports[0]; // Usar el primer deporte configurado
        
        // Obtener slots existentes o crear array vacío
        const existingSlots = currentPricing[sportType]?.timeSlots || [];
        
        // Buscar si ya existe un slot del mismo tipo
        const existingSlotIndex = existingSlots.findIndex(slot => slot.type === priceType);
        
        if (existingSlotIndex >= 0) {
          // Actualizar slot existente
          existingSlots[existingSlotIndex] = {
            ...existingSlots[existingSlotIndex],
            startTime: data.startTime,
            endTime: data.endTime,
            courtCost,
            prices,
          };
        } else {
          // Agregar nuevo slot
          existingSlots.push({
            type: priceType as 'low' | 'high',
            label: priceType === 'high' ? 'Horario Alto' : 'Horario Bajo',
            startTime: data.startTime,
            endTime: data.endTime,
            courtCost,
            prices,
          });
        }
        
        await updatePricing({
          ...currentPricing,
          [sportType]: {
            timeSlots: existingSlots,
          },
        });
        
        toast.success('Disponibilidad y precios guardados', {
          description: `${data.selectedDays.length} bloques creados con precios configurados`,
        });
      } else {
        toast.success('Disponibilidad agregada', {
          description: `${data.selectedDays.length} días × ${data.selectedDurations.length} duraciones = ${data.selectedDays.length * data.selectedDurations.length} bloques creados`,
        });
      }
      
      reset();
      setSelectedDays([]);
      setSelectedDurations([]);
      setPriceType('none');
      setShowPricing(false);
      setCourtCost(0);
      setPrices({
        60: { 1: 0, 2: 0, 3: 0, 4: 0 },
        90: { 1: 0, 2: 0, 3: 0, 4: 0 },
        120: { 1: 0, 2: 0, 3: 0, 4: 0 },
      });
      setIsAdding(false);
    } catch (error) {
      toast.dismiss(loadingToast);
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
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
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
              {/* Day Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Selecciona los días</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectWeekdays}
                      className="text-xs"
                    >
                      Lun-Vie
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectWeekend}
                      className="text-xs"
                    >
                      Fin de semana
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearDays}
                      className="text-xs"
                    >
                      Limpiar
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {daysOfWeek.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        selectedDays.includes(day.value)
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-xs">{day.label.substring(0, 3)}</div>
                    </button>
                  ))}
                </div>
                {errors.selectedDays && (
                  <p className="text-sm text-red-500">{errors.selectedDays.message}</p>
                )}
              </div>

              {/* Duration Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Duraciones de clase disponibles</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAllDurations}
                      className="text-xs"
                    >
                      Todas
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearDurations}
                      className="text-xs"
                    >
                      Limpiar
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {durationOptions.map(duration => (
                    <button
                      key={duration.value}
                      type="button"
                      onClick={() => toggleDuration(duration.value)}
                      className={`p-4 rounded-lg border-2 text-sm font-medium transition-all ${
                        selectedDurations.includes(duration.value)
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                      }`}
                    >
                      <div className="text-base font-semibold">{duration.value} min</div>
                      <div className="text-xs opacity-80">{duration.label.split(' ').slice(1).join(' ')}</div>
                    </button>
                  ))}
                </div>
                {errors.selectedDurations && (
                  <p className="text-sm text-red-500">{errors.selectedDurations.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Price Type Selection */}
              <div className="space-y-3">
                <Label>Tipo de Horario (para precios)</Label>
                <p className="text-sm text-gray-600">
                  Clasifica este horario para configurar precios diferentes según demanda
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPriceType('low');
                      setValue('priceType', 'low');
                    }}
                    className={`p-4 rounded-lg border-2 text-sm font-medium transition-all ${
                      priceType === 'low'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <TrendingDown className="h-5 w-5 mx-auto mb-1" />
                    <div>Horario Bajo</div>
                    <div className="text-xs opacity-70 mt-1">Menor demanda</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPriceType('high');
                      setValue('priceType', 'high');
                    }}
                    className={`p-4 rounded-lg border-2 text-sm font-medium transition-all ${
                      priceType === 'high'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-orange-300'
                    }`}
                  >
                    <TrendingUp className="h-5 w-5 mx-auto mb-1" />
                    <div>Horario Alto</div>
                    <div className="text-xs opacity-70 mt-1">Mayor demanda</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPriceType('none');
                      setValue('priceType', 'none');
                    }}
                    className={`p-4 rounded-lg border-2 text-sm font-medium transition-all ${
                      priceType === 'none'
                        ? 'border-gray-500 bg-gray-50 text-gray-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <Clock className="h-5 w-5 mx-auto mb-1" />
                    <div>Sin clasificar</div>
                    <div className="text-xs opacity-70 mt-1">Configurar después</div>
                  </button>
                </div>
              </div>

              {/* Pricing Configuration (Optional) */}
              {priceType !== 'none' && tenant?.settings?.sports && tenant.settings.sports.length > 0 && (
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">Configurar Precios (Opcional)</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Ahorra tiempo configurando precios ahora para: <strong>{tenant.settings.sports[0]}</strong>
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPricing(!showPricing)}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      {showPricing ? 'Ocultar' : 'Mostrar'} Precios
                    </Button>
                  </div>

                  {showPricing && (
                    <Card className={`p-4 ${
                      priceType === 'high' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'
                    }`}>
                      {/* Court Cost */}
                      <div className="mb-4">
                        <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Costo de Cancha
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="1000"
                            value={courtCost}
                            onChange={(e) => setCourtCost(parseInt(e.target.value) || 0)}
                            className="pl-7 bg-white"
                            placeholder="0"
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {courtCost > 0 ? `$${courtCost.toLocaleString('es-CL')}` : 'Sin costo de cancha'}
                        </p>
                      </div>

                      {/* Prices by Duration and Participants */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Precios por Duración y Participantes
                        </Label>
                        {selectedDurations.length > 0 ? (
                          selectedDurations.sort((a, b) => a - b).map((duration) => (
                            <div key={duration} className="border border-gray-300 rounded-lg p-3 bg-white">
                              <Label className="text-xs font-semibold text-gray-700 mb-2 block">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {duration} minutos
                              </Label>
                              <div className="grid grid-cols-4 gap-2">
                                {[1, 2, 3, 4].map((participants) => (
                                  <div key={participants}>
                                    <Label className="text-[10px] text-gray-600 mb-1 block">
                                      {participants === 4 ? '4+' : participants} {participants === 1 ? 'p' : 'p'}
                                    </Label>
                                    <div className="relative">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">
                                        $
                                      </span>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={prices[duration]?.[participants] || 0}
                                        onChange={(e) => {
                                          const newPrices = { ...prices };
                                          if (!newPrices[duration]) {
                                            newPrices[duration] = { 1: 0, 2: 0, 3: 0, 4: 0 };
                                          }
                                          newPrices[duration][participants] = parseInt(e.target.value) || 0;
                                          setPrices(newPrices);
                                        }}
                                        className="pl-5 text-xs h-8 bg-white"
                                        placeholder="0"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            Selecciona duraciones arriba para configurar precios
                          </p>
                        )}
                      </div>

                      <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                        <p className="text-xs text-blue-900">
                          💡 <strong>Tip:</strong> Estos precios se aplicarán automáticamente a {tenant.settings.sports[0]} en este horario {priceType === 'high' ? 'alto' : 'bajo'}
                        </p>
                      </div>
                    </Card>
                  )}
                </div>
              )}

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
                          ? slot.priceType === 'high'
                            ? 'border-orange-200 bg-orange-50'
                            : slot.priceType === 'low'
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-gray-200 bg-white'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-sm font-medium">
                                <Clock className="h-4 w-4 mr-2 text-blue-600" />
                                {slot.startTime} - {slot.endTime}
                              </div>
                              {slot.priceType && (
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    slot.priceType === 'high'
                                      ? 'bg-orange-200 text-orange-800'
                                      : 'bg-blue-200 text-blue-800'
                                  }`}
                                >
                                  {slot.priceType === 'high' ? (
                                    <><TrendingUp className="h-3 w-3 inline mr-1" />Alto</>
                                  ) : (
                                    <><TrendingDown className="h-3 w-3 inline mr-1" />Bajo</>
                                  )}
                                </span>
                              )}
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
    </DashboardLayout>
  );
};
