import { useState } from 'react';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sportOptions } from '@/app/shared/types/sports';
import { GraduationCap, ChevronLeft, ChevronRight, Users, Calendar, Dumbbell, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAcademies } from './hooks/useAcademies';
import { useCoaches } from './hooks/useCoaches';
import { useClients } from '@/app/features/clients/hooks/useClients';
import { useExercises } from './hooks/useExercises';
import { Court, AcademySchedule, CreateAcademyData } from './types';

interface NewAcademyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewAcademyModal: React.FC<NewAcademyModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { addAcademy } = useAcademies();
  const { coaches, loading: loadingCoaches } = useCoaches();
  const { clients, loading: loadingClients } = useClients();
  const { exercises } = useExercises();

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [sportType, setSportType] = useState('');
  const [numberOfCourts, setNumberOfCourts] = useState(1);
  const [courtPrice, setCourtPrice] = useState(0);
  const [pricePerStudent, setPricePerStudent] = useState(0);
  const [headCoachId, setHeadCoachId] = useState('');

  // Step 2: Courts Configuration
  const [courts, setCourts] = useState<Court[]>([]);

  // Step 3: Schedules and Exercises
  const [schedules, setSchedules] = useState<AcademySchedule[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);

  const maxClientsPerCourt = sportType === 'padel' ? 4 : 6;

  const dayNames = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ];

  const resetForm = () => {
    setStep(1);
    setName('');
    setSportType('');
    setNumberOfCourts(1);
    setCourtPrice(0);
    setPricePerStudent(0);
    setHeadCoachId('');
    setCourts([]);
    setSchedules([]);
    setSelectedExercises([]);
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onOpenChange(false);
    }
  };

  const validateStep1 = (): boolean => {
    if (!name.trim()) {
      toast.error('El nombre de la academia es requerido');
      return false;
    }
    if (!sportType) {
      toast.error('Debes seleccionar un deporte');
      return false;
    }
    if (numberOfCourts < 1 || numberOfCourts > 10) {
      toast.error('El número de canchas debe estar entre 1 y 10');
      return false;
    }
    if (courtPrice < 0 || pricePerStudent < 0) {
      toast.error('Los precios no pueden ser negativos');
      return false;
    }
    return true;
  };

  const handleStep1Next = () => {
    if (!validateStep1()) return;

    // Initialize courts based on numberOfCourts
    const initialCourts: Court[] = Array.from({ length: numberOfCourts }, (_, index) => ({
      id: `court_${Date.now()}_${index}`,
      courtNumber: index + 1,
      assignedCoachId: '',
      assignedCoachName: '',
      clientIds: [],
      clientNames: [],
    }));

    setCourts(initialCourts);
    setStep(2);
  };

  const validateStep2 = (): boolean => {
    // Check all courts have assigned coaches
    for (const court of courts) {
      if (!court.assignedCoachId) {
        toast.error(`La cancha ${court.courtNumber} necesita un coach asignado`);
        return false;
      }
    }

    // Validate 2+ coaches if 2+ courts
    if (numberOfCourts >= 2) {
      const uniqueCoaches = new Set(courts.map(c => c.assignedCoachId));
      if (headCoachId) uniqueCoaches.add(headCoachId);
      
      if (uniqueCoaches.size < 2) {
        toast.error('Debes asignar al menos 2 coaches diferentes para 2 o más canchas');
        return false;
      }
    }

    // Validate max clients per court
    for (const court of courts) {
      if (court.clientIds.length > maxClientsPerCourt) {
        toast.error(`La cancha ${court.courtNumber} excede el máximo de ${maxClientsPerCourt} clientes`);
        return false;
      }
    }

    return true;
  };

  const handleStep2Next = () => {
    if (!validateStep2()) return;

    // Initialize with one empty schedule
    if (schedules.length === 0) {
      setSchedules([{
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:00',
        duration: 60,
        startDate: new Date().toISOString().split('T')[0],
      }]);
    }

    setStep(3);
  };

  const updateCourtCoach = (courtIndex: number, coachId: string) => {
    const coach = coaches.find(c => c.id === coachId);
    const updatedCourts = [...courts];
    updatedCourts[courtIndex] = {
      ...updatedCourts[courtIndex],
      assignedCoachId: coachId,
      assignedCoachName: coach?.name || '',
    };
    setCourts(updatedCourts);
  };

  const toggleCourtClient = (courtIndex: number, clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    const updatedCourts = [...courts];
    const court = updatedCourts[courtIndex];

    if (court.clientIds.includes(clientId)) {
      court.clientIds = court.clientIds.filter(id => id !== clientId);
      court.clientNames = court.clientNames.filter(name => name !== client?.name);
    } else {
      if (court.clientIds.length >= maxClientsPerCourt) {
        toast.error(`Máximo ${maxClientsPerCourt} clientes por cancha`);
        return;
      }
      court.clientIds.push(clientId);
      court.clientNames.push(client?.name || '');
    }

    setCourts(updatedCourts);
  };

  const addSchedule = () => {
    setSchedules([
      ...schedules,
      {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:00',
        duration: 60,
        startDate: new Date().toISOString().split('T')[0],
      },
    ]);
  };

  const updateSchedule = (index: number, field: keyof AcademySchedule, value: any) => {
    const updated = [...schedules];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate duration if times change
    if (field === 'startTime' || field === 'endTime') {
      const start = field === 'startTime' ? value : updated[index].startTime;
      const end = field === 'endTime' ? value : updated[index].endTime;
      
      if (start && end) {
        const [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);
        const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        updated[index].duration = duration > 0 ? duration : 60;
      }
    }

    setSchedules(updated);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const toggleExercise = (exerciseId: string) => {
    setSelectedExercises(prev =>
      prev.includes(exerciseId)
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  const validateStep3 = (): boolean => {
    if (schedules.length === 0) {
      toast.error('Debes agregar al menos un horario');
      return false;
    }

    for (const schedule of schedules) {
      if (!schedule.startTime || !schedule.endTime) {
        toast.error('Todos los horarios deben tener hora de inicio y fin');
        return false;
      }

      const [startHour, startMin] = schedule.startTime.split(':').map(Number);
      const [endHour, endMin] = schedule.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes <= startMinutes) {
        toast.error('La hora de fin debe ser posterior a la hora de inicio');
        return false;
      }

      if (!schedule.startDate) {
        toast.error('Todos los horarios deben tener fecha de inicio');
        return false;
      }

      const startDate = new Date(schedule.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        toast.error('La fecha de inicio debe ser hoy o posterior');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setIsLoading(true);
    try {
      const academyData: CreateAcademyData = {
        name,
        sportType,
        numberOfCourts,
        courtPrice,
        pricePerStudent,
        headCoachId: headCoachId || undefined,
        headCoachName: headCoachId ? coaches.find(c => c.id === headCoachId)?.name : undefined,
        courts,
        schedules,
        exerciseIds: selectedExercises,
      };

      await addAcademy(academyData);

      toast.success('Academia creada', {
        description: `${name} se creó exitosamente con ${numberOfCourts} cancha(s)`,
      });

      handleClose();
    } catch (error: any) {
      console.error('Error al crear academia:', error);
      toast.error('Error', {
        description: error.message || 'No se pudo crear la academia',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExercises = sportType 
    ? exercises.filter(ex => ex.sportType === sportType)
    : [];

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={`Nueva Academia - Paso ${step} de 3`}
      description={
        step === 1 ? 'Información básica de la academia' :
        step === 2 ? 'Configurar canchas y asignar coaches/clientes' :
        'Horarios y ejercicios'
      }
      size="xl"
    >
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s < step ? 'bg-green-500 text-white' :
                  s === step ? 'bg-blue-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-1 mx-2 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre de la Academia <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                placeholder="Ej: Academia de Pádel Avanzado"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sportType">
                  Deporte <span className="text-red-500">*</span>
                </Label>
                <select
                  id="sportType"
                  value={sportType}
                  onChange={(e) => setSportType(e.target.value)}
                  disabled={isLoading}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Selecciona deporte</option>
                  {sportOptions.map((sport) => (
                    <option key={sport.value} value={sport.value}>
                      {sport.icon} {sport.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfCourts">
                  Número de Canchas <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="numberOfCourts"
                  type="number"
                  min="1"
                  max="10"
                  value={numberOfCourts}
                  onChange={(e) => setNumberOfCourts(Number(e.target.value))}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courtPrice">Precio de Cancha</Label>
                <Input
                  id="courtPrice"
                  type="number"
                  min="0"
                  value={courtPrice}
                  onChange={(e) => setCourtPrice(Number(e.target.value))}
                  disabled={isLoading}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerStudent">Precio por Estudiante</Label>
                <Input
                  id="pricePerStudent"
                  type="number"
                  min="0"
                  value={pricePerStudent}
                  onChange={(e) => setPricePerStudent(Number(e.target.value))}
                  disabled={isLoading}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headCoach">Head Coach (Opcional)</Label>
              <select
                id="headCoach"
                value={headCoachId}
                onChange={(e) => setHeadCoachId(e.target.value)}
                disabled={isLoading || loadingCoaches}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Sin head coach</option>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Courts Configuration */}
        {step === 2 && (
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {courts.map((court, index) => (
              <div key={court.id} className="p-4 border rounded-lg space-y-4 bg-gray-50">
                <h3 className="font-semibold text-lg">Cancha {court.courtNumber}</h3>

                <div className="space-y-2">
                  <Label>
                    Coach Asignado <span className="text-red-500">*</span>
                  </Label>
                  <select
                    value={court.assignedCoachId}
                    onChange={(e) => updateCourtCoach(index, e.target.value)}
                    disabled={isLoading || loadingCoaches}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona un coach</option>
                    {coaches.map((coach) => (
                      <option key={coach.id} value={coach.id}>
                        {coach.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Clientes (Máx. {maxClientsPerCourt})
                  </Label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-white">
                    {loadingClients ? (
                      <p className="text-sm text-gray-500">Cargando clientes...</p>
                    ) : clients.length === 0 ? (
                      <p className="text-sm text-gray-500">No hay clientes disponibles</p>
                    ) : (
                      <div className="space-y-1">
                        {clients.map((client) => (
                          <label
                            key={client.id}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={court.clientIds.includes(client.id)}
                              onChange={() => toggleCourtClient(index, client.id)}
                              disabled={isLoading}
                              className="rounded"
                            />
                            <span className="text-sm">{client.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {court.clientIds.length > 0 && (
                    <p className="text-xs text-gray-600">
                      {court.clientIds.length} de {maxClientsPerCourt} clientes seleccionados
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 3: Schedules and Exercises */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Horarios</Label>
                <Button
                  type="button"
                  size="sm"
                  onClick={addSchedule}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Horario
                </Button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {schedules.map((schedule, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Horario {index + 1}</span>
                      {schedules.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSchedule(index)}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Día</Label>
                        <select
                          value={schedule.dayOfWeek}
                          onChange={(e) => updateSchedule(index, 'dayOfWeek', Number(e.target.value))}
                          disabled={isLoading}
                          className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
                        >
                          {dayNames.map((day, dayIndex) => (
                            <option key={dayIndex} value={dayIndex}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Hora Inicio</Label>
                        <Input
                          type="time"
                          value={schedule.startTime}
                          onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                          disabled={isLoading}
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Hora Fin</Label>
                        <Input
                          type="time"
                          value={schedule.endTime}
                          onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                          disabled={isLoading}
                          className="h-9"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Fecha Inicio</Label>
                        <Input
                          type="date"
                          value={schedule.startDate}
                          onChange={(e) => updateSchedule(index, 'startDate', e.target.value)}
                          disabled={isLoading}
                          min={new Date().toISOString().split('T')[0]}
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Fecha Fin (Opcional)</Label>
                        <Input
                          type="date"
                          value={schedule.endDate || ''}
                          onChange={(e) => updateSchedule(index, 'endDate', e.target.value || undefined)}
                          disabled={isLoading}
                          min={schedule.startDate}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exercises Selection */}
            {filteredExercises.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Ejercicios (Opcional)</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-3 bg-gray-50">
                  <div className="space-y-2">
                    {filteredExercises.map((exercise) => (
                      <label
                        key={exercise.id}
                        className="flex items-start gap-3 p-2 hover:bg-white rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedExercises.includes(exercise.id!)}
                          onChange={() => toggleExercise(exercise.id!)}
                          disabled={isLoading}
                          className="mt-1 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{exercise.name}</span>
                            <span className="text-xs text-gray-500">
                              {exercise.category === 'warm-up' && '🔥 Calentamiento'}
                              {exercise.category === 'drill' && '🎯 Ejercicio'}
                              {exercise.category === 'technique' && '⚙️ Técnica'}
                              {exercise.category === 'game' && '🎮 Juego'}
                              {exercise.category === 'cool-down' && '❄️ Enfriamiento'}
                            </span>
                          </div>
                          {exercise.description && (
                            <p className="text-xs text-gray-600 mt-1">{exercise.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                {selectedExercises.length > 0 && (
                  <p className="text-xs text-gray-600">
                    {selectedExercises.length} ejercicio(s) seleccionado(s)
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <ModalFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => step === 1 ? handleClose() : setStep(step - 1)}
          disabled={isLoading}
        >
          {step === 1 ? (
            'Cancelar'
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </>
          )}
        </Button>
        
        {step < 3 ? (
          <Button
            type="button"
            onClick={step === 1 ? handleStep1Next : handleStep2Next}
            disabled={isLoading}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creando...
              </>
            ) : (
              <>
                <GraduationCap className="h-4 w-4 mr-2" />
                Crear Academia
              </>
            )}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};
