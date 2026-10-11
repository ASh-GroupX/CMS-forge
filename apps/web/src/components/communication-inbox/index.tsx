'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, Mail, Bell, MessageSquare, Plus, Archive, MoreVertical } from 'lucide-react';
import type { Locale } from '../../i18n/staff-shell';

type Thread = {
  id: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
  type: 'mention' | 'update' | 'message';
};

const MOCK_THREADS: Thread[] = [
  { id: '1', subject: 'Customer uploaded a new document', snippet: 'For complaint #C-2023-142, the customer has uploaded a new document "Receipt.pdf".', date: '10 mins ago', unread: true, type: 'update' },
  { id: '2', subject: 'Mentioned by Sarah in C-2023-145', snippet: '@admin Can you please review this request for an SLA extension?', date: '2 hours ago', unread: true, type: 'mention' },
  { id: '3', subject: 'System SLA Warning', snippet: 'Complaint C-2023-110 is approaching its SLA deadline in 2 hours.', date: '1 day ago', unread: false, type: 'update' },
  { id: '4', subject: 'New message from branch manager', snippet: 'We have resolved the issue with the missing parts, please close the complaint.', date: '2 days ago', unread: false, type: 'message' },
];

export function CommunicationInbox({ locale }: { locale: Locale }) {
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredThreads = MOCK_THREADS.filter(t => t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || t.snippet.toLowerCase().includes(searchQuery.toLowerCase()));

  const t = {
    inbox: locale === 'ar' ? 'صندوق الوارد' : 'Inbox',
    search: locale === 'ar' ? 'بحث...' : 'Search...',
    new: locale === 'ar' ? 'رسالة جديدة' : 'New Message',
    selectMessage: locale === 'ar' ? 'اختر رسالة لعرضها' : 'Select a message to view',
    reply: locale === 'ar' ? 'رد' : 'Reply',
    archive: locale === 'ar' ? 'أرشفة' : 'Archive',
  };

  return (
    <div className="flex h-full w-full bg-surface">
      {/* Left Pane - List */}
      <div className="flex w-full max-w-sm flex-col border-e border-line-subtle bg-surface">
        <div className="flex items-center justify-between border-b border-line-subtle p-4">
          <h1 className="text-xl font-semibold text-content-strong">{t.inbox}</h1>
          <Button size="icon" variant="ghost" className="rounded-full">
            <Plus className="size-5 text-content-muted" />
          </Button>
        </div>
        <div className="p-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-content-muted" />
            <Input 
              className="ps-9" 
              placeholder={t.search} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.map(thread => (
            <button
              key={thread.id}
              onClick={() => setSelectedThread(thread)}
              className={`flex w-full flex-col items-start gap-1 border-b border-line-subtle p-4 text-start transition-colors hover:bg-surface-raised ${selectedThread?.id === thread.id ? 'bg-surface-raised' : ''}`}
            >
              <div className="flex w-full items-center justify-between">
                <span className={`text-sm font-semibold ${thread.unread ? 'text-content-strong' : 'text-content-muted'}`}>
                  {thread.subject}
                </span>
                <span className="text-xs text-content-muted">{thread.date}</span>
              </div>
              <span className={`line-clamp-2 text-xs ${thread.unread ? 'font-medium text-content-subtle' : 'text-content-muted'}`}>
                {thread.snippet}
              </span>
              <div className="mt-2 flex items-center gap-1">
                {thread.type === 'mention' && <MessageSquare className="size-3 text-brand" />}
                {thread.type === 'update' && <Bell className="size-3 text-info" />}
                {thread.type === 'message' && <Mail className="size-3 text-content-muted" />}
                <span className="text-[10px] uppercase text-content-muted">{thread.type}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Pane - Detail */}
      <div className="flex flex-1 flex-col bg-surface-sunken">
        {selectedThread ? (
          <>
            <div className="flex items-center justify-between border-b border-line-subtle bg-surface px-6 py-4">
              <h2 className="text-lg font-semibold text-content-strong">{selectedThread.subject}</h2>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <Archive className="me-2 size-4" />
                  {t.archive}
                </Button>
                <Button size="icon" variant="ghost">
                  <MoreVertical className="size-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-content-muted">{selectedThread.date}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-content-strong">{selectedThread.snippet}</p>
                </CardContent>
              </Card>
            </div>
            <div className="border-t border-line-subtle bg-surface p-4">
              <div className="flex items-center gap-2">
                <Input placeholder={t.reply} className="flex-1" />
                <Button>{t.reply}</Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-content-muted">
              <Mail className="size-12 opacity-20" />
              <p>{t.selectMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
