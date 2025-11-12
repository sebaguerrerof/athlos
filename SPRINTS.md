# 📋 Planificación de Sprints – Athlos

## 🎯 Objetivo del MVP
Plataforma SaaS para profesores, kinesiólogos y entrenadores que permita:
- Gestionar agenda y disponibilidad
- Administrar clientes con sistema multi-tenant
- Procesar pagos por clase (Flow CLP)
- Planificar rutinas y actividades
- Integración con Google Calendar (opcional fase 1)

---

## 🏗️ Sprint 0: Setup & Arquitectura Base
**Duración estimada:** 1-2 días  
**Objetivo:** Preparar entorno de desarrollo y estructura del proyecto  
**Estado:** ✅ COMPLETADO

### 📦 Tasks
- [x] Inicializar proyecto Ionic React + TypeScript (blank template)
- [x] Configurar Tailwind CSS
- [x] Instalar y configurar shadcn/ui para Ionic
- [x] Configurar Firebase (proyecto + emulators)
- [x] Crear estructura de carpetas modular
- [x] Setup ESLint + Prettier + Git hooks (opcional)
- [x] Configurar variables de entorno (.env)
- [x] Inicializar Firebase Functions (TypeScript)
- [x] Crear archivo `firestore.rules` base
- [x] Documentar comandos en README.md

### ✅ Goals
- ✓ Proyecto compila sin errores
- ✓ Firebase emulators configurados (Auth, Firestore, Functions)
- ✓ Tailwind + shadcn/ui funcionando
- ✓ Hot reload funcional
- ✓ Git inicializado con `.gitignore` correcto

### 📁 Archivos esperados
```
.env.local
firebase.json
firestore.rules
firestore.indexes.json
functions/src/index.ts
src/lib/firebase.ts
src/lib/firestore.ts
src/lib/auth.ts
tailwind.config.js
components.json (shadcn)
README.md
```

---

## 🔐 Sprint 1: Autenticación & Tenant Base
**Duración estimada:** 3-4 días  
**Objetivo:** Sistema de registro/login con arquitectura multi-tenant
**Estado:** ✅ COMPLETADO

### 📦 Tasks
- [x] Crear tipos TypeScript para User, Tenant, Role
- [x] Implementar registro de profesor (email/password)
- [x] Crear documento de Tenant en Firestore al registrar
- [x] Asignar Custom Claim `tenantId` vía Cloud Function
- [x] Implementar login/logout
- [x] Crear contexto de autenticación (AuthContext)
- [x] Proteger rutas con PrivateRoute
- [x] UI: pantallas de Login, Register, ResetPassword
- [x] Validación de formularios con react-hook-form + zod
- [x] Toast notifications para feedback
- [x] **BONUS:** Migración completa de Ionic a Tailwind + shadcn
- [x] **BONUS:** Google OAuth implementado
- [x] **BONUS:** DashboardLayout con sidebar responsivo

### ✅ Goals
- ✓ Profesor puede registrarse y auto-crear tenant
- ✓ Login funciona y persiste sesión
- ✓ Custom claim `tenantId` se asigna correctamente
- ✓ Rutas protegidas redirigen si no hay auth
- ✓ Firestore rules validan tenantId en queries
- ✓ UI responsiva (mobile-first)

### 📁 Archivos esperados
```
src/app/features/auth/
  types.ts
  AuthContext.tsx
  useAuth.ts
  LoginPage.tsx
  RegisterPage.tsx
  ResetPasswordPage.tsx
  PrivateRoute.tsx
functions/src/auth/
  onUserCreated.ts
  setCustomClaims.ts
firestore.rules (actualizado con tenant validation)
```

### 🗄️ Colecciones Firestore
```
users/
  {uid}/
    email: string
    displayName: string
    role: 'owner' | 'instructor'
    tenantId: string
    createdAt: Timestamp
    updatedAt: Timestamp

tenants/
  {tenantId}/
    name: string
    ownerId: string
    plan: 'free' | 'pro'
    createdAt: Timestamp
    settings: {}
```

---

## 👥 Sprint 2: Gestión de Clientes
**Duración estimada:** 2-3 días  
**Objetivo:** CRUD de clientes asociados al tenant
**Estado:** 🔄 EN PROGRESO

### 📦 Tasks
- [x] Crear tipos TypeScript para Client
- [x] UI: Página base de lista de clientes
- [x] UI: Estructura de búsqueda y filtros
- [ ] Implementar CRUD de clientes (Firestore)
- [ ] UI: Formulario crear/editar cliente
- [ ] Modal de confirmación para eliminar
- [ ] Asignar Custom Claim `clientOf: [tenantId]` al invitar cliente
- [ ] Enviar invitación por email (Cloud Function)
- [ ] Cliente acepta invitación y crea cuenta
- [ ] Validación: cliente solo ve su tenant asignado

