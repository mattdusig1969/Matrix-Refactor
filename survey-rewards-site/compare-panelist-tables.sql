-- Check what panelist-related tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%panelist%'
ORDER BY table_name;

-- Check panelist table structure (if it exists)
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'panelist' 
ORDER BY ordinal_position;

-- Check panelist_stats table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'panelist_stats' 
ORDER BY ordinal_position;

-- Sample data from panelist table (if it exists)
-- SELECT * FROM panelist LIMIT 3;

-- Sample data from panelist_stats table
-- SELECT * FROM panelist_stats LIMIT 3;

-- Check for foreign key relationships
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND (tc.table_name LIKE '%panelist%' OR ccu.table_name LIKE '%panelist%');
