import { Resend } from 'resend';
import * as functions from 'firebase-functions';

// Initialize Resend with API key from environment
const resend = new Resend(functions.config().resend?.api_key || process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Athlos <noreply@athlos.app>'; // Cambiar por tu dominio verificado

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailParams): Promise<boolean> => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      return false;
    }

    console.log('✅ Email sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Exception sending email:', error);
    return false;
  }
};

// Email templates
export const emailTemplates = {
  paymentPending: (data: {
    clientName: string;
    instructorName: string;
    sportType: string;
    date: string;
    time: string;
    amount: number;
    bankInfo?: {
      bank: string;
      accountType: string;
      accountNumber: string;
      rut: string;
      name: string;
    };
    mercadoPagoLink?: string;
    paymentLink?: string; // Public payment link
  }) => {
    const { clientName, instructorName, sportType, date, time, amount, bankInfo, mercadoPagoLink, paymentLink } = data;

    const paymentInfo = mercadoPagoLink
      ? `
        <div style="margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; text-align: center;">
          <h3 style="color: white; margin: 0 0 15px 0;">💳 Pagar con Mercado Pago</h3>
          <a href="${mercadoPagoLink}" style="display: inline-block; padding: 12px 30px; background: white; color: #667eea; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Pagar Ahora - $${amount.toLocaleString('es-CL')}
          </a>
        </div>
      `
      : bankInfo
      ? `
        <div style="margin: 30px 0; padding: 20px; background: #f7fafc; border-radius: 12px; border-left: 4px solid #3182ce;">
          <h3 style="color: #2d3748; margin: 0 0 15px 0;">🏦 Datos de Transferencia</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">Banco:</td>
              <td style="padding: 8px 0; color: #2d3748; font-weight: 600;">${bankInfo.bank}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">Tipo de Cuenta:</td>
              <td style="padding: 8px 0; color: #2d3748; font-weight: 600;">${bankInfo.accountType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">Número de Cuenta:</td>
              <td style="padding: 8px 0; color: #2d3748; font-weight: 600;">${bankInfo.accountNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">RUT:</td>
              <td style="padding: 8px 0; color: #2d3748; font-weight: 600;">${bankInfo.rut}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">Titular:</td>
              <td style="padding: 8px 0; color: #2d3748; font-weight: 600;">${bankInfo.name}</td>
            </tr>
          </table>
          <div style="margin-top: 15px; padding: 12px; background: #fff5e6; border-radius: 8px;">
            <p style="margin: 0; color: #d97706; font-size: 14px;">
              ⚠️ Después de realizar la transferencia, sube el comprobante en la app para confirmar tu pago.
            </p>
          </div>
        </div>
      `
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f7fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="text-align: center; padding: 30px 0;">
            <h1 style="margin: 0; color: #2d3748; font-size: 32px;">💪 Athlos</h1>
          </div>

          <!-- Main Card -->
          <div style="background: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <!-- Blue Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h2 style="margin: 0; color: white; font-size: 24px;">Pago Pendiente</h2>
            </div>

            <!-- Content -->
            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #2d3748; line-height: 1.6; margin: 0 0 20px 0;">
                Hola <strong>${clientName}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #2d3748; line-height: 1.6; margin: 0 0 20px 0;">
                Tienes un pago pendiente para tu clase de <strong>${sportType}</strong> con ${instructorName}.
              </p>

              <!-- Class Details -->
              <div style="background: #f7fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #2d3748; font-size: 18px;">📅 Detalles de la Clase</h3>
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #718096;">Fecha:</td>
                    <td style="padding: 8px 0; color: #2d3748; font-weight: 600;">${date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #718096;">Hora:</td>
                    <td style="padding: 8px 0; color: #2d3748; font-weight: 600;">${time}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #718096;">Monto:</td>
                    <td style="padding: 8px 0; color: #10b981; font-weight: 700; font-size: 20px;">$${amount.toLocaleString('es-CL')} CLP</td>
                  </tr>
                </table>
              </div>

              ${paymentInfo}

              <!-- Payment Link Button -->
              ${paymentLink ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${paymentLink}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                  Ver Detalles y Pagar
                </a>
              </div>
              ` : ''}

              <p style="font-size: 14px; color: #718096; line-height: 1.6; margin: 20px 0 0 0;">
                Si tienes alguna pregunta, contacta directamente a ${instructorName}.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Athlos. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  paymentApproved: (data: {
    clientName: string;
    instructorName: string;
    sportType: string;
    date: string;
    amount: number;
  }) => {
    const { clientName, instructorName, sportType, date, amount } = data;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f7fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 30px 0;">
            <h1 style="margin: 0; color: #2d3748; font-size: 32px;">💪 Athlos</h1>
          </div>

          <div style="background: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <div style="font-size: 60px; margin-bottom: 10px;">✅</div>
              <h2 style="margin: 0; color: white; font-size: 24px;">¡Pago Confirmado!</h2>
            </div>

            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #2d3748; line-height: 1.6; margin: 0 0 20px 0;">
                Hola <strong>${clientName}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #2d3748; line-height: 1.6; margin: 0 0 20px 0;">
                Tu pago ha sido <strong style="color: #10b981;">aprobado exitosamente</strong> por ${instructorName}.
              </p>

              <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid #10b981;">
                <h3 style="margin: 0 0 15px 0; color: #2d3748; font-size: 18px;">📋 Resumen</h3>
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #718096;">Clase:</td>
                    <td style="padding: 8px 0; color: #2d3748; font-weight: 600;">${sportType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #718096;">Fecha:</td>
                    <td style="padding: 8px 0; color: #2d3748; font-weight: 600;">${date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #718096;">Monto Pagado:</td>
                    <td style="padding: 8px 0; color: #10b981; font-weight: 700; font-size: 20px;">$${amount.toLocaleString('es-CL')} CLP</td>
                  </tr>
                </table>
              </div>

              <p style="font-size: 16px; color: #2d3748; line-height: 1.6; margin: 20px 0 0 0;">
                ¡Nos vemos en la clase! 💪
              </p>
            </div>
          </div>

          <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Athlos. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  paymentRejected: (data: {
    clientName: string;
    instructorName: string;
    sportType: string;
    date: string;
    reason?: string;
  }) => {
    const { clientName, instructorName, sportType, date, reason } = data;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f7fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 30px 0;">
            <h1 style="margin: 0; color: #2d3748; font-size: 32px;">💪 Athlos</h1>
          </div>

          <div style="background: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
              <div style="font-size: 60px; margin-bottom: 10px;">❌</div>
              <h2 style="margin: 0; color: white; font-size: 24px;">Comprobante Rechazado</h2>
            </div>

            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #2d3748; line-height: 1.6; margin: 0 0 20px 0;">
                Hola <strong>${clientName}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #2d3748; line-height: 1.6; margin: 0 0 20px 0;">
                Tu comprobante de pago para la clase de <strong>${sportType}</strong> del ${date} ha sido rechazado.
              </p>

              ${reason ? `
                <div style="background: #fef2f2; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #ef4444;">
                  <h3 style="margin: 0 0 10px 0; color: #dc2626; font-size: 16px;">Motivo del rechazo:</h3>
                  <p style="margin: 0; color: #7f1d1d; font-size: 14px;">${reason}</p>
                </div>
              ` : ''}

              <div style="background: #fffbeb; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  ⚠️ Por favor, verifica los datos de tu transferencia y sube un nuevo comprobante en la app. 
                  Si tienes dudas, contacta a ${instructorName}.
                </p>
              </div>
            </div>
          </div>

          <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Athlos. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },
};
