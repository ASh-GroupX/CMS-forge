'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';

export function DeleteComplaintButton({ complaintId, locale }: { complaintId: string; locale: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذه الشكوى؟' : 'Are you sure you want to delete this complaint?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const match = document.cookie.match(/(?:^|; )cms_csrf_token=([^;]*)/);
      const csrfToken = match ? decodeURIComponent(match[1] ?? '') : '';
      
      const res = await fetch(`/api/complaints/${encodeURIComponent(complaintId)}`, {
        method: 'DELETE',
        headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
      });
      
      if (res.ok) {
        router.push(`/complaints?locale=${locale}`);
      } else {
        alert(locale === 'ar' ? 'حدث خطأ أثناء الحذف' : 'Failed to delete complaint');
      }
    } catch (err) {
      console.error(err);
      alert(locale === 'ar' ? 'حدث خطأ أثناء الحذف' : 'Failed to delete complaint');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Button
      variant="destructive"
      className="w-full justify-start"
      disabled={isDeleting}
      onClick={handleDelete}
    >
      <Trash2 className="me-2 size-4" aria-hidden="true" />
      {locale === 'ar' ? 'حذف الشكوى' : 'Delete Complaint'}
    </Button>
  );
}