### ✅ Goals
- ✓ Profesor puede crear, editar, listar, eliminar clientes
- ✓ Búsqueda y filtros funcionan
- ✓ Invitación por email funciona
- ✓ Cliente invitado se registra y queda vinculado al tenant
- ✓ Firestore rules validan que cliente solo accede a su tenant
- ✓ UI optimista con loading states

### 📁 Archivos esperados
```
src/app/features/clients/
  types.ts
  useClients.ts
  ClientListPage.tsx
  ClientFormPage.tsx
  ClientCard.tsx
functions/src/clients/
  sendInvitation.ts
  onClientAccept.ts
```

### 🗄️ Colecciones Firestore
```
tenants/{tenantId}/clients/
  {clientId}/
    email: string
    name: string
    phone: string
    status: 'invited' | 'active' | 'inactive'
    invitedAt: Timestamp
    acceptedAt: Timestamp | null
    notes: string
```

---

## 📅 Sprint 3: Agenda & Disponibilidad
**Duración estimada:** 4-5 días  
**Objetivo:** Sistema de calendario con bloques de disponibilidad y reservas

### 📦 Tasks
- [ ] Crear tipos para Availability, Appointment, TimeSlot
- [ ] Implementar CRUD de bloques de disponibilidad (profesor)
- [ ] UI: Calendario semanal con slots disponibles
- [ ] Cliente puede ver disponibilidad y reservar clase
- [ ] Validación de conflictos de horario
- [ ] Confirmación/cancelación de clases
- [ ] Notificaciones automáticas (email/push)
- [ ] Integración con Google Calendar (OAuth 2.0)
- [ ] Sync bidireccional con Google Calendar

### ✅ Goals
- ✓ Profesor puede definir horarios disponibles por día/semana
- ✓ Cliente puede reservar clases en slots disponibles
- ✓ No hay doble reserva (validación en Cloud Function)
- ✓ Emails de confirmación automáticos
- ✓ Profesor puede cancelar/reagendar
- ✓ Sync con Google Calendar funciona (opcional MVP)
- ✓ UI de calendario intuitiva y responsiva

### 📁 Archivos esperados
```
src/app/features/calendar/
  types.ts
  useAvailability.ts
  useAppointments.ts
  CalendarPage.tsx
  AvailabilitySettings.tsx
  AppointmentCard.tsx
  BookingModal.tsx
functions/src/calendar/
  onAppointmentCreate.ts
  validateTimeSlot.ts
  sendNotification.ts
  googleCalendarSync.ts
```

### 🗄️ Colecciones Firestore
```
tenants/{tenantId}/availability/
  {availabilityId}/
    dayOfWeek: number (0-6)
    startTime: string (HH:mm)
    endTime: string (HH:mm)
    duration: number (minutos)
    isActive: boolean

tenants/{tenantId}/appointments/
  {appointmentId}/
    clientId: string
    instructorId: string
    startTime: Timestamp
    endTime: Timestamp
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
    notes: string
    googleEventId: string | null
```

---

## 💳 Sprint 4: Pagos con Flow
**Duración estimada:** 3-4 días  
**Objetivo:** Integrar pagos por clase con Flow (CLP)

### 📦 Tasks
- [ ] Configurar credenciales Flow en Functions
- [ ] Crear tipos para Payment, Invoice
- [ ] Cloud Function: crear orden de pago Flow
- [ ] Cloud Function: webhook confirmación de pago
- [ ] UI: pantalla de pago con QR/webpay
- [ ] Marcar clase como "pagada" al confirmar
- [ ] Historial de pagos (profesor y cliente)
- [ ] Generar comprobante de pago PDF (opcional)
- [ ] Validación: no permitir reserva sin pago previo (opcional)

### ✅ Goals
- ✓ Cliente puede pagar clase con Flow (webpay/transferencia)
- ✓ Webhook confirma pago correctamente
- ✓ Estado de appointment se actualiza a "paid"
- ✓ Profesor ve historial de pagos recibidos
- ✓ Cliente ve historial de pagos realizados
- ✓ Manejo de errores y reintentos
- ✓ Logs de transacciones en Firestore

### 📁 Archivos esperados
```
src/app/features/payments/
  types.ts
  usePayments.ts
  PaymentPage.tsx
  PaymentHistory.tsx
  InvoiceCard.tsx
functions/src/payments/
  createFlowOrder.ts
  flowWebhook.ts
  generateInvoice.ts
src/lib/payment/
  flowClient.ts
  flowTypes.ts
```

