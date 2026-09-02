/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { EmailLayout, InfoBox } from './_layout.tsx'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <EmailLayout
    siteName={siteName}
    siteUrl={siteUrl}
    preview={`Você foi convidada para o ${siteName}`}
    eyebrow="Convite especial"
    heading="Você foi convidada 💗"
    intro={
      <>
        Uma pessoa da equipe convidou você para participar do {siteName}. Aceite abaixo para criar sua conta e começar a atender.
      </>
    }
    ctaLabel="Aceitar convite"
    ctaUrl={confirmationUrl}
    secondaryNote={
      <>
        Se você não esperava esse convite, pode simplesmente ignorar este email.
      </>
    }
  >
    <InfoBox>
      Ao aceitar, você terá acesso à agenda, aos clientes e aos serviços da empresa que te convidou.
    </InfoBox>
  </EmailLayout>
)

export default InviteEmail
