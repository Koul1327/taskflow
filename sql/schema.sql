CREATE TABLE IF NOT EXISTS tasks (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 title varchar(160) NOT NULL CHECK (length(trim(title)) > 0),
 description varchar(4000) NOT NULL DEFAULT '',
 status varchar(12) NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','doing','done')),
 priority varchar(10) NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),
 due_date date,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
