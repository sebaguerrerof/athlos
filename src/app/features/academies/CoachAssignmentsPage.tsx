import { DashboardLayout } from '@/app/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAcademies } from './hooks/useAcademies';
import { useAuth } from '../auth/AuthContext';
import { Users, Calendar, MapPin } from 'lucide-react';
import { sportOptions } from '@/app/shared/types/sports';

export const CoachAssignmentsPage: React.FC = () => {
  const { academies, loading } = useAcademies();
  const { user } = useAuth();

  // Filter academies where current user is assigned as coach or head coach
  const myAcademies = academies.filter((academy) =>
    academy.courts.some((court) => court.assignedCoachId === user?.uid) ||
    academy.headCoachId === user?.uid
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando asignaciones...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Mis Asignaciones</h1>
          <p className="text-gray-600 mt-2">
            Academias donde estás asignado como coach
          </p>
        </div>

        {myAcademies.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tienes asignaciones activas
                </h3>
                <p className="text-gray-600">
                  Cuando seas asignado a una academia, aparecerá aquí
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {myAcademies.map((academy) => {
              const sport = sportOptions.find(s => s.value === academy.sportType);
              const isHeadCoach = academy.headCoachId === user?.uid;
              const myCourts = academy.courts.filter(court => court.assignedCoachId === user?.uid);

              return (
                <Card key={academy.id} className="overflow-hidden">
                  <CardHeader className={`${sport?.color || 'bg-gray-500'} text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{sport?.icon || '🏃'}</span>
                        <div>
                          <CardTitle className="text-white">{academy.name}</CardTitle>
                          <CardDescription className="text-white/90">
                            {sport?.label || academy.sportType}
                          </CardDescription>
                        </div>
                      </div>
                      {isHeadCoach && (
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                          Head Coach
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {isHeadCoach ? (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          Como Head Coach, supervisas todas las canchas de esta academia
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {academy.courts.map((court) => (
                            <div key={court.id} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="h-4 w-4 text-gray-600" />
                                <span className="font-medium text-sm">Cancha {court.courtNumber}</span>
                              </div>
                              <p className="text-xs text-gray-600">Coach: {court.assignedCoachName}</p>
                              <p className="text-xs text-gray-600">
                                {court.clientIds.length} {court.clientIds.length === 1 ? 'alumno' : 'alumnos'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 mb-3">
                          Tus canchas asignadas en esta academia:
                        </p>
                        {myCourts.map((court) => (
                          <div key={court.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-blue-600" />
                                <span className="font-semibold text-blue-900">Cancha {court.courtNumber}</span>
                              </div>
                              <span className="text-sm text-gray-600">
                                {court.clientIds.length} {court.clientIds.length === 1 ? 'alumno' : 'alumnos'}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {court.clientNames.map((name, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                  <span>{name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
