/// <reference types="npm:@types/react@18.3.1" />
import type * as React from 'npm:react@18.3.1'

import { template as bookingConfirmationCustomer } from './booking-confirmation-customer.tsx'
import { template as bookingNewCompany } from './booking-new-company.tsx'
import { template as bookingConfirmedCustomer } from './booking-confirmed-customer.tsx'
import { template as bookingCancelledCustomer } from './booking-cancelled-customer.tsx'
import { template as bookingCancelledCompany } from './booking-cancelled-company.tsx'
import { template as bookingReminderCustomer } from './booking-reminder-customer.tsx'

export interface TemplateEntry {
  // deno-lint-ignore no-explicit-any
  component: React.ComponentType<any>
  // deno-lint-ignore no-explicit-any
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  // deno-lint-ignore no-explicit-any
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'booking-confirmation-customer': bookingConfirmationCustomer,
  'booking-new-company': bookingNewCompany,
  'booking-confirmed-customer': bookingConfirmedCustomer,
  'booking-cancelled-customer': bookingCancelledCustomer,
  'booking-cancelled-company': bookingCancelledCompany,
  'booking-reminder-customer': bookingReminderCustomer,
}
