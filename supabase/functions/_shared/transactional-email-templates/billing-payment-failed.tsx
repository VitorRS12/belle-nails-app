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
  manageUrl = `${SITE_URL}/planos`,
}: BillingProps) => (
  <EmailLayout
    siteName={SITE_NAME}
    siteUrl={SITE_URL}
    preview="Não conseguimos processar sua cobrança"
    eyebrow="Pagamento recusado"
    heading="Não conseguimos processar seu pagamento"
    ctaLabel="Atualizar forma de pagamento"
    ctaUrl={manageUrl}
    footerNote="Você está recebendo este aviso porque tem uma assinatura ativa no Belle Nails."
  >
    <Lead>
      Olá{ownerName ? `, ${ownerName}` : ''}! A cobrança da assinatura de{' '}
      <strong>{companyName || 'sua conta'}</strong> não foi aprovada.
    </Lead>
    <DetailsTable
      rows={[
        ['Plano', planName],
        ['Valor', amount],
        ['Situação', 'Pagamento recusado'],
      ]}
    />
    <Lead>
      Vamos tentar novamente automaticamente nos próximos dias. Para evitar a suspensão do
      acesso, atualize sua forma de pagamento em <strong>Planos</strong>.
    </Lead>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: () => 'Falha no pagamento da sua assinatura Belle Nails',
  displayName: 'Aviso: falha no pagamento',
  previewData: {
    ownerName: 'Evelyn',
    companyName: 'Studio Belle',
    planName: 'Business',
    amount: 'R$ 30,00',
    manageUrl: `${SITE_URL}/planos`,
  },
} satisfies TemplateEntry
