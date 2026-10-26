-- Delete requested admin complaints and their associated records
DO $$
DECLARE
    target_refs TEXT[] := ARRAY[
        'CMS-2026-SERVICE_CENTER-000003',
        'CMS-2026-KHALDA-000001',
        'CMS-2026-MAINTENANCE-000002',
        'CMS-2026-MAINTENANCE-000001'
    ];
    target_ids TEXT[];
    linked_task_ids TEXT[];
BEGIN
    SELECT ARRAY_AGG(id) INTO target_ids
    FROM "complaints"
    WHERE "reference_number" = ANY(target_refs);

    IF target_ids IS NOT NULL AND array_length(target_ids, 1) > 0 THEN
        -- Find linked tasks
        SELECT ARRAY_AGG(DISTINCT "task_id") INTO linked_task_ids
        FROM "task_links"
        WHERE "entity_type" = 'COMPLAINT' AND "entity_id" = ANY(target_ids);

        IF linked_task_ids IS NOT NULL AND array_length(linked_task_ids, 1) > 0 THEN
            DELETE FROM "task_comment_mentions" WHERE "task_comment_id" IN (SELECT "id" FROM "task_comments" WHERE "task_id" = ANY(linked_task_ids));
            DELETE FROM "task_comments" WHERE "task_id" = ANY(linked_task_ids);
            DELETE FROM "task_status_history" WHERE "task_id" = ANY(linked_task_ids);
            DELETE FROM "task_department_recipients" WHERE "task_id" = ANY(linked_task_ids);
            DELETE FROM "task_participants" WHERE "task_id" = ANY(linked_task_ids);
            DELETE FROM "task_links" WHERE "task_id" = ANY(linked_task_ids);
            DELETE FROM "assignment_history" WHERE "entity_type" = 'TASK' AND "entity_id" = ANY(linked_task_ids);
            DELETE FROM "assignments" WHERE "entity_type" = 'TASK' AND "entity_id" = ANY(linked_task_ids);
            DELETE FROM "tasks" WHERE "id" = ANY(linked_task_ids);
        END IF;

        -- Also delete tasks whose title mentions these reference numbers
        DELETE FROM "tasks" WHERE "title" LIKE ANY(ARRAY[
            '%CMS-2026-SERVICE_CENTER-000003%',
            '%CMS-2026-KHALDA-000001%',
            '%CMS-2026-MAINTENANCE-000002%',
            '%CMS-2026-MAINTENANCE-000001%'
        ]);

        -- Delete complaint dependents
        DELETE FROM "complaint_watchers" WHERE "complaint_id" = ANY(target_ids);
        DELETE FROM "complaint_comment_mentions" WHERE "comment_id" IN (SELECT "id" FROM "comments" WHERE "complaint_id" = ANY(target_ids));
        DELETE FROM "comments" WHERE "complaint_id" = ANY(target_ids);
        DELETE FROM "approvals" WHERE "complaint_id" = ANY(target_ids);
        DELETE FROM "complaint_status_history" WHERE "complaint_id" = ANY(target_ids);
        DELETE FROM "complaint_relations" WHERE "source_complaint_id" = ANY(target_ids) OR "target_complaint_id" = ANY(target_ids);
        DELETE FROM "sla_events" WHERE "complaint_id" = ANY(target_ids);
        DELETE FROM "notifications" WHERE "complaint_id" = ANY(target_ids);
        DELETE FROM "surveys" WHERE "complaint_id" = ANY(target_ids);
        DELETE FROM "compensation" WHERE "complaint_id" = ANY(target_ids);
        DELETE FROM "portal_verifications" WHERE "complaint_id" = ANY(target_ids);
        DELETE FROM "portal_sessions" WHERE "complaint_id" = ANY(target_ids);
        DELETE FROM "attachments" WHERE "complaint_id" = ANY(target_ids);
        DELETE FROM "case_links" WHERE "entity_type" = 'COMPLAINT' AND "entity_id" = ANY(target_ids);
        DELETE FROM "task_links" WHERE "entity_type" = 'COMPLAINT' AND "entity_id" = ANY(target_ids);
        DELETE FROM "assignment_history" WHERE "entity_type" = 'COMPLAINT' AND "entity_id" = ANY(target_ids);
        DELETE FROM "assignments" WHERE "entity_type" = 'COMPLAINT' AND "entity_id" = ANY(target_ids);

        -- Delete the complaints themselves
        DELETE FROM "complaints" WHERE "id" = ANY(target_ids);
    END IF;
END $$;
