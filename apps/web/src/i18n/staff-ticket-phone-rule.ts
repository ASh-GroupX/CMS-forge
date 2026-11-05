export const ticketPhoneRuleText = {
  en: {
    hint: 'Include the country code, for example +962790000000.',
    checking: 'Checking existing tickets…', failed: 'Could not check existing tickets. Try again.', retry: 'Check again',
    duplicate: 'This phone number is already used on an existing ticket.',
    followUp: 'Open an existing ticket to add a follow-up in its notes, or create another ticket for a different problem.',
    open: 'Open ticket', separate: 'Different problem — create another ticket', confirmed: 'Separate ticket confirmed for this problem.',
    noMatches: 'No matching tickets in your accessible departments.',
  },
  ar: {
    hint: 'أدخل رمز الدولة، مثل ‎+962790000000.',
    checking: 'جارٍ البحث في التذاكر السابقة…', failed: 'تعذر البحث في التذاكر السابقة. حاول مرة أخرى.', retry: 'إعادة البحث',
    duplicate: 'رقم الهاتف مستخدم بالفعل في تذكرة سابقة.',
    followUp: 'افتح التذكرة السابقة لإضافة متابعة في الملاحظات، أو أنشئ تذكرة أخرى لمشكلة مختلفة.',
    open: 'فتح التذكرة', separate: 'مشكلة مختلفة — إنشاء تذكرة أخرى', confirmed: 'تم تأكيد إنشاء تذكرة منفصلة لهذه المشكلة.',
    noMatches: 'لا توجد تذاكر مطابقة في الأقسام التي يمكنك الوصول إليها.',
  },
};
export const ticketPhoneRuleAdmin = {
  nameEn: 'Customer phone number', nameAr: 'رقم هاتف العميل',
  badge: 'Phone duplicate rule / قاعدة تكرار الهاتف',
  label: 'Customer phone duplicate rule / قاعدة التحقق من تكرار هاتف العميل',
  hint: 'Required international phone; checks all accessible departments, links existing tickets and allows a separate problem. / هاتف دولي إلزامي؛ يبحث في الأقسام المتاحة ويربط التذاكر السابقة مع السماح بمشكلة منفصلة.',
};
