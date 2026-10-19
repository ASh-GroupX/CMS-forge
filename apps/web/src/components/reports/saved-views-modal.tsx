'use client';

import React, { useState, useEffect } from 'react';
import { Bookmark, Check, Plus, Star, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';

export interface SavedReportView {
  id: string;
  name: string;
  isDefault?: boolean;
  filters: Record<string, any>;
  period: string;
  dateDimension: string;
  createdAt: string;
}

interface SavedViewsModalProps {
  locale: Locale;
  isOpen: boolean;
  onClose: () => void;
  storageKey: string;
  currentConfig: {
    filters: Record<string, any>;
    period: string;
    dateDimension: string;
  };
  onApplyView: (view: SavedReportView) => void;
}

export function SavedViewsModal({
  locale,
  isOpen,
  onClose,
  storageKey,
  currentConfig,
  onApplyView,
}: SavedViewsModalProps) {
  const t = reportsAnalyticsI18n[locale];
  const [views, setViews] = useState<SavedReportView[]>([]);
  const [newViewName, setNewViewName] = useState('');

  // Load from local storage
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(`cms_report_views_${storageKey}`);
      if (raw) {
        setViews(JSON.parse(raw));
      } else {
        setViews([]);
      }
    } catch {
      setViews([]);
    }
  }, [isOpen, storageKey]);

  const persistViews = (updated: SavedReportView[]) => {
    setViews(updated);
    try {
      localStorage.setItem(`cms_report_views_${storageKey}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleSaveCurrent = () => {
    if (!newViewName.trim()) return;
    const newView: SavedReportView = {
      id: `view_${Date.now()}`,
      name: newViewName.trim(),
      isDefault: views.length === 0,
      filters: currentConfig.filters,
      period: currentConfig.period,
      dateDimension: currentConfig.dateDimension,
      createdAt: new Date().toISOString(),
    };
    persistViews([...views, newView]);
    setNewViewName('');
  };

  const handleSetDefault = (id: string) => {
    const updated = views.map((v) => ({ ...v, isDefault: v.id === id }));
    persistViews(updated);
  };

  const handleDelete = (id: string) => {
    const updated = views.filter((v) => v.id !== id);
    persistViews(updated);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6 space-y-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <Bookmark className="h-4 w-4 text-primary" />
            <span>{t.savedViewsModal.title}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Save Current View Form */}
        <div className="space-y-2 border-b pb-4">
          <label className="text-xs font-semibold text-muted-foreground block">
            {t.savedViewsModal.saveCurrentView}
          </label>
          <div className="flex items-center gap-2">
            <Input
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder={t.savedViewsModal.viewName}
              className="h-8 text-xs"
            />
            <Button
              type="button"
              size="sm"
              disabled={!newViewName.trim()}
              onClick={handleSaveCurrent}
              className="h-8 gap-1 text-xs px-3"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{locale === 'ar' ? 'حفظ' : 'Save'}</span>
            </Button>
          </div>
        </div>

        {/* List of Saved Views */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {views.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              {locale === 'ar' ? 'لا توجد عروض محفوظة بعد.' : 'No saved views yet.'}
            </div>
          ) : (
            views.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-lg border p-2.5 hover:bg-muted/30 transition-colors text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{v.name}</span>
                  {v.isDefault && (
                    <Badge variant="secondary" className="text-3xs py-0 px-1 font-normal">
                      {t.savedViewsModal.defaultBadge}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(v.id)}
                    title={t.savedViewsModal.setDefault}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-yellow-600"
                  >
                    <Star className={`h-3.5 w-3.5 ${v.isDefault ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onApplyView(v);
                      onClose();
                    }}
                    className="h-7 px-2 text-2xs"
                  >
                    <Check className="h-3 w-3 me-1" />
                    <span>{t.savedViewsModal.load}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(v.id)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
            {t.savedViewsModal.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
