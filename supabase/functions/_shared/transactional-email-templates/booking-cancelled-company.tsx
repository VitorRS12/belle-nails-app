/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { EmailLayout } from '../email-templates/_layout.tsx'
import { DetailsTable, Lead, SITE_NAME, SITE_URL, type BookingProps } from './_booking-shared.tsx'
import type { TemplateEntry } from './registry.ts'

const Email = ({
  customerName = '',
  serviceName = '',
  professionalName = '',
  date = '',
  time = '',
}: BookingProps) => (
  <EmailLayout
    siteName={SITE_NAME}
    siteUrl={SITE_URL}
    preview={`${customerName} cancelou um agendamento`}
    eyebrow="Cancelamento de cliente"
    heading="Um horário foi liberado"
    footerNote="Você recebe estes avisos porque é membro desta empresa."
  >
    <Lead>
      A cliente <strong>{customerName}</strong> cancelou o agendamento abaixo. O horário voltou a
      ficar disponível na sua agenda.
    </Lead>
    <DetailsTable
      rows={[
        ['Serviço', serviceName],
        ['Profissional', professionalName],
        ['Data & horário', `${date} · ${time}`],
      ]}
    />
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: (d: Record<string, unknown>) =>
    `Cancelamento — ${d.customerName ?? ''} (${d.date ?? ''} ${d.time ?? ''})`,
  displayName: 'Cancelamento (empresa)',
  previewData: {
    customerName: 'Maria',
    serviceName: 'Pé e mão',
    professionalName: 'Evelyn',
    date: '20/08/2026',
    time: '14:00',
  },
} satisfies TemplateEntry
