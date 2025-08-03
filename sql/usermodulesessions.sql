-- Create the table to track which user session has seen which module
CREATE TABLE public.usermodulesessions (
	id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
	user_session_id uuid NOT NULL,
	survey_id uuid NOT NULL,
	module_id uuid NOT NULL,
	created_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT usermodulesessions_pkey PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.usermodulesessions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow anonymous users to read and insert into the table
CREATE POLICY "Enable insert for anon users" ON public.usermodulesessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Enable read access for anon users" ON public.usermodulesessions FOR SELECT TO anon USING (true);
