-- Create profiling_surveys table
CREATE TABLE IF NOT EXISTS profiling_surveys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSONB,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create profiling_questions table
CREATE TABLE IF NOT EXISTS profiling_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profiling_survey_id UUID REFERENCES profiling_surveys(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    answer_option JSONB,
    question_order INTEGER,
    question_number VARCHAR(10),
    question_options JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiling_questions_survey_id ON profiling_questions(profiling_survey_id);
CREATE INDEX IF NOT EXISTS idx_profiling_questions_order ON profiling_questions(question_order);

-- Enable RLS
ALTER TABLE profiling_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiling_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for profiling_surveys
CREATE POLICY "Allow all operations for authenticated users" ON profiling_surveys
FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for profiling_questions
CREATE POLICY "Allow all operations for authenticated users" ON profiling_questions
FOR ALL USING (auth.role() = 'authenticated');
