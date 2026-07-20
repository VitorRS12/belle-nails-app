/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { EmailLayout, CodeBlock } from './_layout.tsx'

interface ReauthenticationEmailProps {
  siteName?: string
  token: string
}

export const ReauthenticationEmail = ({
  siteName = 'Belle Nails',
  token,
}: ReauthenticationEmailProps) => (
  <EmailLayout
    siteName={siteName}
    preview={`Seu código de verificação: ${token}`}
    eyebrow="Verificação de segurança"
    heading="Seu código de verificação"
    intro={
      <>
        Use o código abaixo para confirmar uma ação sensível na sua conta do {siteName}. Ele expira em alguns minutos.
      </>
    }
    secondaryNote={
      <>
        Não compartilhe este código com ninguém. Se você não solicitou a verificação, altere sua senha imediatamente.
      </>
    }
  >
    <CodeBlock code={token} />
  </EmailLayout>
)

export default ReauthenticationEmail
