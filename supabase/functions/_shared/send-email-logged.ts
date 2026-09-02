// Thin wrapper around the managed send helper that keeps the project's
// `email_send_log` audit table populated (app data — notification history only,
// it never gates a send). Delivery, retries, suppression and unsubscribe are
// handled by Lovable's managed email API.

import {
  sendTemplateEmail,
  type SendTemplateEmailOptions,
  type SendTemplateEmailResult,
} from './transactional-email-templates/send-email.ts'

// deno-lint-ignore no-explicit-any
type AdminClient = any

async function logSend(
  admin: AdminClient,
  row: {
    template_name: string
    recipient_email: string
    status: 'sent' | 'suppressed' | 'failed'
    error_message?: string
  },
) {
  const { error } = await admin.from('email_send_log').insert({
    message_id: null,
    ...row,
  })
  if (error) {
    console.error('email_send_log insert failed', {
      code: error.code,
      message: error.message,
    })
  }
}

export async function sendTemplateEmailLogged(
  admin: AdminClient,
  templateName: string,
  to: string,
  options: SendTemplateEmailOptions = {},
): Promise<SendTemplateEmailResult> {
  try {
    const result = await sendTemplateEmail(templateName, to, options)
    await logSend(admin, {
      template_name: templateName,
      recipient_email: to,
      status: result.sent ? 'sent' : 'suppressed',
    })
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await logSend(admin, {
      template_name: templateName,
      recipient_email: to,
      status: 'failed',
      error_message: message.slice(0, 1000),
    })
    throw error
  }
}
