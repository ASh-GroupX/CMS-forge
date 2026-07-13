# Arabic UX 90+ Repair

Status: implemented; human usability validation pending.

## Complaint Detail

```text
+--------------------------------------------------+
| رقم الشكوى                 الحالة | حالة الموعد |
| الإجراء المطلوب الآن                              |
+--------------------------------------------------+
| [العمل الآن] [التواصل] [التفاصيل]                |
+--------------------------------------------------+
| العمل الآن                                       |
| المسؤول | الموعد | الإجراء التالي                |
| الإجراءات التي يسمح بها الخادم فقط               |
+--------------------------------------------------+
```

- `العمل الآن`: accountable employee, deadline, next action, allowed workflow actions.
- `التواصل`: timeline, internal/public updates, mentions, CC, linked task.
- `التفاصيل`: customer, vehicle, dealership data, attachments, CAPA, survey, relations.

## Internal Update

```text
| الظهور: داخلي فقط                                |
| اكتب التحديث                                     |
| المسؤول عن التنفيذ: شخص واحد                     |
| ذكر: إشعار لهذا التحديث فقط                      |
| في نسخة: التحديثات القادمة وإمكانية الرد          |
| [بحث باسم الموظف أو المجموعة]                    |
| المختارون | الموجودون حالياً في نسخة             |
| [يتطلب إجراء]  [حفظ التحديث]                     |
```

Employee search starts after two characters. Blank search shows eligible roles,
departments, and groups only. The server returns permissions and final counts.

## Public Update

```text
| الظهور: تحديث للعميل                             |
| ! سيظهر هذا التحديث للعميل                       |
| اكتب التحديث                                     |
| [إرسال تحديث للعميل]                             |
|                                                  |
| تأكيد: إرسال هذا التحديث للعميل؟                 |
| [إلغاء] [إرسال للعميل]                           |
```

Mentions, CC, and action tasks are unavailable in public mode. Every public update
requires confirmation.

## Large Audience

```text
| إرسال هذا التحديث إلى ٣٧ مستلماً؟                |
| أزال الخادم الأسماء المكررة. راجع العدد النهائي. |
| [إلغاء] [تأكيد وإرسال]                           |
```

The draft remains unchanged. Confirmation uses the exact server-returned count.

## Task Conversation

```text
| عنوان المهمة                       الحالة        |
| المسؤول | الموعد | الإجراء التالي                |
| [فتح الشكوى المرتبطة]                            |
+--------------------------------------------------+
| التحديثات                                        |
| الاسم | التاريخ المحلي | النص | الذكر            |
+--------------------------------------------------+
| اكتب تحديثاً                                     |
| ذكر | في نسخة | الموجودون حالياً في نسخة         |
| [حفظ التحديث]                                    |
```

Watcher controls render only when the server returns `canManageWatchers`.

## Communication Groups

```text
| مجموعات التواصل              [إنشاء مجموعة جديدة]|
| مجموعاتي                                         |
| الاسم | النوع | عدد الأعضاء | أول ثلاثة أعضاء    |
| [تعديل] [تعطيل المجموعة]                         |
| المجموعات المشتركة                               |
```

Existing groups appear before the collapsed form. Deactivation is confirmed and
historical mentions remain unchanged.

## Mobile Navigation

```text
| اليوم | الحالات | إنشاء شكوى | الإشعارات | المزيد |
```

`المزيد` opens a dialog containing the remaining server-permitted routes. The
desktop sidebar is hidden below the large breakpoint.

## Human Validation Gate

Run with two Arabic-speaking staff users who describe themselves as uncomfortable
with technology. Do not coach them after reading the task.

1. Identify who is responsible for completing a task.
2. Mention one employee for a single update.
3. Add another employee in CC for future updates.
4. Explain the difference between mention and CC.
5. Send an internal update, then prepare but cancel a public update.
6. Find the primary required action within ten seconds.

Pass only when both users distinguish assignee, mention, CC, and public update;
complete at least 90% of tasks unaided; and produce zero accidental public updates.
