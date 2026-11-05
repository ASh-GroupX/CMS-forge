import React, { useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { PhoneRuleField } from '../../src/app/(staff)/internal-tickets/new/phone-rule-field';
import { AddCustomFieldForm } from '../../src/app/(staff)/admin/internal-tickets/add-custom-field-form';

export function TicketPhoneFixture({ locale = 'en' }: { locale?: 'en' | 'ar' }) {
  const [value, setValue] = useState('');
  const [accepted, setAccepted] = useState(false);
  return <main dir={locale === 'ar' ? 'rtl' : 'ltr'} className="mx-auto max-w-2xl space-y-6 p-6">
    <PhoneRuleField isAr={locale === 'ar'} value={value} onChange={setValue} onAcknowledge={setAccepted}
      field={{ id: 'phone-field', departmentId: 'dept-1', nameEn: 'Customer phone number', nameAr: 'رقم هاتف العميل', fieldType: 'TEXT', options: [], placeholderEn: null, placeholderAr: null, isRequired: true, isActive: true, phoneDuplicateCheck: true, order: 0 }} />
    <output data-testid="acknowledgement">{String(accepted)}</output>
    <AddCustomFieldForm departmentId="dept-1" onSuccess={() => {}} onCancel={() => {}} />
  </main>;
}
if (typeof document !== 'undefined') hydrateRoot(document.getElementById('root')!, <TicketPhoneFixture locale={document.documentElement.lang === 'ar' ? 'ar' : 'en'} />);
