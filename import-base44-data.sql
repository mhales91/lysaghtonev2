-- Import Base44 data into Supabase
-- This script creates sample data based on your Base44 export structure
-- Run this in your Supabase SQL Editor

-- First, let's create some sample clients based on your export
INSERT INTO public.clients (id, name, created_at, updated_at) VALUES
('68b4d418f6c9b38b67494f51', 'Pacific Developments Ltd', '2025-08-31T23:00:40.448000', '2025-08-31T23:00:40.448000'),
('68b4d418f6c9b38b67494f50', 'Mainland Holdings', '2025-08-31T23:00:40.442000', '2025-08-31T23:00:40.442000'),
('68b4d418f6c9b38b67494f4f', 'Profita Holdings Ltd', '2025-08-31T23:00:40.437000', '2025-08-31T23:00:40.437000'),
('68b4d418f6c9b38b67494f4e', 'AM Ltd', '2025-08-31T23:00:40.418000', '2025-08-31T23:00:40.418000'),
('68b4d418f6c9b38b67494f4d', 'Bay Property Group', '2025-08-31T23:00:40.413000', '2025-08-31T23:00:40.413000'),
('68b4d418f6c9b38b67494f4c', 'James Bond Ltd', '2025-08-31T23:00:40.408000', '2025-08-31T23:00:40.408000'),
('68b4d418f6c9b38b67494f4b', 'Mike Stott Holdings', '2025-08-31T23:00:40.401000', '2025-08-31T23:00:40.401000'),
('68b4d418f6c9b38b67494f4a', 'Mike Stott Holdings', '2025-08-31T23:00:40.397000', '2025-08-31T23:00:40.397000'),
('68b4d418f6c9b38b67494f49', 'Mike Stott Holdings', '2025-08-31T23:00:40.390000', '2025-08-31T23:00:40.390000'),
('68b4d418f6c9b38b67494f48', 'Bay Property Group', '2025-08-31T23:00:40.385000', '2025-08-31T23:00:40.385000'),
('68b4d418f6c9b38b67494f47', 'Mitch Holdings', '2025-08-31T23:00:40.380000', '2025-08-31T23:00:40.380000'),
('68b4d418f6c9b38b67494f46', 'Mike Stott Holdings', '2025-08-31T23:00:40.375000', '2025-08-31T23:00:40.375000'),
('68b4d418f6c9b38b67494f45', 'Mike Stott Holdings', '2025-08-31T23:00:40.370000', '2025-08-31T23:00:40.370000'),
('68b4d418f6c9b38b67494f44', 'Mike Stott Holdings', '2025-08-31T23:00:40.364000', '2025-08-31T23:00:40.364000'),
('68b4d418f6c9b38b67494f43', 'Foster Construction BOP Ltd', '2025-08-31T23:00:40.356000', '2025-08-31T23:00:40.356000'),
('68b4d418f6c9b38b67494f42', 'Pacific Developments Ltd', '2025-08-31T23:00:40.350000', '2025-08-31T23:00:40.350000'),
('68b4d418f6c9b38b67494f41', 'Bay Property Group', '2025-08-31T23:00:40.340000', '2025-08-31T23:00:40.340000'),
('68b4d3fbbb5c26066358383c', 'Pacific Developments Ltd', '2025-08-31T23:00:11.313000', '2025-08-31T23:00:11.313000')
ON CONFLICT (id) DO NOTHING;

