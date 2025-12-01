import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sportOptions } from '@/app/shared/types/sports';
import { Dumbbell, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useExercises } from './hooks/useExercises';

const exerciseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  category: z.enum(['warm-up', 'drill', 'technique', 'game', 'cool-down']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  duration: z.number().min(1, 'La duración debe ser mayor a 0').optional(),
  sportType: z.string().min(1, 'El tipo de deporte es requerido'),
});

type ExerciseFormData = z.infer<typeof exerciseSchema>;

interface NewExerciseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewExerciseModal: React.FC<NewExerciseModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [materials, setMaterials] = useState<string[]>([]);
  const [currentMaterial, setCurrentMaterial] = useState('');
  const [objectives, setObjectives] = useState<string[]>([]);
  const [currentObjective, setCurrentObjective] = useState('');
  const { addExercise } = useExercises();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      category: 'drill',
      difficulty: 'beginner',
      duration: 30,
    },
  });

  const categoryLabels = {
    'warm-up': 'Calentamiento',
    'drill': 'Ejercicio',
    'technique': 'Técnica',
    'game': 'Juego',
    'cool-down': 'Enfriamiento',
  };

  const difficultyLabels = {
    'beginner': 'Principiante',
    'intermediate': 'Intermedio',
    'advanced': 'Avanzado',
  };

  const addMaterial = () => {
    if (currentMaterial.trim() && !materials.includes(currentMaterial.trim())) {
      setMaterials([...materials, currentMaterial.trim()]);
      setCurrentMaterial('');
    }
  };

  const removeMaterial = (material: string) => {
    setMaterials(materials.filter(m => m !== material));
  };

  const addObjective = () => {
    if (currentObjective.trim() && !objectives.includes(currentObjective.trim())) {
      setObjectives([...objectives, currentObjective.trim()]);
      setCurrentObjective('');
    }
  };

  const removeObjective = (objective: string) => {
    setObjectives(objectives.filter(o => o !== objective));
  };

  const onSubmit = async (data: ExerciseFormData) => {
    setIsLoading(true);
    try {
      await addExercise({
        name: data.name,
        description: data.description || '',
        category: data.category,
        difficulty: data.difficulty,
        duration: data.duration || undefined,
        materials,
        objectives,
        sportType: data.sportType,
      });

      toast.success('Ejercicio creado', {
        description: `${data.name} se agregó exitosamente`,
      });

      reset();
      setMaterials([]);
      setObjectives([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error al crear ejercicio:', error);
      toast.error('Error', {
        description: 'No se pudo crear el ejercicio. Intenta nuevamente',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      setMaterials([]);
      setObjectives([]);
      onOpenChange(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title="Nuevo Ejercicio/Dinámica"
      description="Crea un nuevo ejercicio para usar en tus clases y academias"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Nombre del Ejercicio <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            {...register('name')}
            disabled={isLoading}
            placeholder="Ej: Volea cruzada"
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Sport Type & Category */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sportType">
              Deporte <span className="text-red-500">*</span>
            </Label>
            <select
              id="sportType"
              {...register('sportType')}
              disabled={isLoading}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Selecciona deporte</option>
              {sportOptions.map((sport) => (
                <option key={sport.value} value={sport.value}>
                  {sport.icon} {sport.label}
                </option>
              ))}
            </select>
            {errors.sportType && (
              <p className="text-sm text-red-500">{errors.sportType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">
              Categoría <span className="text-red-500">*</span>
            </Label>
            <select
              id="category"
              {...register('category')}
              disabled={isLoading}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Difficulty & Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="difficulty">
              Dificultad <span className="text-red-500">*</span>
            </Label>
            <select
              id="difficulty"
              {...register('difficulty')}
              disabled={isLoading}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {Object.entries(difficultyLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duración (minutos)</Label>
            <Input
              id="duration"
              type="number"
              {...register('duration', { valueAsNumber: true })}
              disabled={isLoading}
              placeholder="30"
              min="1"
            />
            {errors.duration && (
              <p className="text-sm text-red-500">{errors.duration.message}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <textarea
            id="description"
            {...register('description')}
            disabled={isLoading}
            rows={3}
            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            placeholder="Describe el ejercicio y cómo se realiza..."
          />
        </div>

        {/* Materials */}
        <div className="space-y-2">
          <Label>Materiales</Label>
          <div className="flex gap-2">
            <Input
              value={currentMaterial}
              onChange={(e) => setCurrentMaterial(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
              disabled={isLoading}
              placeholder="Ej: Conos, pelotas..."
            />
            <Button
              type="button"
              onClick={addMaterial}
              disabled={isLoading || !currentMaterial.trim()}
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {materials.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {materials.map((material) => (
                <span
                  key={material}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {material}
                  <button
                    type="button"
                    onClick={() => removeMaterial(material)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Objectives */}
        <div className="space-y-2">
          <Label>Objetivos</Label>
          <div className="flex gap-2">
            <Input
              value={currentObjective}
              onChange={(e) => setCurrentObjective(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
              disabled={isLoading}
              placeholder="Ej: Mejorar coordinación, precisión..."
            />
            <Button
              type="button"
              onClick={addObjective}
              disabled={isLoading || !currentObjective.trim()}
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {objectives.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {objectives.map((objective) => (
                <span
                  key={objective}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                >
                  {objective}
                  <button
                    type="button"
                    onClick={() => removeObjective(objective)}
                    className="hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creando...
              </>
            ) : (
              <>
                <Dumbbell className="h-4 w-4 mr-2" />
                Crear Ejercicio
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
