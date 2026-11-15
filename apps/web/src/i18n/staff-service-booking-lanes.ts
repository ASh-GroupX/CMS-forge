export const bookingLaneText = {
  en: {
    title: 'Booking lanes', center: 'Service center', add: 'Add lane', edit: 'Edit lane',
    description: 'Separate appointment capacity inside one service center. Each lane appears as its own timeline column.',
    loading: 'Loading booking lanes', error: 'Could not load booking lanes.', retry: 'Try again',
    empty: 'No booking lanes are configured for this center.', formDescription: 'Set the lane name, color, display order, and capacity limits.',
    nameEn: 'English name', nameAr: 'Arabic name', code: 'Code', color: 'Lane color', position: 'Display order',
    daily: 'Per day', hourly: 'Per hour', slot: 'Per slot', active: 'Active', save: 'Save lane',
    saved: 'Booking lane saved.', conflict: 'This lane changed. Reloaded the latest settings.',
    colors: { slate: 'Slate', blue: 'Blue', green: 'Green', amber: 'Amber', rose: 'Rose', violet: 'Violet' },
  },
  ar: {
    title: 'مسارات الحجز', center: 'مركز الصيانة', add: 'إضافة مسار', edit: 'تعديل المسار',
    description: 'قسّم سعة المواعيد داخل مركز صيانة واحد. يظهر كل مسار كعمود مستقل في الجدول.',
    loading: 'جارٍ تحميل مسارات الحجز', error: 'تعذر تحميل مسارات الحجز.', retry: 'إعادة المحاولة',
    empty: 'لا توجد مسارات حجز معدّة لهذا المركز.', formDescription: 'حدد اسم المسار ولونه وترتيبه وحدود السعة.',
    nameEn: 'الاسم بالإنجليزية', nameAr: 'الاسم بالعربية', code: 'الرمز', color: 'لون المسار', position: 'ترتيب العرض',
    daily: 'في اليوم', hourly: 'في الساعة', slot: 'في الفترة', active: 'نشط', save: 'حفظ المسار',
    saved: 'تم حفظ مسار الحجز.', conflict: 'تم تعديل المسار. حُمّلت أحدث الإعدادات.',
    colors: { slate: 'رمادي', blue: 'أزرق', green: 'أخضر', amber: 'كهرماني', rose: 'وردي', violet: 'بنفسجي' },
  },
} as const;

export const bookingStatusText = {
  en: { BOOKED: 'Booked', CONFIRMED: 'Confirmed', IN_SERVICE: 'In Service', COMPLETED: 'Completed', CANCELLED: 'Cancelled', NO_SHOW: 'No Show' },
  ar: { BOOKED: 'محجوز', CONFIRMED: 'مؤكد', IN_SERVICE: 'قيد الخدمة', COMPLETED: 'مكتمل', CANCELLED: 'ملغي', NO_SHOW: 'لم يحضر' },
} as const;
