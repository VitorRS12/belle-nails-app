/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { EmailLayout } from './_layout.tsx'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <EmailLayout
    siteName={siteName}
    preview={`Seu link de acesso ao ${siteName}`}
    eyebrow="Acesso rápido"
    heading="Entre com um clique"
    intro={
      <>
        Recebemos um pedido para entrar no {siteName}. Use o botão abaixo — nenhum senha necessária. O link é único e válido por tempo limitado.
      </>
    }
    ctaLabel="Entrar na minha conta"
    ctaUrl={confirmationUrl}
    secondaryNote={
      <>
        Se você não solicitou este acesso, pode ignorar este email com segurança.
      </>
    }
  />
)

export default MagicLinkEmail
