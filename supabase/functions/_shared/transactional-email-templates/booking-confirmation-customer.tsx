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
    preview={`Recebemos seu agendamento em ${companyName}`}
    eyebrow="Agendamento recebido"
    heading={`Olá, ${customerName} ✨`}
    ctaLabel={cancelUrl ? 'Cancelar agendamento' : undefined}
    ctaUrl={cancelUrl}
  >
    <Lead>
      Recebemos seu pedido em <strong>{companyName}</strong>. Ele já entrou na agenda e está
      aguardando a confirmação da profissional.
    </Lead>
    <DetailsTable
      rows={[
        ['Serviço', serviceName],
        ['Profissional', professionalName],
        ['Data & horário', `${date} · ${time}`],
      ]}
    />
    <Lead>Assim que for confirmado você recebe um novo email — pode deixar com a gente.</Lead>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: (d: Record<string, unknown>) => `Recebemos seu agendamento — ${d.companyName ?? SITE_NAME}`,
  displayName: 'Agendamento recebido (cliente)',
  previewData: {
    customerName: 'Maria',
    companyName: 'Studio Belle',
    serviceName: 'Pé e mão',
    professionalName: 'Evelyn',
    date: '20/08/2026',
    time: '14:00',
    cancelUrl: 'https://bellenailsapp.com/cancelar-agendamento?token=demo',
  },
} satisfies TemplateEntry
