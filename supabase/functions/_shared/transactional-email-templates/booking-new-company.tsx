/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { EmailLayout } from '../email-templates/_layout.tsx'
import { DetailsTable, Lead, SITE_NAME, SITE_URL, type BookingProps } from './_booking-shared.tsx'
import type { TemplateEntry } from './registry.ts'

const Email = ({
  customerName = '',
  customerContact = '',
  serviceName = '',
  professionalName = '',
  date = '',
  time = '',
}: BookingProps) => (
  <EmailLayout
    siteName={SITE_NAME}
    siteUrl={SITE_URL}
    preview={`Novo agendamento de ${customerName}`}
    eyebrow="Novo pedido"
    heading="Um novo agendamento chegou"
    footerNote="Você recebe estes avisos porque é membro desta empresa."
  >
    <Lead>
      <strong>{customerName}</strong> pediu um horário e está aguardando sua confirmação.
    </Lead>
    <DetailsTable
      rows={[
        ['Cliente', customerName],
        ['Contato', customerContact],
        ['Serviço', serviceName],
        ['Profissional', professionalName],
        ['Quando', `${date} · ${time}`],
      ]}
    />
    <Lead>Abra o painel do Belle Nails para confirmar, remarcar ou recusar.</Lead>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: (d: Record<string, unknown>) =>
    `Novo agendamento — ${d.customerName ?? ''} (${d.date ?? ''} ${d.time ?? ''})`,
  displayName: 'Novo agendamento (empresa)',
  previewData: {
    customerName: 'Maria',
    customerContact: 'maria@exemplo.com',
    serviceName: 'Pé e mão',
    professionalName: 'Evelyn',
    date: '20/08/2026',
    time: '14:00',
  },
} satisfies TemplateEntry
