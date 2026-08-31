/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { EmailLayout } from '../email-templates/_layout.tsx'
import { DetailsTable, Lead, SITE_NAME, SITE_URL } from './_booking-shared.tsx'
import type { TemplateEntry } from './registry.ts'
import type { BillingProps } from './billing-trial-ending.tsx'

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
    preview={`Sua assinatura renova em ${daysLeft} dia(s)`}
    eyebrow="Aviso de cobrança"
    heading="Sua assinatura vai renovar em breve"
    ctaLabel="Gerenciar assinatura"
    ctaUrl={manageUrl}
    footerNote="Você está recebendo este aviso porque tem uma assinatura ativa no Belle Nails."
  >
    <Lead>
      Olá{ownerName ? `, ${ownerName}` : ''}! A assinatura de{' '}
      <strong>{companyName || 'sua conta'}</strong> será renovada automaticamente em{' '}
      <strong>{daysLeft} dia(s)</strong>.
    </Lead>
    <DetailsTable
      rows={[
        ['Plano', planName],
        ['Valor', amount],
        ['Data da cobrança', chargeDate],
        ['Renovação', 'Automática, mensal'],
      ]}
    />
    <Lead>
      Não precisa fazer nada para continuar. Para cancelar, acesse <strong>Planos</strong> no
      app antes da data da cobrança.
    </Lead>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: (d: Record<string, unknown>) =>
    `Sua assinatura Belle Nails renova em ${d.daysLeft ?? ''} dia(s)`,
  displayName: 'Aviso: renovação de assinatura',
  previewData: {
    ownerName: 'Evelyn',
    companyName: 'Studio Belle',
    planName: 'Business',
    amount: 'R$ 30,00',
    chargeDate: '30/09/2026',
    daysLeft: 3,
    manageUrl: `${SITE_URL}/planos`,
  },
} satisfies TemplateEntry
