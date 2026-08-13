/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { EmailLayout } from '../email-templates/_layout.tsx'
import { DetailsTable, Lead, SITE_NAME, SITE_URL, type BookingProps } from './_booking-shared.tsx'
import type { TemplateEntry } from './registry.ts'

const Email = ({
  customerName = '',
  companyName = '',
  serviceName = '',
  professionalName = '',
  date = '',
  time = '',
  cancelUrl,
}: BookingProps) => (
  <EmailLayout
    siteName={SITE_NAME}
    siteUrl={SITE_URL}
    preview={`Lembrete do seu horário em ${companyName}`}
    eyebrow="Seu horário está chegando"
    heading={`Está chegando: ${serviceName || 'seu atendimento'} ✨`}
    ctaLabel={cancelUrl ? 'Preciso cancelar' : undefined}
    ctaUrl={cancelUrl}
  >
    <Lead>
      Olá, {customerName}! Passamos rapidinho para lembrar do seu agendamento em{' '}
      <strong>{companyName}</strong>.
    </Lead>
    <DetailsTable
      rows={[
        ['Serviço', serviceName],
        ['Profissional', professionalName],
        ['Data & horário', `${date} · ${time}`],
      ]}
    />
    <Lead>Nos vemos em breve.</Lead>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: (d: Record<string, unknown>) =>
    `Lembrete: ${d.serviceName ?? 'seu atendimento'} em ${d.date ?? ''}`.trim(),
  displayName: 'Lembrete de agendamento (cliente)',
  previewData: {
    customerName: 'Maria',
    companyName: 'Studio Belle',
    serviceName: 'Pé e mão',
    professionalName: 'Evelyn',
    date: '20/08/2026',
    time: '14:00',
  },
} satisfies TemplateEntry
