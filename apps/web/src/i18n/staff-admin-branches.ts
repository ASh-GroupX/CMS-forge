import type { Locale } from './staff-shell';

export const adminBranchesText: Record<Locale, typeof enAdminBranchesText> = {
  en: {
    title: 'Branches and departments',
    subtitle: 'Admin configuration preview.',
    sections: { branches: 'Branches', departments: 'Departments' },
    headers: ['Code', 'Name', 'Status', 'Action'],
    badges: { active: 'Active', inactive: 'Inactive' },
    actions: { create: 'Create', edit: 'Edit', deactivate: 'Deactivate' },
    states: {
      loading: 'Loading branches and departments.',
      empty: 'No branches or departments are configured yet.',
      error: 'Admin configuration could not be loaded. Try again.',
      success: 'Configuration change saved.',
      validation: 'Review the highlighted fields.',
      conflict: 'Record changed by someone else. Reload before retrying.',
    },
  },
  ar: {
    title: 'Ø§Ù„ÙØ±ÙˆØ¹ ÙˆØ§Ù„Ø£Ù‚Ø³Ø§Ù…',
    subtitle: 'Ù…Ø¹Ø§ÙŠÙ†Ø© Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…Ø´Ø±Ù.',
    sections: { branches: 'Ø§Ù„ÙØ±ÙˆØ¹', departments: 'Ø§Ù„Ø£Ù‚Ø³Ø§Ù…' },
    headers: ['Ø§Ù„Ø±Ù…Ø²', 'Ø§Ù„Ø§Ø³Ù…', 'Ø§Ù„Ø­Ø§Ù„Ø©', 'Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡'],
    badges: { active: 'Ù†Ø´Ø·', inactive: 'ØºÙŠØ± Ù†Ø´Ø·' },
    actions: { create: 'Ø¥Ù†Ø´Ø§Ø¡', edit: 'ØªØ¹Ø¯ÙŠÙ„', deactivate: 'Ø¥ÙŠÙ‚Ø§Ù' },
    states: {
      loading: 'Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„ÙØ±ÙˆØ¹ ÙˆØ§Ù„Ø£Ù‚Ø³Ø§Ù….',
      empty: 'Ù„Ø§ ØªÙˆØ¬Ø¯ ÙØ±ÙˆØ¹ Ø£Ùˆ Ø£Ù‚Ø³Ø§Ù… Ù…Ù‡ÙŠØ£Ø© Ø¨Ø¹Ø¯.',
      error: 'ØªØ¹Ø°Ø± ØªØ­Ù…ÙŠÙ„ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…Ø´Ø±Ù. Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.',
      success: 'ØªÙ… Ø­ÙØ¸ ØªØºÙŠÙŠØ± Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª.',
      validation: 'Ø±Ø§Ø¬Ø¹ Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ù…Ø­Ø¯Ø¯Ø©.',
      conflict: 'ØªØºÙŠØ± Ø§Ù„Ø³Ø¬Ù„ Ø¨ÙˆØ§Ø³Ø·Ø© Ø´Ø®Øµ Ø¢Ø®Ø±. Ø­Ù…Ù„ Ù‚Ø¨Ù„ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©.',
    },
  },
};

const enAdminBranchesText = {
  title: '',
  subtitle: '',
  sections: { branches: '', departments: '' },
  headers: [''],
  badges: { active: '', inactive: '' },
  actions: { create: '', edit: '', deactivate: '' },
  states: { loading: '', empty: '', error: '', success: '', validation: '', conflict: '' },
};
