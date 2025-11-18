import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { sendEmail, emailTemplates } from '../emails/emailService';

/**
 * Triggered when a new payment is created
 * Sends email notification to client with payment details
 */
export const sendPaymentNotification = onDocumentCreated(
  'tenants/{tenantId}/payments/{paymentId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const { tenantId } = event.params;
    const payment = snapshot.data();

    console.log('📧 Sending payment notification for payment:', event.params.paymentId);

    try {
      // Get client info
      const clientDoc = await admin
        .firestore()
        .collection('users')
        .doc(payment.clientId)
        .get();

      if (!clientDoc.exists) {
        console.error('❌ Client not found:', payment.clientId);
        return;
      }

      const client = clientDoc.data()!;

      // Get appointment info
      const appointmentDoc = await admin
        .firestore()
        .collection('tenants')
        .doc(tenantId)
        .collection('appointments')
        .doc(payment.appointmentId)
        .get();

      if (!appointmentDoc.exists) {
        console.error('❌ Appointment not found:', payment.appointmentId);
        return;
      }

      const appointment = appointmentDoc.data()!;

      // Get payment config (for bank info or MP link)
      const configSnapshot = await admin
        .firestore()
        .collection('tenants')
        .doc(tenantId)
        .collection('paymentConfig')
        .limit(1)
        .get();

      if (configSnapshot.empty) {
        console.error('❌ Payment config not found for tenant:', tenantId);
        return;
      }

      const config = configSnapshot.docs[0].data();

      // Get instructor info
      const instructorDoc = await admin
        .firestore()
        .collection('users')
        .doc(appointment.instructorId)
        .get();

      const instructor = instructorDoc.data();

      // Format date and time
      const appointmentDate = appointment.startTime.toDate();
      const date = appointmentDate.toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const time = appointmentDate.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Send email
      const emailHtml = emailTemplates.paymentPending({
        clientName: client.displayName || 'Cliente',
        instructorName: instructor?.displayName || 'Instructor',
        sportType: appointment.sportType || 'Clase',
        date,
        time,
        amount: payment.amount,
        bankInfo: config.provider === 'manual' ? config.bankInfo : undefined,
        mercadoPagoLink: payment.mercadoPagoLink || undefined,
      });

      await sendEmail({
        to: client.email,
        subject: `💰 Pago Pendiente - ${appointment.sportType || 'Clase'}`,
        html: emailHtml,
      });

      console.log('✅ Payment notification sent successfully to:', client.email);
    } catch (error) {
      console.error('❌ Error sending payment notification:', error);
      throw error;
    }
  }
);

/**
 * Triggered when a payment status is updated
 * Sends email notification when payment is approved or rejected
 */
export const onPaymentStatusChange = onDocumentUpdated(
  'tenants/{tenantId}/payments/{paymentId}',
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    const { tenantId } = event.params;

    // Check if proof status changed
    if (before.proofStatus === after.proofStatus) {
      return; // No status change, skip
    }

    console.log(
      `📧 Payment status changed from ${before.proofStatus} to ${after.proofStatus}`
    );

    try {
      // Get client info
      const clientDoc = await admin
        .firestore()
        .collection('users')
        .doc(after.clientId)
        .get();

      if (!clientDoc.exists) {
        console.error('❌ Client not found:', after.clientId);
        return;
      }

      const client = clientDoc.data()!;

      // Get appointment info
      const appointmentDoc = await admin
        .firestore()
        .collection('tenants')
        .doc(tenantId)
        .collection('appointments')
        .doc(after.appointmentId)
        .get();

      if (!appointmentDoc.exists) {
        console.error('❌ Appointment not found:', after.appointmentId);
        return;
      }

      const appointment = appointmentDoc.data()!;

      // Get instructor info
      const instructorDoc = await admin
        .firestore()
        .collection('users')
        .doc(appointment.instructorId)
        .get();

      const instructor = instructorDoc.data();

      // Format date
      const appointmentDate = appointment.startTime.toDate();
      const date = appointmentDate.toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      let emailHtml: string;
      let subject: string;

      if (after.proofStatus === 'approved') {
        // Payment approved
        emailHtml = emailTemplates.paymentApproved({
          clientName: client.displayName || 'Cliente',
          instructorName: instructor?.displayName || 'Instructor',
          sportType: appointment.sportType || 'Clase',
          date,
          amount: after.amount,
        });
        subject = `✅ Pago Confirmado - ${appointment.sportType || 'Clase'}`;
      } else if (after.proofStatus === 'rejected') {
        // Payment rejected
        emailHtml = emailTemplates.paymentRejected({
          clientName: client.displayName || 'Cliente',
          instructorName: instructor?.displayName || 'Instructor',
          sportType: appointment.sportType || 'Clase',
          date,
          reason: after.rejectionReason,
        });
        subject = `❌ Comprobante Rechazado - ${appointment.sportType || 'Clase'}`;
      } else {
        return; // Unknown status
      }

      await sendEmail({
        to: client.email,
        subject,
        html: emailHtml,
      });

      console.log('✅ Status change notification sent to:', client.email);
    } catch (error) {
      console.error('❌ Error sending status change notification:', error);
      throw error;
    }
  }
);
