import { useAuth } from '../auth/AuthContext';
import { DashboardLayout } from '@/app/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Activity, TrendingUp } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user, userProfile, tenant } = useAuth();

  const stats = [
    {
      title: 'Clientes Activos',
      value: '0',
      icon: Users,
      description: 'Total de clientes registrados',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Clases Esta Semana',
      value: '0',
      icon: Calendar,
      description: 'Clases programadas',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Rutinas Activas',
      value: '0',
      icon: Activity,
      description: 'Rutinas asignadas',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Ingresos del Mes',
      value: '$0',
      icon: TrendingUp,
      description: 'Total facturado',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            ¡Bienvenido, {user?.displayName || 'Usuario'}!
          </h1>
          <p className="text-gray-500 mt-1">
            Aquí está un resumen de tu actividad
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Tu Perfil</CardTitle>
              <CardDescription>Información de tu cuenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Email</span>
                <span className="text-sm font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Rol</span>
                <span className="text-sm font-medium capitalize">{user?.role}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Estado</span>
                <span className={`text-sm font-medium ${user?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {user?.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">Email verificado</span>
                <span className={`text-sm font-medium ${user?.emailVerified ? 'text-green-600' : 'text-orange-600'}`}>
                  {user?.emailVerified ? 'Verificado' : 'Pendiente'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tenant Info */}
          {tenant && (
            <Card>
              <CardHeader>
                <CardTitle>Tu Negocio</CardTitle>
                <CardDescription>Información de tu cuenta empresarial</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Nombre</span>
                  <span className="text-sm font-medium">{tenant.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Plan</span>
                  <span className="text-sm font-medium capitalize">
                    {tenant.plan}
                  </span>
                </div>
                {tenant.settings?.businessType && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-gray-600">Tipo</span>
                    <span className="text-sm font-medium capitalize">
                      {tenant.settings.businessType === 'gym' ? 'Gimnasio' :
                       tenant.settings.businessType === 'clinic' ? 'Clínica' :
                       tenant.settings.businessType === 'personal_training' ? 'Entrenamiento Personal' :
                       'Otro'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">Estado</span>
                  <span className={`text-sm font-medium ${tenant.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {tenant.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Próximas Funcionalidades</CardTitle>
            <CardDescription>Estas funcionalidades estarán disponibles pronto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg hover:border-primary transition-colors cursor-not-allowed opacity-60">
                <Calendar className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="font-medium mb-1">Gestionar Agenda</h3>
                <p className="text-sm text-gray-500">
                  Programa y gestiona tus clases
                </p>
              </div>
              <div className="p-4 border rounded-lg hover:border-primary transition-colors cursor-not-allowed opacity-60">
                <Users className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-medium mb-1">Administrar Clientes</h3>
                <p className="text-sm text-gray-500">
                  Agrega y gestiona tus clientes
                </p>
              </div>
              <div className="p-4 border rounded-lg hover:border-primary transition-colors cursor-not-allowed opacity-60">
                <Activity className="h-8 w-8 text-purple-600 mb-2" />
                <h3 className="font-medium mb-1">Crear Rutinas</h3>
                <p className="text-sm text-gray-500">
                  Diseña planes de entrenamiento
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
