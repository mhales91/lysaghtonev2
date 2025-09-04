-- Create sample data with correct table structure
-- Run this in your Supabase SQL Editor

-- First, let's create some sample clients (without email column)
INSERT INTO public.clients (id, name, created_at, updated_at) VALUES
(gen_random_uuid(), 'Acme Corporation', NOW(), NOW()),
(gen_random_uuid(), 'TechStart Pty Ltd', NOW(), NOW()),
(gen_random_uuid(), 'Global Solutions Inc', NOW(), NOW()),
(gen_random_uuid(), 'Local Business Co', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create some sample projects
INSERT INTO public.projects (id, name, client_id, description, status, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Website Redesign',
    c.id,
    'Complete redesign of the company website with modern UI/UX',
    'active',
    NOW(),
    NOW()
FROM public.clients c WHERE c.name = 'Acme Corporation'
UNION ALL
SELECT 
    gen_random_uuid(),
    'Mobile App Development',
    c.id,
    'Development of a new mobile application for customer engagement',
    'active',
    NOW(),
    NOW()
FROM public.clients c WHERE c.name = 'TechStart Pty Ltd'
UNION ALL
SELECT 
    gen_random_uuid(),
    'System Integration',
    c.id,
    'Integration of legacy systems with new cloud infrastructure',
    'planning',
    NOW(),
    NOW()
FROM public.clients c WHERE c.name = 'Global Solutions Inc'
UNION ALL
SELECT 
    gen_random_uuid(),
    'Consulting Services',
    c.id,
    'Ongoing business consulting and strategy development',
    'active',
    NOW(),
    NOW()
FROM public.clients c WHERE c.name = 'Local Business Co'
ON CONFLICT (id) DO NOTHING;

-- Create some sample tasks
INSERT INTO public.tasks (id, name, project_id, description, status, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'UI/UX Design',
    p.id,
    'Create wireframes and mockups for the new website',
    'in_progress',
    NOW(),
    NOW()
FROM public.projects p WHERE p.name = 'Website Redesign'
UNION ALL
SELECT 
    gen_random_uuid(),
    'Frontend Development',
    p.id,
    'Implement the frontend using React and modern CSS',
    'pending',
    NOW(),
    NOW()
FROM public.projects p WHERE p.name = 'Website Redesign'
UNION ALL
SELECT 
    gen_random_uuid(),
    'Backend API Development',
    p.id,
    'Develop RESTful APIs for the mobile app',
    'in_progress',
    NOW(),
    NOW()
FROM public.projects p WHERE p.name = 'Mobile App Development'
UNION ALL
SELECT 
    gen_random_uuid(),
    'Database Design',
    p.id,
    'Design and implement the database schema',
    'completed',
    NOW(),
    NOW()
FROM public.projects p WHERE p.name = 'Mobile App Development'
UNION ALL
SELECT 
    gen_random_uuid(),
    'Requirements Analysis',
    p.id,
    'Analyze current systems and define integration requirements',
    'in_progress',
    NOW(),
    NOW()
FROM public.projects p WHERE p.name = 'System Integration'
UNION ALL
SELECT 
    gen_random_uuid(),
    'Strategy Planning',
    p.id,
    'Develop comprehensive business strategy and roadmap',
    'pending',
    NOW(),
    NOW()
FROM public.projects p WHERE p.name = 'Consulting Services'
ON CONFLICT (id) DO NOTHING;

-- Create some sample time entries
INSERT INTO public.time_entries (id, user_id, task_id, start_time, end_time, duration_minutes, description, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    u.id,
    t.id,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour',
    60,
    'Worked on UI mockups and user flow diagrams',
    NOW(),
    NOW()
FROM public.users u, public.tasks t 
WHERE u.email = 'dev@localhost.com' AND t.name = 'UI/UX Design'
UNION ALL
SELECT 
    gen_random_uuid(),
    u.id,
    t.id,
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '2 hours',
    120,
    'Developed API endpoints for user authentication',
    NOW(),
    NOW()
FROM public.users u, public.tasks t 
WHERE u.email = 'dev@localhost.com' AND t.name = 'Backend API Development'
UNION ALL
SELECT 
    gen_random_uuid(),
    u.id,
    t.id,
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '4 hours',
    120,
    'Analyzed legacy system architecture and documented requirements',
    NOW(),
    NOW()
FROM public.users u, public.tasks t 
WHERE u.email = 'dev@localhost.com' AND t.name = 'Requirements Analysis'
ON CONFLICT (id) DO NOTHING;

-- Create some company settings
INSERT INTO public.company_settings (id, key, value, created_at, updated_at) VALUES
(gen_random_uuid(), 'company_name', 'Lysaght Consultants Limited', NOW(), NOW()),
(gen_random_uuid(), 'company_email', 'info@lysaght.com.au', NOW(), NOW()),
(gen_random_uuid(), 'default_currency', 'AUD', NOW(), NOW()),
(gen_random_uuid(), 'default_hourly_rate', '150.00', NOW(), NOW()),
(gen_random_uuid(), 'timezone', 'Australia/Sydney', NOW(), NOW()),
(gen_random_uuid(), 'invoice_prefix', 'LYSH', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- Show summary of created data
SELECT 'Sample data created successfully!' as message;
SELECT 'Clients: ' || COUNT(*) as clients FROM public.clients;
SELECT 'Projects: ' || COUNT(*) as projects FROM public.projects;
SELECT 'Tasks: ' || COUNT(*) as tasks FROM public.tasks;
SELECT 'Time Entries: ' || COUNT(*) as time_entries FROM public.time_entries;
SELECT 'Company Settings: ' || COUNT(*) as settings FROM public.company_settings;
