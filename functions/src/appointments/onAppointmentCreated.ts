import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { sendEmail, emailTemplates } from '../emails/emailService';

/**
 * Triggered when a new appointment is created
 * Automatically creates a payment record and sends email to client
 */
export const onAppointmentCreated = onDocumentCreated(
  'tenants/{tenantId}/appointments/{appointmentId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const { tenantId, appointmentId } = event.params;
    const appointment = snapshot.data();

    console.log('📅 New appointment created:', appointmentId);

    try {
      // Get client info (with email)
      const clientDoc = await admin
        .firestore()
        .collection('tenants')
        .doc(tenantId)
        .collection('clients')
        .doc(appointment.clientId)
        .get();

      if (!clientDoc.exists) {
        console.error('❌ Client not found:', appointment.clientId);
        return;
      }

      const client = clientDoc.data()!;

      if (!client.email) {
        console.error('❌ Client has no email:', appointment.clientId);
        return;
      }

      // Get payment config to calculate price
      const configSnapshot = await admin
        .firestore()
        .collection('tenants')
        .doc(tenantId)
        .collection('paymentConfig')
        .limit(1)
        .get();

      if (configSnapshot.empty) {
        console.log('⚠️ No payment config found, skipping payment creation');
        return;
      }

      const config = configSnapshot.docs[0].data();

      // Calculate price based on sport, duration, and time
      const pricing = config.pricing?.[appointment.sportType];
      if (!pricing || !pricing.timeSlots || pricing.timeSlots.length === 0) {
        console.log('⚠️ No pricing found for sport:', appointment.sportType);
        return;
      }

      // Find matching time slot
      const appointmentTime = appointment.startTime; // HH:mm format
      let matchedPrice = 0;

      for (const slot of pricing.timeSlots) {
        if (appointmentTime >= slot.startTime && appointmentTime < slot.endTime) {
          matchedPrice = slot.prices[appointment.duration] || 0;
          break;
        }
      }

      if (matchedPrice === 0) {
        console.log('⚠️ No price found for duration:', appointment.duration);
        return;
      }

      // Generate unique payment token
      const paymentToken = admin.firestore().collection('_').doc().id;

      // Create payment record
      const paymentData = {
        tenantId,
        appointmentId,
        clientId: appointment.clientId,
        clientName: appointment.clientName || client.name || 'Cliente',
        amount: matchedPrice,
        currency: 'CLP',
        provider: config.provider || 'manual',
        method: 'transfer',
        status: 'pending',
        paymentToken, // Unique token for public access
        proofUrl: null,
        proofStatus: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const paymentRef = await admin
        .firestore()
        .collection('tenants')
        .doc(tenantId)
        .collection('payments')
        .add(paymentData);

      console.log('💳 Payment created:', paymentRef.id);

      // Get instructor info
      const instructorDoc = await admin
        .firestore()
        .collection('users')
        .doc(appointment.instructorId)
        .get();

      const instructor = instructorDoc.data();

      // Format date and time
      const appointmentDate = appointment.startTime.toDate
        ? appointment.startTime.toDate()
        : new Date(appointment.date + 'T' + appointment.startTime);

      const date = appointmentDate.toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const time = appointment.startTime;

      // Generate payment link
      const paymentLink = `${process.env.APP_URL || 'http://localhost:5173'}/payment/${paymentToken}`;

      // Send email with payment link
      const emailHtml = emailTemplates.paymentPending({
        clientName: client.name || 'Cliente',
        instructorName: instructor?.displayName || 'Instructor',
        sportType: appointment.sportType || 'Clase',
        date,
        time,
        amount: matchedPrice,
        bankInfo: config.provider === 'manual' ? config.bankInfo : undefined,
        paymentLink, // Add payment link to email
      });

      await sendEmail({
        to: client.email,
        subject: `🎯 Nueva Clase Confirmada - ${appointment.sportType || 'Clase'}`,
        html: emailHtml,
      });

      console.log('✅ Payment notification sent to:', client.email);
    } catch (error) {
      console.error('❌ Error in onAppointmentCreated:', error);
      // Don't throw - we don't want to fail the appointment creation
    }
  }
);