### 🗄️ Colecciones Firestore
```
tenants/{tenantId}/payments/
  {paymentId}/
    appointmentId: string
    clientId: string
    amount: number
    currency: 'CLP'
    status: 'pending' | 'completed' | 'failed' | 'refunded'
    flowOrderId: string
    flowToken: string
    paidAt: Timestamp | null
    createdAt: Timestamp
```

---

## 🏋️ Sprint 5: Rutinas & Actividades
**Duración estimada:** 3-4 días  
**Objetivo:** Planificador de rutinas y actividades para clientes

### 📦 Tasks
- [ ] Crear tipos para Routine, Activity, Exercise
- [ ] CRUD de plantillas de rutinas
- [ ] Asignar rutina a cliente específico
- [ ] UI: builder de rutinas (drag & drop opcional)
- [ ] Cliente puede ver sus rutinas asignadas
- [ ] Marcar actividades como completadas
- [ ] Progreso y estadísticas básicas
- [ ] Adjuntar videos/imágenes a ejercicios (Firebase Storage)

### ✅ Goals
- ✓ Profesor puede crear plantillas de rutinas
- ✓ Profesor puede asignar rutina personalizada a cliente
- ✓ Cliente ve sus rutinas en su dashboard
- ✓ Cliente puede marcar ejercicios completados
- ✓ UI intuitiva para planificación
- ✓ Imágenes/videos se suben correctamente
- ✓ Validación de permisos en Firestore

### 📁 Archivos esperados
```
src/app/features/routines/
  types.ts
  useRoutines.ts
  RoutineListPage.tsx
  RoutineBuilderPage.tsx
  RoutineViewPage.tsx (cliente)
  ExerciseCard.tsx
src/app/features/activities/
  types.ts
  useActivities.ts
  ActivityTracker.tsx
```

### 🗄️ Colecciones Firestore
```
tenants/{tenantId}/routineTemplates/
  {templateId}/
    name: string
    description: string
    exercises: Exercise[]
    createdBy: string
    isPublic: boolean

tenants/{tenantId}/clientRoutines/
  {routineId}/
    clientId: string
    templateId: string | null
    name: string
    exercises: Exercise[]
    assignedAt: Timestamp
    completedExercises: string[]
    progress: number
```

---

## 🚀 Sprint 6: Dashboard & Analytics
**Duración estimada:** 2-3 días  
**Objetivo:** Dashboard con métricas clave para profesor y cliente

### 📦 Tasks
- [ ] Dashboard profesor: próximas clases, pagos del mes, clientes activos
- [ ] Dashboard cliente: próximas clases, rutinas pendientes, progreso
- [ ] Gráficos básicos (Chart.js o Recharts)
- [ ] Filtros por fecha
- [ ] Exportar reportes (CSV opcional)
- [ ] Notificaciones push (Firebase Cloud Messaging)

### ✅ Goals
- ✓ Profesor ve métricas clave en home
- ✓ Cliente ve su progreso y clases
- ✓ Gráficos cargan rápido (queries optimizadas)
- ✓ Notificaciones push funcionan (recordatorios de clase)
- ✓ UI clara y visualmente atractiva

### 📁 Archivos esperados
```
src/app/features/dashboard/
  InstructorDashboard.tsx
  ClientDashboard.tsx
  MetricsCard.tsx
  ChartComponents.tsx
src/lib/analytics/
  useMetrics.ts
  aggregations.ts
```

---

## 🎨 Sprint 7: UX/UI Polish & Testing
**Duración estimada:** 2-3 días  
**Objetivo:** Pulir experiencia de usuario y testing

### 📦 Tasks
- [ ] Revisar flujos completos (onboarding, booking, payment)
- [ ] Optimizar performance (lazy loading, code splitting)
- [ ] Skeletons y loading states consistentes
- [ ] Dark mode (opcional)
- [ ] Tests unitarios (Vitest) para utils y hooks
- [ ] Tests E2E básicos (Playwright opcional)
- [ ] Accesibilidad (a11y) con axe-core
- [ ] Revisar responsive en todos los breakpoints
- [ ] Manejo de errores global (ErrorBoundary)

### ✅ Goals
- ✓ App fluida en mobile y desktop
- ✓ Todos los estados de loading/error tienen feedback
- ✓ Tests críticos pasan
- ✓ No hay errores de consola
- ✓ Lighthouse score > 90
- ✓ WCAG 2.1 AA compliance básico

---

