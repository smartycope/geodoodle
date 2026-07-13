-- SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin
-- FROM pg_roles;


-- SELECT schemaname, tablename, tableowner,
--        (array_agg(distinct privilege_type)) AS privileges
-- FROM information_schema.role_table_grants
-- WHERE table_schema = 'schema_name'
-- GROUP BY schemaname, tablename, tableowner;


-- GRANT ALL ON TABLE saves TO web_anon;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA geodoodle
--   GRANT ALL ON TABLES TO web_anon;

GRANT USAGE ON SCHEMA geodoodle TO web_anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA geodoodle TO web_anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA geodoodle
GRANT ALL ON TABLES TO web_anon;

create table IF NOT EXISTS geodoodle.saves (
    id serial primary key,
    "user" text,
    name text,
    data json,
    version text,
    created_at timestamp,
    modified_at timestamp
);

-- Add indexes to rows user and name
CREATE INDEX saves_user ON geodoodle.saves ("user");
CREATE INDEX saves_name ON geodoodle.saves (name);

SELECT * FROM geodoodle.saves;

GRANT USAGE, SELECT ON SEQUENCE geodoodle.saves_id_seq TO web_anon;

NOTIFY pgrst, 'reload schema'
;
SELECT schemaname, tablename
FROM pg_tables
WHERE tablename = 'saves';

drop table IF EXISTS saves;
