-- Table for storing iframe survey designs/styles
CREATE TABLE public.surveydesigns (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  css text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now()
);
