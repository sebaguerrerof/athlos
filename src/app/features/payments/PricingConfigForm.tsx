import React, { useState } from 'react';
import { usePaymentConfig } from './hooks/usePaymentConfig';
import { useAuth } from '../auth/AuthContext';
import { useAvailability } from '../calendar/hooks/useAvailability';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, DollarSign, Clock, TrendingUp, TrendingDown, X, Users, MapPin } from 'lucide-react';
import { sportOptions } from '@/app/shared/types/sports';
import type { PricingConfig, TimeSlotPricing, TimeSlotType, PriceByParticipants } from './types';
import type { Availability } from '../calendar/types';

export const PricingConfigForm: React.FC<{ 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  editingSport?: string | null;
}> = ({ open, onOpenChange, onSaved, editingSport = null }) => {
  const { config, updatePricing } = usePaymentConfig();
  const { tenant } = useAuth();
  const { availabilities } = useAvailability();
  const [pricing, setPricing] = useState<PricingConfig>(config?.pricing || {});
  const [newSportType, setNewSportType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update pricing when config changes or modal opens
  React.useEffect(() => {
    if (open && config?.pricing) {
      setPricing(config.pricing);
    }
  }, [open, config?.pricing]);

  // Scroll to editing sport when modal opens
  React.useEffect(() => {
    if (open && editingSport) {
      // Wait for render, then scroll
      setTimeout(() => {
        const element = document.getElementById(`sport-card-${editingSport}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight effect
          element.classList.add('ring-4', 'ring-blue-500', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-2');
          }, 2000);
        }
      }, 300);
    }
  }, [open, editingSport]);

  // Get tenant's configured sports
  const tenantSports = tenant?.settings?.sports || [];
  
  // If tenant has no sports configured, show warning
  const hasSportsConfigured = tenantSports.length > 0;
  
  // Filter available sports (sports not yet in pricing)
  const availableSports = hasSportsConfigured 
    ? tenantSports.filter(sport => !pricing[sport])
    : [];

  // Days of week mapping
  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  console.log('💰 PricingConfigForm render - open:', open, 'pricing:', pricing);
  console.log('🏃 Tenant sports:', tenantSports, 'Available sports:', availableSports);
  console.log('⚙️ Has sports configured:', hasSportsConfigured);
  console.log('📅 Availabilities:', availabilities);

  if (!open) return null;

  const handleAddSport = () => {
    if (!newSportType.trim()) return;

    // Create default prices structure for new pricing model
    const defaultPricesByParticipants: PriceByParticipants = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
    };

    // Check if there are availabilities with priceType defined
    const hasLowAvailability = availabilities.some(av => av.priceType === 'low' && av.isActive);
    const hasHighAvailability = availabilities.some(av => av.priceType === 'high' && av.isActive);

    // Build time slots based on availability
    const timeSlots: TimeSlotPricing[] = [];

    if (hasLowAvailability) {
      // Get time range for low availability
      const lowAvails = availabilities.filter(av => av.priceType === 'low' && av.isActive);
      const earliestStart = lowAvails.reduce((min, av) => av.startTime < min ? av.startTime : min, '23:59');
      const latestEnd = lowAvails.reduce((max, av) => av.endTime > max ? av.endTime : max, '00:00');
      
      timeSlots.push({
        type: 'low',
        label: 'Horario Bajo',
        startTime: earliestStart,
        endTime: latestEnd,
        courtCost: 0,
        prices: {
          60: { ...defaultPricesByParticipants },
          90: { ...defaultPricesByParticipants },
          120: { ...defaultPricesByParticipants },
        },
      });
    }

    if (hasHighAvailability) {
      // Get time range for high availability
      const highAvails = availabilities.filter(av => av.priceType === 'high' && av.isActive);
      const earliestStart = highAvails.reduce((min, av) => av.startTime < min ? av.startTime : min, '23:59');
      const latestEnd = highAvails.reduce((max, av) => av.endTime > max ? av.endTime : max, '00:00');
      
      timeSlots.push({
        type: 'high',
        label: 'Horario Alto',
        startTime: earliestStart,
        endTime: latestEnd,
        courtCost: 0,
        prices: {
          60: { ...defaultPricesByParticipants },
          90: { ...defaultPricesByParticipants },
          120: { ...defaultPricesByParticipants },
        },
      });
    }

    // If no price types are configured, create a standard slot
    if (timeSlots.length === 0) {
      timeSlots.push({
        type: 'low',
        label: 'Precio Estándar',
        startTime: '00:00',
        endTime: '23:59',
        courtCost: 0,
        prices: {
          60: { ...defaultPricesByParticipants },
          90: { ...defaultPricesByParticipants },
          120: { ...defaultPricesByParticipants },
        },
      });
    }

    setPricing({
      ...pricing,
      [newSportType]: {
        timeSlots,
      },
    });
    setNewSportType('');
  };

  const handleRemoveSport = (sportType: string) => {
    const newPricing = { ...pricing };
    delete newPricing[sportType];
    setPricing(newPricing);
  };

  const handleTimeSlotChange = (
    sportType: string,
    slotIndex: number,
    field: 'startTime' | 'endTime' | 'label',
    value: string
  ) => {
    const newPricing = { ...pricing };
    newPricing[sportType].timeSlots[slotIndex][field] = value;
    setPricing(newPricing);
  };

  const handleCourtCostChange = (
    sportType: string,
    slotIndex: number,
    value: string
  ) => {
    const numericValue = parseInt(value) || 0;
    const newPricing = { ...pricing };
    newPricing[sportType].timeSlots[slotIndex].courtCost = numericValue;
    setPricing(newPricing);
  };

  const handlePriceChange = (
    sportType: string,
    slotIndex: number,
    duration: number,
    participants: number,
    value: string
  ) => {
    const numericValue = parseInt(value) || 0;
    const newPricing = { ...pricing };
    const slot = newPricing[sportType].timeSlots[slotIndex];
    
    // Ensure prices object exists for this duration
    if (!slot.prices[duration]) {
      slot.prices[duration] = { 1: 0, 2: 0, 3: 0, 4: 0 };
    }
    
    // Check if prices is old format (number) and migrate
    if (typeof slot.prices[duration] === 'number') {
      const oldPrice = slot.prices[duration] as any;
      slot.prices[duration] = { 1: oldPrice, 2: oldPrice, 3: oldPrice, 4: oldPrice };
    }
    
    (slot.prices[duration] as PriceByParticipants)[participants] = numericValue;
    setPricing(newPricing);
  };

  const handleTimeSlotTypeChange = (
    sportType: string,
    slotIndex: number,
    type: TimeSlotType
  ) => {
    const newPricing = { ...pricing };
    newPricing[sportType].timeSlots[slotIndex].type = type;
    setPricing(newPricing);
  };

  const handleAddTimeSlot = (sportType: string) => {
    const newPricing = { ...pricing };
    const existingSlots = newPricing[sportType].timeSlots;
    
    // Check if there's already a 'high' slot
    const hasHighSlot = existingSlots.some(slot => slot.type === 'high');
    
    const defaultPricesByParticipants: PriceByParticipants = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
    };
    
    newPricing[sportType].timeSlots.push({
      type: hasHighSlot ? 'low' : 'high',
      label: hasHighSlot ? 'Horario Bajo' : 'Horario Alto',
      startTime: hasHighSlot ? '09:00' : '18:00',
      endTime: hasHighSlot ? '17:00' : '22:00',
      courtCost: 0,
      prices: {
        60: { ...defaultPricesByParticipants },
        90: { ...defaultPricesByParticipants },
        120: { ...defaultPricesByParticipants },
      },
    });
    setPricing(newPricing);
  };

  const handleRemoveTimeSlot = (sportType: string, slotIndex: number) => {
    const newPricing = { ...pricing };
    newPricing[sportType].timeSlots.splice(slotIndex, 1);
    setPricing(newPricing);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const success = await updatePricing(pricing);
    if (success) {
      onOpenChange(false);
      onSaved();
    }

    setIsSubmitting(false);
  };

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('es-CL');
  };

  // Helper to get price for display (show price for 1 participant)
  const getPriceForDisplay = (prices: { [duration: number]: PriceByParticipants | number }, duration: number): number => {
    const priceData = prices[duration];
    if (typeof priceData === 'number') {
      return priceData; // Old format
    }
    return priceData?.[1] || 0; // New format - show price for 1 participant
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal Content */}
      <div className="relative z-[10000] w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Configurar Precios por Clase
              </h2>
            </div>
            <p className="text-sm text-gray-600">
              Define los precios para cada deporte y franja horaria
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Warning if no sports configured */}
          {!hasSportsConfigured && (
            <Card className="p-4 bg-amber-50 border-amber-300">
              <div className="flex items-start gap-3">
                <div className="text-amber-600 text-2xl">⚠️</div>
                <div>
                  <h3 className="font-semibold text-amber-900 mb-1">
                    No has configurado deportes
                  </h3>
                  <p className="text-sm text-amber-800 mb-3">
                    Antes de configurar precios, necesitas seleccionar los deportes que ofreces en tu perfil.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      window.location.href = '/onboarding';
                    }}
                    className="border-amber-400 text-amber-700 hover:bg-amber-100"
                  >
                    Ir a Configurar Deportes
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Warning if no availabilities configured */}
          {hasSportsConfigured && availabilities.length === 0 && (
            <Card className="p-4 bg-red-50 border-red-300">
              <div className="flex items-start gap-3">
                <div className="text-red-600 text-2xl">⚠️</div>
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">
                    No tienes disponibilidad configurada
                  </h3>
                  <p className="text-sm text-red-800 mb-3">
                    Antes de configurar precios, necesitas crear tu disponibilidad horaria. 
                    Los precios se basarán en tus horarios disponibles.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      window.location.href = '/availability';
                    }}
                    className="border-red-400 text-red-700 hover:bg-red-100"
                  >
                    Ir a Configurar Disponibilidad
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Availability Info */}
          {hasSportsConfigured && availabilities.length > 0 && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-start gap-3">
                <div className="text-green-600 text-2xl">📅</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">
                    Disponibilidad Configurada
                  </h3>
                  <p className="text-sm text-green-800 mb-2">
                    Los precios se crearán según tu disponibilidad:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availabilities.some(av => av.priceType === 'low' && av.isActive) && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        <TrendingDown className="h-3 w-3" />
                        Horario Bajo (
                        {availabilities.filter(av => av.priceType === 'low' && av.isActive).length} bloques)
                      </span>
                    )}
                    {availabilities.some(av => av.priceType === 'high' && av.isActive) && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                        <TrendingUp className="h-3 w-3" />
                        Horario Alto (
                        {availabilities.filter(av => av.priceType === 'high' && av.isActive).length} bloques)
                      </span>
                    )}
                    {availabilities.some(av => !av.priceType && av.isActive) && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                        <Clock className="h-3 w-3" />
                        Sin clasificar (
                        {availabilities.filter(av => !av.priceType && av.isActive).length} bloques)
                      </span>
                    )}
                  </div>
                  {availabilities.some(av => !av.priceType && av.isActive) && (
                    <p className="text-xs text-green-700 mt-2">
                      💡 Tip: Ve a Disponibilidad para clasificar tus horarios como "Bajo" o "Alto"
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Add New Sport */}
          {hasSportsConfigured && availabilities.length > 0 && availableSports.length > 0 && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Agregar Deporte
              </Label>
              <div className="flex gap-2">
                <select
                  value={newSportType}
                  onChange={(e) => setNewSportType(e.target.value)}
                  className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona un deporte...</option>
                  {availableSports.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  onClick={handleAddSport}
                  disabled={!newSportType}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </Button>
              </div>
            </Card>
          )}

          {/* Existing Sports */}
          <div className="space-y-6">
            {Object.keys(pricing).length > 0 ? (
              Object.entries(pricing).map(([sportType, sportConfig]) => (
                <Card 
                  key={sportType} 
                  id={`sport-card-${sportType}`}
                  className={`p-6 border-2 transition-all duration-300 ${
                    editingSport === sportType 
                      ? 'border-blue-500 shadow-lg' 
                      : 'border-gray-200'
                  }`}
                >
                  {/* Sport Header */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {sportType}
                      {editingSport === sportType && (
                        <span className="ml-2 text-sm font-normal text-blue-600">(Editando)</span>
                      )}
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSport(sportType)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar Deporte
                    </Button>
                  </div>

                  {/* Time Slots */}
                  <div className="space-y-4">
                    {sportConfig.timeSlots.map((slot, slotIndex) => (
                      <Card key={slotIndex} className={`p-4 ${
                        slot.type === 'high' 
                          ? 'bg-orange-50 border-orange-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        {/* Time Slot Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {slot.type === 'high' ? (
                              <TrendingUp className="h-5 w-5 text-orange-600" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-blue-600" />
                            )}
                            <Input
                              value={slot.label}
                              onChange={(e) =>
                                handleTimeSlotChange(sportType, slotIndex, 'label', e.target.value)
                              }
                              className="w-40 font-medium bg-white"
                              placeholder="Nombre franja"
                            />
                          </div>
                          {sportConfig.timeSlots.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveTimeSlot(sportType, slotIndex)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* Time Range */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div>
                            <Label className="text-xs text-gray-600 mb-1 block">
                              <Clock className="h-3 w-3 inline mr-1" />
                              Hora Inicio
                            </Label>
                            <Input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) =>
                                handleTimeSlotChange(sportType, slotIndex, 'startTime', e.target.value)
                              }
                              className="bg-white"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600 mb-1 block">
                              <Clock className="h-3 w-3 inline mr-1" />
                              Hora Fin
                            </Label>
                            <Input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) =>
                                handleTimeSlotChange(sportType, slotIndex, 'endTime', e.target.value)
                              }
                              className="bg-white"
                            />
                          </div>
                        </div>

                        {/* Court Cost */}
                        <div className="mb-4">
                          <Label className="text-xs text-gray-600 mb-1 block">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            Costo de Cancha
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                              $
                            </span>
                            <Input
                              type="number"
                              min="0"
                              step="1000"
                              value={slot.courtCost || 0}
                              onFocus={(e) => {
                                if (e.target.value === '0') {
                                  e.target.select();
                                }
                              }}
                              onChange={(e) =>
                                handleCourtCostChange(sportType, slotIndex, e.target.value)
                              }
                              className="pl-7 bg-white"
                              placeholder="0"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Si pagas cancha: {formatCurrency(slot.courtCost || 0)} CLP
                          </p>
                        </div>

                        {/* Prices by Duration and Participants */}
                        <div className="space-y-4">
                          {[60, 90, 120].map((duration) => {
                            const priceData = slot.prices[duration];
                            const isOldFormat = typeof priceData === 'number';
                            
                            return (
                              <div key={duration} className="border border-gray-200 rounded-lg p-3 bg-white">
                                <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                                  <Clock className="h-4 w-4 inline mr-1" />
                                  Duración: {duration} minutos
                                </Label>
                                <div className="grid grid-cols-4 gap-2">
                                  {[1, 2, 3, 4].map((participants) => (
                                    <div key={participants}>
                                      <Label className="text-xs text-gray-600 mb-1 block">
                                        <Users className="h-3 w-3 inline mr-1" />
                                        {participants === 4 ? '4+' : participants} {participants === 1 ? 'persona' : 'personas'}
                                      </Label>
                                      <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                                          $
                                        </span>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="1000"
                                          value={
                                            isOldFormat 
                                              ? priceData 
                                              : (priceData as PriceByParticipants)?.[participants] || 0
                                          }
                                          onFocus={(e) => {
                                            if (e.target.value === '0') {
                                              e.target.select();
                                            }
                                          }}
                                          onChange={(e) =>
                                            handlePriceChange(sportType, slotIndex, duration, participants, e.target.value)
                                          }
                                          className="pl-6 text-xs bg-white h-8"
                                          placeholder="0"
                                        />
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">
                                        {formatCurrency(
                                          isOldFormat 
                                            ? priceData 
                                            : (priceData as PriceByParticipants)?.[participants] || 0
                                        )}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    ))}

                    {/* Add Time Slot Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddTimeSlot(sportType)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Franja Horaria
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No hay precios configurados</p>
              <p className="text-sm mt-1">
                {!hasSportsConfigured
                  ? 'Primero configura los deportes en tu perfil'
                  : availabilities.length === 0
                  ? 'Primero configura tu disponibilidad horaria'
                  : availableSports.length > 0
                  ? 'Agrega un deporte para empezar'
                  : 'Ya has configurado todos tus deportes'}
              </p>
            </div>
          )}
        </div>

        {/* Example Pricing */}
        {hasSportsConfigured && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-semibold mb-2">
              <strong>💡 Ejemplo de Precios:</strong>
            </p>
            <div className="text-sm text-blue-900 space-y-2">
              <div>
                <strong>Costo Cancha:</strong> $8.000 por hora
              </div>
              <div>
                <strong>Clase 60 min (por persona):</strong>
                <ul className="ml-4 mt-1">
                  <li>• 1 persona: $30.000</li>
                  <li>• 2 personas: $32.000 (cada uno)</li>
                  <li>• 3 personas: $34.000 (cada uno)</li>
                  <li>• 4+ personas: $36.000 (cada uno)</li>
                </ul>
              </div>
              <div className="text-xs text-blue-700 mt-2">
                Puedes ajustar estos valores según tu modelo de negocio
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || Object.keys(pricing).length === 0}
            className="flex-1"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Precios'}
          </Button>
        </div>
      </form>
      </div>
    </div>
);
};