## 🌐 Sprint 8: Deploy & Production Ready
**Duración estimada:** 1-2 días  
**Objetivo:** Subir a producción en Firebase Hosting

### 📦 Tasks
- [ ] Configurar Firebase proyecto production
- [ ] Migrar variables de entorno
- [ ] Deploy Cloud Functions
- [ ] Deploy Firestore rules y indexes
- [ ] Deploy frontend a Firebase Hosting
- [ ] Configurar dominio custom (opcional)
- [ ] Configurar SSL
- [ ] Monitoring y alertas (Firebase Performance)
- [ ] Documentar proceso de deploy
- [ ] Backup inicial de Firestore

### ✅ Goals
- ✓ App accesible en producción
- ✓ Functions responden correctamente
- ✓ SSL activo
- ✓ Monitoring configurado
- ✓ Rollback plan documentado
- ✓ README actualizado con URLs producción

### 📋 Comandos Deploy
```bash
# Build frontend
npm run build

# Deploy functions
firebase deploy --only functions

# Deploy rules
firebase deploy --only firestore:rules

# Deploy hosting
firebase deploy --only hosting

# Deploy completo
firebase deploy
```

---

## 📊 Resumen de Sprints

| Sprint | Objetivo | Duración | Prioridad |
|--------|----------|----------|-----------|
| 0 | Setup & Arquitectura | 1-2 días | 🔴 Crítico |
| 1 | Auth & Tenant | 3-4 días | 🔴 Crítico |
| 2 | Gestión Clientes | 2-3 días | 🔴 Crítico |
| 3 | Agenda | 4-5 días | 🔴 Crítico |
| 4 | Pagos Flow | 3-4 días | 🟡 Alto |
| 5 | Rutinas | 3-4 días | 🟡 Alto |
| 6 | Dashboard | 2-3 días | 🟢 Medio |
| 7 | UX Polish | 2-3 días | 🟢 Medio |
| 8 | Deploy | 1-2 días | 🔴 Crítico |

**Total estimado:** 21-30 días de desarrollo

---

## 🔄 Metodología de trabajo

### Por cada Sprint:
1. ✅ Validar goals del sprint anterior
2. 📝 Crear branch de feature (`git checkout -b sprint-N/feature-name`)
3. 🔨 Implementar tasks uno por uno
4. ✍️ Commits atómicos con Conventional Commits
5. 🧪 Probar en emulator Firebase
6. 📸 Screenshot o video funcional
7. 🔀 Merge a `main` al completar goals
8. 📋 Actualizar checklist en este documento

### Conventional Commits:
```
feat: agregar login con email/password
fix: corregir validación de horarios
chore: actualizar dependencias
docs: documentar API de pagos
test: agregar tests para useAuth
refactor: modularizar componentes de calendario
```

---

## 📚 Recursos y Referencias

### Documentación oficial:
- [Ionic React](https://ionicframework.com/docs/react)
- [Firebase Auth](https://firebase.google.com/docs/auth)
- [Firestore](https://firebase.google.com/docs/firestore)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Flow API Chile](https://www.flow.cl/docs/api.html)

### Patrones útiles:
- Custom Hooks para lógica reutilizable
- Context API para estado global (Auth, Tenant)
- Compound Components para UI compleja
- Optimistic Updates para mejor UX

---

## ⚠️ Riesgos y Consideraciones

### Técnicos:
- **Firestore Costs:** optimizar queries con índices
- **Cold Start Functions:** usar keep-alive o min instances
- **Flow Sandbox:** validar antes de producción
- **Google Calendar Quota:** manejar rate limits

### UX:
- **Onboarding:** debe ser claro y rápido (< 3 min)
- **Mobile First:** 80% de usuarios en móvil
- **Offline:** considerar Firestore offline persistence
- **Notificaciones:** no spam, solo críticas

### Seguridad:
- **Firestore Rules:** testear con emulator antes de deploy
- **Custom Claims:** validar en backend, no confiar en frontend
- **Secrets:** nunca commitear API keys
- **CORS:** configurar correctamente para Functions

---

## 🎯 Definición de "Done"

Un sprint está completo cuando:
- ✅ Todos los goals marcados como cumplidos
- ✅ Código compila sin warnings críticos
- ✅ Funciona en Firebase Emulator
- ✅ Firestore rules actualizadas y validadas
- ✅ UI responsiva y accesible
- ✅ Commits pusheados a repositorio
- ✅ README actualizado si aplica
- ✅ Screenshot/video de demostración

---

**Última actualización:** 10 de noviembre de 2025  
**Versión:** 1.0  
**Proyecto:** Athlos MVP
