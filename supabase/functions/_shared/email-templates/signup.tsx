/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { EmailLayout, InfoBox } from './_layout.tsx'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <EmailLayout
    siteName={siteName}
    siteUrl={siteUrl}
    preview={`Confirme seu email para começar a usar o ${siteName}`}
    eyebrow="Bem-vinda"
    heading={`Que bom ter você no ${siteName}`}
    intro={
      <>
        Estamos felizes em receber você! Falta só um passinho para começar a organizar seus atendimentos, clientes e agenda em um só lugar.
      </>
    }
    ctaLabel="Confirmar meu email"
    ctaUrl={confirmationUrl}
    secondaryNote={
      <>
        Este link confirma o email <strong>{recipient}</strong>. Se você não criou uma conta, pode ignorar esta mensagem — nada será ativado.
      </>
    }
  >
    <InfoBox>
      ✨ Após confirmar, você terá acesso a agenda inteligente, lembretes automáticos e página pública de agendamentos.
    </InfoBox>
  </EmailLayout>
)

export default SignupEmail
