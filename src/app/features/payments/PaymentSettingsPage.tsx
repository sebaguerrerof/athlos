import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { usePaymentConfig } from './hooks/usePaymentConfig';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  FileText, 
  CheckCircle, 
  Settings,
  DollarSign,
  Trash2,
  Edit,
  Plus,
} from 'lucide-react';
import type { PaymentProvider } from './types';
import { ManualConfigForm } from './ManualConfigForm';
import { MercadoPagoConfigForm } from './MercadoPagoConfigForm';
import { PricingConfigForm } from './PricingConfigForm';
import { useAvailability } from '../calendar/hooks/useAvailability';

export const PaymentSettingsPage: React.FC = () => {
  const { config, loading, loadConfig, updatePricing } = usePaymentConfig();
  const { availabilities } = useAvailability();
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(
    config?.provider || null
  );
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [editingSport, setEditingSport] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const hasAvailabilities = availabilities.length > 0;

  console.log('🎨 PaymentSettingsPage render - config:', config, 'selectedProvider:', selectedProvider);

  // Handle delete sport pricing
  const handleDeleteSportPricing = async (sportType: string) => {
    if (!config?.pricing) return;
    
    const newPricing = { ...config.pricing };
    delete newPricing[sportType];
    
    const success = await updatePricing(newPricing);
    if (success) {
      setShowDeleteConfirm(null);
      await loadConfig();
    }
  };

  // Handle edit sport pricing
  const handleEditSportPricing = (sportType: string) => {
    setEditingSport(sportType);
    setShowPricingForm(true);
  };

  // Update selectedProvider when config changes
  useEffect(() => {
    console.log('🔄 Config changed in PaymentSettingsPage:', config);
    if (config?.provider) {
      console.log('✅ Updating selectedProvider to:', config.provider);
      setSelectedProvider(config.provider);
    } else {
      console.log('❌ No config provider found');
    }
  }, [config]);

  const providers = [
    {
      id: 'manual' as PaymentProvider,
      name: 'Pago Manual',
      icon: FileText,
      description: 'Comprobantes de transferencia',
      features: ['Sin comisiones', 'Aprobación manual', 'Transferencia bancaria'],
      commission: 'Gratis',
      color: 'blue',
      recommended: false,
    },
    {
      id: 'mercadopago' as PaymentProvider,
      name: 'Mercado Pago',
      icon: CreditCard,
      description: 'Pagos automáticos',
      features: [
        'Tarjetas de crédito/débito',
        'Mercado Pago Wallet',
        'Efectivo (PagoFácil)',
        'Confirmación automática',
      ],
      commission: '3.5% + IVA',
      color: 'green',
      recommended: true,
    },
  ];

  const handleProviderSelect = (provider: PaymentProvider) => {
    setSelectedProvider(provider);
    setShowConfigForm(true);
  };

  const handleConfigSaved = async () => {
    setShowConfigForm(false);
    setShowPricingForm(false);
    // Reload config to show updated data
    await loadConfig();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Configuración de Pagos
            </h1>
          </div>
          <p className="text-gray-600">
            Configura cómo recibirás los pagos de tus clientes
          </p>
        </div>

        {/* Current Configuration Status */}
        {config && (
          <Card className="p-4 mb-6 bg-green-50 border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">
                  Método de pago configurado
                </p>
                <p className="text-sm text-green-700">
                  {config.provider === 'manual' ? 'Pago Manual' : 'Mercado Pago'} -{' '}
                  {config.isActive ? 'Activo' : 'Inactivo'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Provider Selection */}
        {!showConfigForm && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Selecciona un Método de Pago
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {providers.map((provider) => (
                <Card
                  key={provider.id}
                  className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                    config?.provider === provider.id
                      ? 'border-2 border-blue-600 bg-blue-50'
                      : 'border border-gray-200'
                  }`}
                  onClick={() => handleProviderSelect(provider.id)}
                >
                  {/* Recommended Badge */}
                  {provider.recommended && (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ⭐ Recomendado
                      </span>
                    </div>
                  )}

                  {/* Icon and Title */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`p-3 rounded-lg ${
                        provider.color === 'green'
                          ? 'bg-green-100'
                          : 'bg-blue-100'
                      }`}
                    >
                      <provider.icon
                        className={`h-6 w-6 ${
                          provider.color === 'green'
                            ? 'text-green-600'
                            : 'text-blue-600'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {provider.name}
                      </h3>
                      <p className="text-sm text-gray-600">{provider.description}</p>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-4">
                    {provider.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Commission */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Comisión</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {provider.commission}
                    </span>
                  </div>

                  {/* Action Button */}
                  <Button
                    className="w-full mt-4"
                    variant={config?.provider === provider.id ? 'outline' : 'default'}
                  >
                    {config?.provider === provider.id
                      ? 'Reconfigurar'
                      : 'Activar'}
                  </Button>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Configuration Form */}
        {showConfigForm && selectedProvider && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Configurar {selectedProvider === 'manual' ? 'Pago Manual' : 'Mercado Pago'}
              </h2>
              <Button
                variant="outline"
                onClick={() => setShowConfigForm(false)}
              >
                Cancelar
              </Button>
            </div>

            {selectedProvider === 'manual' && (
              <ManualConfigForm onSaved={handleConfigSaved} />
            )}

            {selectedProvider === 'mercadopago' && (
              <MercadoPagoConfigForm onSaved={handleConfigSaved} />
            )}
          </div>
        )}

        {/* Pricing Configuration */}
        {config && !showConfigForm && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Precios por Clase
                </h2>
              </div>
              <Button
                onClick={() => {
                  console.log('🎯 Opening pricing modal');
                  setShowPricingForm(true);
                }}
                variant="outline"
              >
                Configurar Precios
              </Button>
            </div>

            <Card className="p-6">
              {config.pricing && Object.keys(config.pricing).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(config.pricing).map(([sport, sportConfig]) => (
                    <div
                      key={sport}
                      className="border-b border-gray-200 last:border-0 pb-4 last:pb-0 p-3 rounded-lg transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{sport}</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSportPricing(sport)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(sport)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {sportConfig.timeSlots.map((slot, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg ${
                              slot.type === 'high'
                                ? 'bg-orange-50 border border-orange-200'
                                : 'bg-blue-50 border border-blue-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                {slot.label}
                              </span>
                              <span className="text-xs text-gray-500">
                                {slot.startTime} - {slot.endTime}
                              </span>
                              {slot.courtCost && slot.courtCost > 0 && (
                                <span className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                  🏟️ Cancha: ${slot.courtCost.toLocaleString('es-CL')}
                                </span>
                              )}
                            </div>
                            <div className="space-y-2">
                              {Object.entries(slot.prices)
                                .sort(([a], [b]) => Number(a) - Number(b))
                                .map(([duration, price]) => {
                                const isOldFormat = typeof price === 'number';
                                return (
                                  <div key={duration} className="text-sm border-l-2 border-gray-300 pl-2">
                                    <div className="font-semibold text-gray-700 mb-1">
                                      {duration} min
                                    </div>
                                    {isOldFormat ? (
                                      <span className="text-gray-900">
                                        ${(price as number).toLocaleString('es-CL')}
                                      </span>
                                    ) : (
                                      <div className="grid grid-cols-2 gap-1 text-xs">
                                        {Object.entries(price as Record<string, number>)
                                          .sort(([a], [b]) => Number(a) - Number(b))
                                          .map(([participants, priceValue]) => (
                                          <div key={participants} className="text-gray-600">
                                            {participants === '4' ? '4+' : participants}p: 
                                            <span className="ml-1 font-medium text-gray-900">
                                              ${priceValue.toLocaleString('es-CL')}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {/* Add New Sport Button */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button 
                      onClick={() => {
                        setEditingSport(null);
                        setShowPricingForm(true);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Otro Deporte
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  {!hasAvailabilities ? (
                    <>
                      <p className="text-gray-600 mb-2 font-semibold">
                        Primero configura tu disponibilidad
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Los precios se basan en tus horarios disponibles. Crea tu disponibilidad antes de configurar precios.
                      </p>
                      <Button 
                        onClick={() => window.location.href = '/availability'}
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ir a Disponibilidad
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600 mb-4">
                        No has configurado precios todavía
                      </p>
                      <Button onClick={() => setShowPricingForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Configurar Precios
                      </Button>
                    </>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Pricing Modal */}
        <PricingConfigForm 
          open={showPricingForm}
          onOpenChange={(open) => {
            setShowPricingForm(open);
            if (!open) setEditingSport(null);
          }}
          onSaved={handleConfigSaved}
          editingSport={editingSport}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(null)}
            />
            <div className="relative z-[10000] w-full max-w-md bg-white rounded-lg shadow-2xl m-4 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    ¿Eliminar configuración de precios?
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Se eliminará toda la configuración de precios para <strong>{showDeleteConfirm}</strong>. 
                    Esta acción no se puede deshacer.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(null)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => handleDeleteSportPricing(showDeleteConfirm)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