-- Create some sample projects based on your export
INSERT INTO public.projects (id, name, client_id, description, status, created_at, updated_at) VALUES
('68b11a573e5d86cdc801f707', 'Emily Place subdivision', '6893f5583ed0d8c5022783cd', 'Project for Emily Place subdivision development', 'archived', '2025-08-29T03:11:19.239000', '2025-08-31T21:51:37.646000'),
('68b0b50dfd303ab04e8a8189', '13 Dream Street - Soakage Design', '689262ebf9a00423b8ab3c72', 'Soakage design for 13 Dream Street', 'archived', '2025-08-28T19:59:09.899000', '2025-08-31T21:51:38.348000'),
('68ae460ef7676ef1bfde0160', 'Emily Place subdivision', '689115a406fec7e46125584b', 'Job #266013 - Emily Place subdivision', 'completed', '2025-08-26T23:41:02.109000', '2025-08-27T00:32:13.983000'),
('68ab76ff3bac6e20925eb280', 'Carmichael Rd', '68ab76b3a66aca34fa84de72', 'Job #132442 - Carmichael Rd project', 'not_started', '2025-08-24T20:33:03.217000', '2025-08-24T20:33:03.217000'),
('68ab76ff3bac6e20925eb275', '27 Riddington Dr', '68ab76bdb50a0c1338e9fedb', 'Job #132431 - 27 Riddington Dr project', 'not_started', '2025-08-24T20:33:03.217000', '2025-08-24T20:33:03.217000'),
('68ab76ff3bac6e20925eb276', 'Redwood Stage 3 Civil', '68ab76b556ea269cdcb5d333', 'Job #132432 - Redwood Stage 3 Civil project', 'not_started', '2025-08-24T20:33:03.217000', '2025-08-24T20:33:03.217000'),
('68ab76ff3bac6e20925eb277', '8 Vantage Place Omokoroa', '68ab76b447b4096bae7f3591', 'Job #132433 - 8 Vantage Place Omokoroa', 'not_started', '2025-08-24T20:33:03.217000', '2025-08-24T20:33:03.217000'),
('68ab76ff3bac6e20925eb278', '65C Hamurana Road Omokoroa', '68ab76b447b4096bae7f3591', 'Job #132434 - 65C Hamurana Road Omokoroa', 'not_started', '2025-08-24T20:33:03.217000', '2025-08-24T20:33:03.217000'),
('68ab76ff3bac6e20925eb279', '100 Maxwell Road', '68ab76a5b50a0c1338e9fe65', 'Job #132435 - 100 Maxwell Road', 'not_started', '2025-08-24T20:33:03.217000', '2025-08-24T20:33:03.217000'),
('68ab76ff3bac6e20925eb27a', 'Japanese Automotive Network Ltd', '68ab76bdb50a0c1338e9fedc', 'Job #132436 - Japanese Automotive Network Ltd', 'not_started', '2025-08-24T20:33:03.217000', '2025-08-24T20:33:03.217000'),
('68ab76ff3bac6e20925eb27b', '152 Whakakake Street', '68ab76b1e2b6f1bcc3f24f27', 'Job #132437 - 152 Whakakake Street', 'not_started', '2025-08-24T20:33:03.217000', '2025-08-24T20:33:03.217000'),
('68ab76ff3bac6e20925eb27c', 'WWPS Survey', '68ab76a5b50a0c1338e9fe65', 'Job #132440 - WWPS Survey', 'not_started', '2025-08-24T20:33:03.217000', '2025-08-24T20:33:03.217000'),
('68ab76ff3bac6e20925eb27d', '32 Reel Rd', '68ab76b447b4096bae7f3591', 'Job #132438 - 32 Reel Rd', 'not_started', '2025-08-24T20:33:03.217000', '2025-08-24T20:33:03.217000'),
('68ab76ff3bac6e20925eb27e', 'Newby 3 Block', '68ab76bdb50a0c1338e9fedd', 'Job #132439 - Newby 3 Block', 'not_started', '2025-08-24T20:33:03.217000', '2025-08-24T20:33:03.217000'),
('68ab76ff3bac6e20925eb27f', '15 Emerald Shores Drive', '68ab76a5b50a0c1338e9fe5f', 'Job #132441 - 15 Emerald Shores Drive', 'not_started', '2025-08-24T20:33:03.217000', '2025-08-24T20:33:03.217000'),
('68ab76ff3bac6e20925eb281', '47 Courtney Road Tauranga', '68ab76b1e2b6f1bcc3f24f27', 'Job #132443 - 47 Courtney Road Tauranga', 'not_started', '2025-08-24T20:33:03.217000', '2025-08-24T20:33:03.217000'),
('68ab76ff3bac6e20925eb282', '96A and 96B Te Hono Street Maungatapu', '68ab76bdb50a0c1338e9fede', 'Job #132444 - 96A and 96B Te Hono Street Maungatapu', 'not_started', '2025-08-24T20:33:03.217000', '2025-08-24T20:33:03.217000'),
('68ab76ff3bac6e20925eb283', '102 Eleventh Ave', '68ab76bdb50a0c1338e9fedf', 'Job #132445 - 102 Eleventh Ave', 'not_started', '2025-08-24T20:33:03.217000', '2025-08-24T20:33:03.217000'),
('68ab76ff3bac6e20925eb284', 'Seawall Remediation Sulphur Point', '68ab76a64445941fe2468f50', 'Job #132446 - Seawall Remediation Sulphur Point', 'not_started', '2025-08-24T20:33:03.217000', '2025-08-24T20:33:03.217000'),
('68ab76ff3bac6e20925eb285', '44 Waikete Road', '68ab76bdb50a0c1338e9fee0', 'Job #132447 - 44 Waikete Road', 'not_started', '2025-08-24T20:33:03.217000', '2025-08-24T20:33:03.217000')
ON CONFLICT (id) DO NOTHING;

