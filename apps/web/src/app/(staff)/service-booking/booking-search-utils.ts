import type { ServiceAppointment } from '../../../lib/staff-service-bookings-api';

const latinDigits = (value: string) => value.replace(/[٠-٩۰-۹]/g, (digit) => {
  const code = digit.charCodeAt(0);
  return String(code >= 0x6f0 ? code - 0x6f0 : code - 0x660);
});

export function findBookings(appointments: ServiceAppointment[], query: string) {
  const text = latinDigits(query.normalize('NFKC')).trim().toLocaleLowerCase();
  if (text.length < 2) return [];
  const digits = text.replace(/\D/g, '');
  return appointments.filter((appointment) => {
    const phone = latinDigits(appointment.customerPhone).replace(/\D/g, '');
    return appointment.customerName.normalize('NFKC').toLocaleLowerCase().includes(text) ||
      (digits.length >= 2 && (phone.includes(digits) ||
        (digits.length >= 7 && digits.startsWith('0') && phone.endsWith(digits.slice(1)))));
  }).sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
}
