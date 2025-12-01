import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/app/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { useAppointments } from './hooks/useAppointments';
import { sportOptions } from '@/app/shared/types/sports';
import { Repeat, Trash2, Calendar, Clock, User, AlertTriangle, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';
import { useExercises } from '@/app/features/academies/hooks/useExercises';

export const RecurringClassesPage: React.FC = () => {
  const { appointments, deleteAppointment, loading } = useAppointments();
  const { exercises } = useExercises();
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Agrupar clases por recurringGroupId
  const recurringGroups = useMemo(() => {
    const groups = new Map<string, typeof appointments>();
    
    appointments.forEach(apt => {
      if (apt.recurringGroupId) {
        if (!groups.has(apt.recurringGroupId)) {
          groups.set(apt.recurringGroupId, []);
        }
        groups.get(apt.recurringGroupId)!.push(apt);
      }
    });

    // Convertir a array y ordenar
    return Array.from(groups.entries()).map(([groupId, classes]) => {
      const sortedClasses = classes.sort((a, b) => a.date.localeCompare(b.date));
      return {
        groupId,
        classes: sortedClasses,
        firstClass: sortedClasses[0],
        lastClass: sortedClasses[sortedClasses.length - 1],
        totalClasses: sortedClasses.length,
        pendingClasses: sortedClasses.filter(c => c.status === 'scheduled').length,
      };
    }).sort((a, b) => a.firstClass.date.localeCompare(b.firstClass.date));
  }, [appointments]);

  const handleDeleteGroup = async (groupId: string) => {
    const group = recurringGroups.find(g => g.groupId === groupId);
    if (!group) {
      console.log('❌ Group not found:', groupId);
      return;
    }

    setIsDeleting(true);
    console.log('🗑️ Starting deletion of group:', groupId);
    console.log('📊 Group info:', group);

    try {
      // Eliminar solo las clases programadas (no las completadas)
      const scheduledClasses = group.classes.filter(c => c.status === 'scheduled');
      console.log(`📅 Clases programadas a eliminar: ${scheduledClasses.length}`, scheduledClasses.map(c => ({ id: c.id, date: c.date })));
      
      if (scheduledClasses.length === 0) {
        toast.info('Sin clases para eliminar', {
          description: 'No hay clases programadas en esta serie',
        });
        setDeletingGroupId(null);
        setIsDeleting(false);
        return;
      }

      // Eliminar una por una para mejor tracking
      let deletedCount = 0;
      for (const apt of scheduledClasses) {
        try {
          console.log(`🗑️ Eliminando clase ${apt.id} (${apt.date})`);
          await deleteAppointment(apt.id);
          deletedCount++;
          console.log(`✅ Clase eliminada: ${apt.id}`);
        } catch (error) {
          console.error(`❌ Error eliminando clase ${apt.id}:`, error);
          throw error;
        }
      }

      console.log(`✅ Total eliminadas: ${deletedCount}/${scheduledClasses.length}`);
      
      toast.success('Clases eliminadas', {
        description: `Se eliminaron ${deletedCount} clases programadas`,
      });
      
      setDeletingGroupId(null);
    } catch (error) {
      console.error('❌ Error deleting recurring classes:', error);
      toast.error('Error al eliminar clases recurrentes', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getSportInfo = (sportType: string) => {
    return sportOptions.find(s => s.value === sportType);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando clases recurrentes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Clases Recurrentes</h1>
          <p className="text-gray-600 mt-2">
            Gestiona tus series de clases programadas semanalmente
          </p>
        </div>

        {recurringGroups.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Repeat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tienes clases recurrentes
                </h3>
                <p className="text-gray-600 mb-4">
                  Crea clases recurrentes desde el calendario marcando la opción "Clase recurrente"
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {recurringGroups.map((group) => {
              const sport = getSportInfo(group.firstClass.sportType);
              
              return (
                <Card key={group.groupId} className="overflow-hidden">
                  <CardHeader className={`${sport?.color || 'bg-gray-500'} text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{sport?.icon || '🏃'}</span>
                        <div>
                          <CardTitle className="text-white">
                            {sport?.label || group.firstClass.sportType}
                          </CardTitle>
                          <CardDescription className="text-white/90">
                            {group.firstClass.clientName}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingGroupId(group.groupId)}
                        className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar serie
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Periodo</p>
                          <p className="text-sm font-medium">
                            {formatDate(group.firstClass.date)} - {formatDate(group.lastClass.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Horario</p>
                          <p className="text-sm font-medium">
                            {group.firstClass.startTime} ({group.firstClass.duration} min)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Clases</p>
                          <p className="text-sm font-medium">
                            {group.pendingClasses} pendientes de {group.totalClasses}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Lista resumida de fechas */}
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-500 mb-2">Próximas clases:</p>
                      <div className="flex flex-wrap gap-2">
                        {group.classes
                          .filter(c => c.status === 'scheduled')
                          .slice(0, 8)
                          .map((apt) => (
                            <span
                              key={apt.id}
                              className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs"
                            >
                              {formatDate(apt.date)}
                            </span>
                          ))}
                        {group.pendingClasses > 8 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs">
                            +{group.pendingClasses - 8} más
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ejercicios asignados */}
                    {group.firstClass.exerciseIds && group.firstClass.exerciseIds.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <Dumbbell className="h-4 w-4 text-gray-500" />
                          <p className="text-xs text-gray-500">Ejercicios asignados:</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {group.firstClass.exerciseIds.map((exerciseId) => {
                            const exercise = exercises.find(ex => ex.id === exerciseId);
                            if (!exercise) return null;
                            return (
                              <span
                                key={exerciseId}
                                className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs"
                              >
                                {exercise.name}
                                {exercise.category && (
                                  <span className="ml-1 text-purple-500">•</span>
                                )}
                                {exercise.category === 'warm-up' && ' Calentamiento'}
                                {exercise.category === 'drill' && ' Ejercicio'}
                                {exercise.category === 'technique' && ' Técnica'}
                                {exercise.category === 'game' && ' Juego'}
                                {exercise.category === 'cool-down' && ' Enfriamiento'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        <Modal
          isOpen={deletingGroupId !== null}
          onClose={() => !isDeleting && setDeletingGroupId(null)}
          title="Eliminar serie de clases"
          description="Se eliminarán todas las clases programadas de esta serie. Las clases completadas no se eliminarán."
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-gray-900 font-medium">
                  ¿Estás seguro de eliminar esta serie de clases?
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingGroupId(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  console.log('🔘 Button clicked, deletingGroupId:', deletingGroupId);
                  if (deletingGroupId) {
                    handleDeleteGroup(deletingGroupId);
                  }
                }}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Eliminando...
                  </>
                ) : (
                  'Eliminar serie'
                )}
              </Button>
            </ModalFooter>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};
