/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { EmailLayout } from '../email-templates/_layout.tsx'
import { DetailsTable, Lead, SITE_NAME, SITE_URL } from './_booking-shared.tsx'
import type { TemplateEntry } from './registry.ts'

export interface BillingProps {
  ownerName?: string
  companyName?: string
  planName?: string
  amount?: string
  chargeDate?: string
  daysLeft?: number | string
  manageUrl?: string
}

const Email = ({
  ownerName = '',
  companyName = '',
  planName = '',
  amount = '',
  chargeDate = '',
  daysLeft = '',
  manageUrl = `${SITE_URL}/planos`,
}: BillingProps) => (
  <EmailLayout
    siteName={SITE_NAME}
    siteUrl={SITE_URL}
    preview={`Seu período de teste termina em ${daysLeft} dia(s)`}
    eyebrow="Aviso de cobrança"
    heading="Seu período de teste está terminando"
    ctaLabel="Ver planos e pagamento"
    ctaUrl={manageUrl}
    footerNote="Você está recebendo este aviso porque tem uma assinatura ativa no Belle Nails."
  >
    <Lead>
      Olá{ownerName ? `, ${ownerName}` : ''}! O período de teste de{' '}
      <strong>{companyName || 'sua conta'}</strong> termina em{' '}
      <strong>{daysLeft} dia(s)</strong>. Depois disso, a cobrança automática do plano
      começa na data abaixo.
    </Lead>
    <DetailsTable
      rows={[
        ['Plano', planName],
        ['Valor', amount],
        ['Primeira cobrança', chargeDate],
        ['Renovação', 'Automática, mensal'],
      ]}
    />
    <Lead>
      Se não quiser continuar, cancele antes dessa data em <strong>Planos</strong> dentro do
      app — nenhuma cobrança será feita.
    </Lead>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: (d: Record<string, unknown>) =>
    `Seu teste termina em ${d.daysLeft ?? ''} dia(s) — cobrança automática a seguir`,
  displayName: 'Aviso: fim do período de teste',
  previewData: {
    ownerName: 'Evelyn',
    companyName: 'Studio Belle',
    planName: 'Starter',
    amount: 'R$ 30,00',
    chargeDate: '30/09/2026',
    daysLeft: 7,
    manageUrl: `${SITE_URL}/planos`,
  },
} satisfies TemplateEntry
