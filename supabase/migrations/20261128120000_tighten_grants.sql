-- E6 (SEC-2, SEC-4): הקשחת הרשאות אחרי בדיקת האבטחה.

-- SEC-2: ה-view של סטטוס החיבור ניתן לעדכון אוטומטית ורץ בהרשאות postgres, ולכן כתיבה דרכו
-- עקפה את revoke all על calendar_connections. משאירים רק קריאה.
revoke insert, update, delete, truncate, references, trigger
  on public.calendar_connection_status from authenticated;

-- SEC-4: אף מסך לא קורא נתונים בלי התחברות. ה-policies הן to authenticated בלבד, וזו שכבה נוספת
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;

-- טבלאות, sequences ופונקציות שייווצרו בעתיד לא יקבלו הרשאות ל-anon כברירת מחדל
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on functions from anon;