-- Create some sample tasks
INSERT INTO public.tasks (id, name, project_id, description, status, created_at, updated_at) VALUES
(gen_random_uuid(), 'Site Survey', '68b11a573e5d86cdc801f707', 'Initial site survey for Emily Place subdivision', 'completed', '2025-08-29T03:11:19.239000', '2025-08-31T21:51:37.646000'),
(gen_random_uuid(), 'Design Development', '68b11a573e5d86cdc801f707', 'Design development for Emily Place subdivision', 'completed', '2025-08-29T03:11:19.239000', '2025-08-31T21:51:37.646000'),
(gen_random_uuid(), 'Soakage Analysis', '68b0b50dfd303ab04e8a8189', 'Soakage analysis for 13 Dream Street', 'completed', '2025-08-28T19:59:09.899000', '2025-08-31T21:51:38.348000'),
(gen_random_uuid(), 'Design Documentation', '68b0b50dfd303ab04e8a8189', 'Design documentation for 13 Dream Street', 'completed', '2025-08-28T19:59:09.899000', '2025-08-31T21:51:38.348000'),
(gen_random_uuid(), 'Project Planning', '68ae460ef7676ef1bfde0160', 'Project planning for Emily Place subdivision', 'completed', '2025-08-26T23:41:02.109000', '2025-08-27T00:32:13.983000'),
(gen_random_uuid(), 'Site Investigation', '68ae460ef7676ef1bfde0160', 'Site investigation for Emily Place subdivision', 'completed', '2025-08-26T23:41:02.109000', '2025-08-27T00:32:13.983000'),
(gen_random_uuid(), 'Initial Assessment', '68ab76ff3bac6e20925eb280', 'Initial assessment for Carmichael Rd project', 'pending', '2025-08-24T20:33:03.217000', '2025-08-24T20:33:03.217000'),
(gen_random_uuid(), 'Site Survey', '68ab76ff3bac6e20925eb275', 'Site survey for 27 Riddington Dr project', 'pending', '2025-08-24T20:33:03.217000', '2025-08-24T20:33:03.217000'),
(gen_random_uuid(), 'Civil Design', '68ab76ff3bac6e20925eb276', 'Civil design for Redwood Stage 3', 'pending', '2025-08-24T20:33:03.217000', '2025-08-24T20:33:03.217000'),
(gen_random_uuid(), 'Infrastructure Planning', '68ab76ff3bac6e20925eb276', 'Infrastructure planning for Redwood Stage 3', 'pending', '2025-08-24T20:33:03.217000', '2025-08-24T20:33:03.217000')
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
    'Worked on site survey and documentation',
    NOW(),
    NOW()
FROM public.users u, public.tasks t 
WHERE u.email = 'dev@localhost.com' AND t.name = 'Site Survey'
UNION ALL
SELECT 
    gen_random_uuid(),
    u.id,
    t.id,
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '2 hours',
    120,
    'Completed design development work',
    NOW(),
    NOW()
FROM public.users u, public.tasks t 
WHERE u.email = 'dev@localhost.com' AND t.name = 'Design Development'
UNION ALL
SELECT 
    gen_random_uuid(),
    u.id,
    t.id,
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '4 hours',
    120,
    'Conducted soakage analysis and testing',
    NOW(),
    NOW()
FROM public.users u, public.tasks t 
WHERE u.email = 'dev@localhost.com' AND t.name = 'Soakage Analysis'
ON CONFLICT (id) DO NOTHING;

-- Create some company settings
INSERT INTO public.company_settings (id, key, value, created_at, updated_at) VALUES
(gen_random_uuid(), 'company_name', 'Lysaght Consultants Limited', NOW(), NOW()),
(gen_random_uuid(), 'company_email', 'info@lysaght.net.nz', NOW(), NOW()),
(gen_random_uuid(), 'default_currency', 'NZD', NOW(), NOW()),
(gen_random_uuid(), 'default_hourly_rate', '150.00', NOW(), NOW()),
(gen_random_uuid(), 'timezone', 'Pacific/Auckland', NOW(), NOW()),
(gen_random_uuid(), 'invoice_prefix', 'LYSH', NOW(), NOW()),
(gen_random_uuid(), 'company_address', 'Bay of Plenty, New Zealand', NOW(), NOW()),
(gen_random_uuid(), 'company_phone', '+64 7 123 4567', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- Show summary of imported data
SELECT 'Base44 data imported successfully!' as message;
SELECT 'Clients: ' || COUNT(*) as clients FROM public.clients;
SELECT 'Projects: ' || COUNT(*) as projects FROM public.projects;
SELECT 'Tasks: ' || COUNT(*) as tasks FROM public.tasks;
SELECT 'Time Entries: ' || COUNT(*) as time_entries FROM public.time_entries;
SELECT 'Company Settings: ' || COUNT(*) as settings FROM public.company_settings;
