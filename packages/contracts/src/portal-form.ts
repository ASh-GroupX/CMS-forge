export type PortalFieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'brand' | 'model' | 'file';
export type PortalField = { key: string; labelEn: string; labelAr: string; type: PortalFieldType; required: boolean; enabled: boolean; options?: { value: string; labelEn: string; labelAr: string }[] };
export type BookingCarOption = { id: string; brand: string; nameEn: string; nameAr: string };
export type PortalForm = { version: number | null; fields: PortalField[] };
export type PortalAnswer = string | number | boolean | null;
export const defaultPortalFields: PortalField[] = [
  { key: 'customerName', labelEn: 'Customer name', labelAr: 'اسم العميل', type: 'text', required: true, enabled: true },
  { key: 'customerPhone', labelEn: 'Customer phone', labelAr: 'هاتف العميل', type: 'text', required: true, enabled: true },
  { key: 'vehicleBrand', labelEn: 'Car make', labelAr: 'ماركة السيارة', type: 'brand', required: true, enabled: true },
  { key: 'vehicleModel', labelEn: 'Car model', labelAr: 'موديل السيارة', type: 'model', required: true, enabled: true },
  { key: 'vehicleVin', labelEn: 'Vehicle VIN', labelAr: 'رقم هيكل المركبة', type: 'text', required: true, enabled: true },
  { key: 'odometer', labelEn: 'Odometer (km)', labelAr: 'عداد المسافة (كم)', type: 'number', required: false, enabled: true },
  { key: 'incidentAt', labelEn: 'Incident date', labelAr: 'تاريخ الواقعة', type: 'date', required: true, enabled: true },
  { key: 'description', labelEn: 'What happened?', labelAr: 'تفاصيل ما حدث', type: 'textarea', required: true, enabled: true },
  { key: 'attachments', labelEn: 'Supporting files', labelAr: 'المرفقات', type: 'file', required: false, enabled: true },
];
