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
}: BookingProps) => (
  <EmailLayout
    siteName={SITE_NAME}
    siteUrl={SITE_URL}
    preview={`Seu agendamento em ${companyName} foi cancelado`}
    eyebrow="Agendamento cancelado"
    heading={`Olá, ${customerName}`}
  >
    <Lead>
      Seu agendamento em <strong>{companyName}</strong> foi cancelado.
    </Lead>
    <DetailsTable
      rows={[
        ['Serviço', serviceName],
        ['Profissional', professionalName],
        ['Data & horário', `${date} · ${time}`],
      ]}
    />
    <Lead>
      Sempre que quiser voltar, é só acessar nossa página de agendamentos para escolher um novo
      horário. Vamos adorar te receber. ✨
    </Lead>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: (d: Record<string, unknown>) => `Agendamento cancelado — ${d.companyName ?? SITE_NAME}`,
  displayName: 'Agendamento cancelado (cliente)',
  previewData: {
    customerName: 'Maria',
    companyName: 'Studio Belle',
    serviceName: 'Pé e mão',
    professionalName: 'Evelyn',
    date: '20/08/2026',
    time: '14:00',
  },
} satisfies TemplateEntry
