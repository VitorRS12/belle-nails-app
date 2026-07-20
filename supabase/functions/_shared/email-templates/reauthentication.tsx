/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  siteName?: string
  token: string
}

export const ReauthenticationEmail = ({ siteName = 'Belle Nails', token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação: {token}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src="https://bellenailsapp.com/favicon.png" alt={siteName} width="56" height="56" style={logo} />
          <Text style={brand}>{siteName}</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>Código de verificação</Heading>
          <Text style={text}>
            Use o código abaixo para concluir a verificação da sua conta:
          </Text>
          <Section style={{ textAlign: 'center' as const, margin: '28px 0' }}>
            <Text style={code}>{token}</Text>
          </Section>
          <Text style={footer}>
            Este código expira em alguns minutos. Se você não solicitou, ignore este email.
          </Text>
        </Section>
        <Hr style={hr} />
        <Text style={smallFooter}>Enviado por {siteName}</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif' }
const container = { padding: '32px 20px', maxWidth: '560px', margin: '0 auto' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { display: 'inline-block', borderRadius: '50%' }
const brand = { fontSize: '20px', fontWeight: 'bold' as const, color: '#C74D6C', margin: '8px 0 0', letterSpacing: '0.5px' }
const card = { backgroundColor: '#FDF7F5', borderRadius: '16px', padding: '32px 28px', border: '1px solid #F3E1E4' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#3B2028', margin: '0 0 16px', textAlign: 'center' as const }
const text = { fontSize: '15px', color: '#5A404A', lineHeight: '1.6', margin: '0 0 16px' }
const code = { fontSize: '36px', fontWeight: 'bold' as const, color: '#C74D6C', letterSpacing: '10px', margin: 0 }
const footer = { fontSize: '13px', color: '#7A6970', margin: '24px 0 0', lineHeight: '1.5', textAlign: 'center' as const }
const hr = { borderColor: '#F3E1E4', margin: '24px 0' }
const smallFooter = { fontSize: '12px', color: '#9B8A90', textAlign: 'center' as const, margin: 0 }
