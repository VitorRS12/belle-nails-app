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
    preview={`Seu agendamento em ${companyName} está confirmado`}
    eyebrow="Está confirmado"
    heading={`Tudo certo, ${customerName} 💗`}
    ctaLabel={cancelUrl ? 'Preciso cancelar' : undefined}
    ctaUrl={cancelUrl}
  >
    <Lead>
      Sua profissional confirmou seu agendamento em <strong>{companyName}</strong>. Já pode marcar
      na agenda!
    </Lead>
    <DetailsTable
      rows={[
        ['Serviço', serviceName],
        ['Profissional', professionalName],
        ['Data & horário', `${date} · ${time}`],
      ]}
    />
    <Lead>Te esperamos com muito carinho.</Lead>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: (d: Record<string, unknown>) => `Agendamento confirmado — ${d.companyName ?? SITE_NAME}`,
  displayName: 'Agendamento confirmado (cliente)',
  previewData: {
    customerName: 'Maria',
    companyName: 'Studio Belle',
    serviceName: 'Pé e mão',
    professionalName: 'Evelyn',
    date: '20/08/2026',
    time: '14:00',
  },
} satisfies TemplateEntry
