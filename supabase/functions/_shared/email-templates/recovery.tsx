/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Redefinir sua senha no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src="https://bellenailsapp.com/favicon.png" alt={siteName} width="56" height="56" style={logo} />
          <Text style={brand}>{siteName}</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>Redefinir sua senha</Heading>
          <Text style={text}>
            Recebemos um pedido para redefinir a senha da sua conta no {siteName}. Clique no botão abaixo para criar uma nova senha:
          </Text>
          <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
            <Button style={button} href={confirmationUrl}>Redefinir senha</Button>
          </Section>
          <Text style={text}>
            Se preferir, cole este link no navegador:
            <br />
            <Link href={confirmationUrl} style={link}>{confirmationUrl}</Link>
          </Text>
          <Text style={footer}>
            Se você não solicitou esta alteração, pode ignorar este email — sua senha permanece a mesma.
          </Text>
        </Section>
        <Hr style={hr} />
        <Text style={smallFooter}>Enviado por {siteName}</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif' }
const container = { padding: '32px 20px', maxWidth: '560px', margin: '0 auto' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { display: 'inline-block', borderRadius: '50%' }
const brand = { fontSize: '20px', fontWeight: 'bold' as const, color: '#C74D6C', margin: '8px 0 0', letterSpacing: '0.5px' }
const card = { backgroundColor: '#FDF7F5', borderRadius: '16px', padding: '32px 28px', border: '1px solid #F3E1E4' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#3B2028', margin: '0 0 16px', textAlign: 'center' as const }
const text = { fontSize: '15px', color: '#5A404A', lineHeight: '1.6', margin: '0 0 16px', wordBreak: 'break-all' as const }
const link = { color: '#C74D6C', textDecoration: 'underline' }
const button = { backgroundColor: '#C74D6C', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '13px', color: '#7A6970', margin: '24px 0 0', lineHeight: '1.5' }
const hr = { borderColor: '#F3E1E4', margin: '24px 0' }
const smallFooter = { fontSize: '12px', color: '#9B8A90', textAlign: 'center' as const, margin: 0 }
