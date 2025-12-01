import { useState } from 'react';
import { DashboardLayout } from '@/app/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useExercises } from './hooks/useExercises';
import { Dumbbell, Plus, Clock, Target, Trash2 } from 'lucide-react';
import { NewExerciseModal } from './NewExerciseModal';
import { toast } from 'sonner';

export const ExercisesPage: React.FC = () => {
  const { exercises, loading, deleteExercise } = useExercises();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categories = [
    { value: 'all', label: 'Todos' },
    { value: 'warm-up', label: 'Calentamiento' },
    { value: 'drill', label: 'Ejercicios' },
    { value: 'game', label: 'Juegos' },
    { value: 'technique', label: 'Técnica' },
    { value: 'cool-down', label: 'Enfriamiento' },
  ];

  const filteredExercises = selectedCategory === 'all' 
    ? exercises 
    : exercises.filter(ex => ex.category === selectedCategory);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando ejercicios...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dinámicas/Ejercicios</h1>
            <p className="text-gray-600 mt-2">
              Gestiona tu biblioteca de ejercicios y dinámicas
            </p>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowNewModal(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Ejercicio
          </Button>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {filteredExercises.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tienes ejercicios creados
                </h3>
                <p className="text-gray-600 mb-4">
                  Comienza creando ejercicios para asignarlos a tus academias
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-5 w-5 mr-2" />
                  Crear Primer Ejercicio
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExercises.map((exercise) => {
              const categoryLabels = {
                'warm-up': 'Calentamiento',
                'drill': 'Ejercicio',
                'game': 'Juego',
                'technique': 'Técnica',
                'cool-down': 'Enfriamiento',
              };

              const difficultyColors = {
                'beginner': 'bg-green-100 text-green-700',
                'intermediate': 'bg-yellow-100 text-yellow-700',
                'advanced': 'bg-red-100 text-red-700',
              };

              const difficultyLabels = {
                'beginner': 'Principiante',
                'intermediate': 'Intermedio',
                'advanced': 'Avanzado',
              };

              const handleDelete = async (id: string) => {
                if (!window.confirm('¿Estás seguro de eliminar este ejercicio?')) {
                  return;
                }
                
                setDeletingId(id);
                try {
                  await deleteExercise(id);
                  toast.success('Ejercicio eliminado exitosamente');
                } catch (error) {
                  console.error('Error al eliminar ejercicio:', error);
                  toast.error('No se pudo eliminar el ejercicio');
                } finally {
                  setDeletingId(null);
                }
              };

              return (
                <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg">{exercise.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${difficultyColors[exercise.difficulty]}`}>
                          {difficultyLabels[exercise.difficulty]}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(exercise.id!)}
                          disabled={deletingId === exercise.id}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      {categoryLabels[exercise.category]} • {exercise.sportType}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {exercise.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{exercise.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        <span>{exercise.objectives.length} objetivos</span>
                      </div>
                    </div>
                    {exercise.materials && exercise.materials.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500">
                          Material: {exercise.materials.join(', ')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* New Exercise Modal */}
      <NewExerciseModal 
        open={showNewModal}
        onOpenChange={setShowNewModal}
      />
    </DashboardLayout>
  );
};
