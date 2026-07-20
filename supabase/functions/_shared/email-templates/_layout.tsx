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

interface EmailLayoutProps {
  siteName: string
  siteUrl?: string
  preview: string
  eyebrow?: string
  heading: string
  intro?: React.ReactNode
  children?: React.ReactNode
  ctaLabel?: string
  ctaUrl?: string
  secondaryNote?: React.ReactNode
  footerNote?: React.ReactNode
}

export const EmailLayout = ({
  siteName,
  siteUrl,
  preview,
  eyebrow,
  heading,
  intro,
  children,
  ctaLabel,
  ctaUrl,
  secondaryNote,
  footerNote,
}: EmailLayoutProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={outer}>
        {/* Hero band */}
        <Section style={hero}>
          <Img
            src="https://bellenailsapp.com/favicon.png"
            alt={siteName}
            width="52"
            height="52"
            style={logo}
          />
          <Text style={brand}>{siteName}</Text>
          <Text style={tagline}>Beleza que cuida de você</Text>
        </Section>

        {/* Content card */}
        <Section style={card}>
          {eyebrow ? <Text style={eyebrowStyle}>{eyebrow}</Text> : null}
          <Heading style={h1}>{heading}</Heading>

          {intro ? <Text style={lead}>{intro}</Text> : null}

          {children}

          {ctaLabel && ctaUrl ? (
            <>
              <Section style={{ textAlign: 'center' as const, margin: '32px 0 12px' }}>
                <Button style={button} href={ctaUrl}>
                  {ctaLabel}
                </Button>
              </Section>
              <Text style={fallback}>
                Se o botão não funcionar, copie e cole este link no navegador:
              </Text>
              <Text style={fallbackLink}>
                <Link href={ctaUrl} style={link}>{ctaUrl}</Link>
              </Text>
            </>
          ) : null}

          {secondaryNote ? (
            <>
              <Hr style={hrSoft} />
              <Text style={muted}>{secondaryNote}</Text>
            </>
          ) : null}
        </Section>

        {/* Footer */}
        <Section style={footerSection}>
          <Text style={signature}>Com carinho, equipe {siteName} 💗</Text>
          {footerNote ? <Text style={footerText}>{footerNote}</Text> : null}
          {siteUrl ? (
            <Text style={footerText}>
              <Link href={siteUrl} style={footerLink}>{siteUrl.replace(/^https?:\/\//, '')}</Link>
            </Text>
          ) : null}
          <Text style={legal}>
            Você recebeu este email porque tem uma conta em {siteName}.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default EmailLayout

/* ---------- Design tokens (Cherry Blossom) ---------- */

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  margin: 0,
  padding: '24px 0',
}

const outer = {
  maxWidth: '580px',
  margin: '0 auto',
  padding: '0 16px',
}

/* Hero */
const hero = {
  background: 'linear-gradient(135deg, #FFF1F4 0%, #FCE4EC 45%, #F8BBD0 100%)',
  borderRadius: '24px 24px 0 0',
  padding: '36px 24px 28px',
  textAlign: 'center' as const,
}
const logo = {
  display: 'inline-block',
  borderRadius: '50%',
  border: '3px solid #ffffff',
  boxShadow: '0 4px 12px rgba(199, 77, 108, 0.18)',
}
const brand = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#8E2E4A',
  margin: '12px 0 4px',
  letterSpacing: '0.6px',
}
const tagline = {
  fontSize: '12px',
  color: '#B76B82',
  margin: 0,
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
}

/* Card */
const card = {
  backgroundColor: '#FFFAFB',
  border: '1px solid #F5D9E0',
  borderTop: 'none',
  borderRadius: '0 0 24px 24px',
  padding: '36px 32px 32px',
}
const eyebrowStyle = {
  fontSize: '11px',
  fontWeight: 'bold' as const,
  color: '#C74D6C',
  margin: '0 0 8px',
  letterSpacing: '2.5px',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
}
const h1 = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: '26px',
  fontWeight: 'bold' as const,
  color: '#3B2028',
  margin: '0 0 20px',
  textAlign: 'center' as const,
  lineHeight: '1.25',
}
const lead = {
  fontSize: '15px',
  color: '#5A404A',
  lineHeight: '1.65',
  margin: '0 0 16px',
}
const button = {
  background: 'linear-gradient(135deg, #C74D6C 0%, #9E3556 100%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '999px',
  padding: '14px 32px',
  textDecoration: 'none',
  display: 'inline-block',
  boxShadow: '0 6px 16px rgba(199, 77, 108, 0.28)',
  letterSpacing: '0.3px',
}
const link = { color: '#C74D6C', textDecoration: 'underline', wordBreak: 'break-all' as const }
const fallback = {
  fontSize: '12px',
  color: '#8B6F78',
  margin: '18px 0 4px',
  textAlign: 'center' as const,
}
const fallbackLink = {
  fontSize: '12px',
  margin: 0,
  textAlign: 'center' as const,
  wordBreak: 'break-all' as const,
}
const hrSoft = { borderColor: '#F3E1E4', margin: '24px 0 16px' }
const muted = { fontSize: '13px', color: '#7A6970', lineHeight: '1.6', margin: 0 }

/* Footer */
const footerSection = { padding: '24px 16px 8px', textAlign: 'center' as const }
const signature = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: '14px',
  color: '#8E2E4A',
  margin: '0 0 12px',
  fontStyle: 'italic' as const,
}
const footerText = { fontSize: '12px', color: '#9B8A90', margin: '0 0 4px' }
const footerLink = { color: '#C74D6C', textDecoration: 'none' }
const legal = { fontSize: '11px', color: '#B7A9AE', margin: '12px 0 0' }

/* Shared subcomponents for reuse in templates */
export const InfoBox = ({ children }: { children: React.ReactNode }) => (
  <Section style={{
    backgroundColor: '#FDF0F3',
    border: '1px solid #F5D9E0',
    borderRadius: '12px',
    padding: '16px 20px',
    margin: '20px 0',
  }}>
    <Text style={{ fontSize: '14px', color: '#5A404A', margin: 0, lineHeight: '1.6' }}>
      {children}
    </Text>
  </Section>
)

export const CodeBlock = ({ code }: { code: string }) => (
  <Section style={{ textAlign: 'center' as const, margin: '28px 0' }}>
    <Text style={{
      display: 'inline-block',
      fontFamily: '"SF Mono", Menlo, Consolas, monospace',
      fontSize: '30px',
      fontWeight: 'bold' as const,
      letterSpacing: '10px',
      color: '#8E2E4A',
      backgroundColor: '#FFF1F4',
      border: '2px dashed #E88AAB',
      borderRadius: '14px',
      padding: '18px 28px',
      margin: 0,
    }}>
      {code}
    </Text>
  </Section>
)
