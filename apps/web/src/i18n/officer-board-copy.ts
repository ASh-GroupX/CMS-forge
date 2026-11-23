export const officerBoardCopy = {
  en: {
    filterLabel: 'Filter officers by active tickets',
    all: 'All officers',
    active: 'Active officers',
    free: 'Free officers',
    activeCount: (count: number) => `${count} active tickets`,
    noFree: 'No free officers right now.',
    noActive: 'No officers with active tickets.',
    noOfficers: 'No officers in this department.',
  },
  ar: {
    filterLabel: 'تصفية الموظفين حسب المهام النشطة',
    all: 'كل الموظفين',
    active: 'الموظفون المشغولون',
    free: 'الموظفون المتاحون',
    activeCount: (count: number) => `${count} تذاكر نشطة`,
    noFree: 'لا يوجد موظفون متاحون حالياً.',
    noActive: 'لا يوجد موظفون لديهم تذاكر نشطة.',
    noOfficers: 'لا يوجد موظفون في هذا القسم.',
  },
} as const;
