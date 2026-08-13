/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Column, Row, Section, Text } from 'npm:@react-email/components@0.0.22'

export const SITE_NAME = 'Belle Nails'
export const SITE_URL = 'https://bellenailsapp.com'

export interface BookingProps {
  customerName?: string
  companyName?: string
  serviceName?: string
  professionalName?: string
  customerContact?: string
  date?: string
  time?: string
  cancelUrl?: string
}

export const DetailsTable = ({ rows }: { rows: Array<[string, string]> }) => (
  <Section style={box}>
    {rows.map(([label, value], i) => (
      <Row key={label} style={i > 0 ? rowBorder : undefined}>
        <Column style={cellLabel}>{label}</Column>
        <Column style={cellValue}>{value}</Column>
      </Row>
    ))}
  </Section>
)

export const Lead = ({ children }: { children: React.ReactNode }) => (
  <Text style={lead}>{children}</Text>
)

const box = {
  backgroundColor: '#FDF0F3',
  border: '1px solid #F5D9E0',
  borderRadius: '14px',
  padding: '6px 20px',
  margin: '20px 0',
}
const rowBorder = { borderTop: '1px solid #F5D9E0' }
const cellLabel = {
  padding: '12px 0',
  color: '#8B6F78',
  fontSize: '13px',
  letterSpacing: '0.3px',
}
const cellValue = {
  padding: '12px 0',
  textAlign: 'right' as const,
  color: '#3B2028',
  fontWeight: 'bold' as const,
  fontSize: '14px',
}
export const lead = {
  fontSize: '15px',
  color: '#5A404A',
  lineHeight: '1.65',
  margin: '0 0 16px',
}
