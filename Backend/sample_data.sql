-- Sample Data for Study Pro Global Database
-- Run this after the database tables are created

-- Sample Universities (Top universities from different countries)
INSERT INTO universities (id, name, country, description, ranking, tuition_range, has_scholarships, website, contact_email) VALUES
('uni-001', 'Harvard University', 'USA', 'Harvard University is a private Ivy League research university in Cambridge, Massachusetts.', 1, '$50,000 - $70,000', TRUE, 'https://www.harvard.edu', 'admissions@harvard.edu'),
('uni-002', 'Stanford University', 'USA', 'Stanford University is a private research university in Stanford, California.', 3, '$55,000 - $75,000', TRUE, 'https://www.stanford.edu', 'admission@stanford.edu'),
('uni-003', 'University of Oxford', 'UK', 'The University of Oxford is a collegiate research university in Oxford, England.', 2, '£25,000 - £35,000', TRUE, 'https://www.ox.ac.uk', 'undergraduate.admissions@admin.ox.ac.uk'),
('uni-004', 'University of Cambridge', 'UK', 'The University of Cambridge is a public collegiate research university in Cambridge, England.', 4, '£23,000 - £33,000', TRUE, 'https://www.cam.ac.uk', 'admissions@cam.ac.uk'),
('uni-005', 'National University of Singapore', 'Singapore', 'The National University of Singapore is a national public research university in Singapore.', 11, 'S$30,000 - S$45,000', TRUE, 'https://www.nus.edu.sg', 'admissions@nus.edu.sg'),
('uni-006', 'Tsinghua University', 'China', 'Tsinghua University is a public research university in Beijing, China.', 17, '¥30,000 - ¥50,000', TRUE, 'https://www.tsinghua.edu.cn', 'admission@tsinghua.edu.cn'),
('uni-007', 'University of Toronto', 'Canada', 'The University of Toronto is a public research university in Toronto, Ontario, Canada.', 21, 'CAD$45,000 - CAD$60,000', TRUE, 'https://www.utoronto.ca', 'admissions@utoronto.ca'),
('uni-008', 'University of Melbourne', 'Australia', 'The University of Melbourne is a public research university located in Melbourne, Australia.', 14, 'AUD$35,000 - AUD$50,000', TRUE, 'https://www.unimelb.edu.au', 'admissions@unimelb.edu.au'),
('uni-009', 'ETH Zurich', 'Switzerland', 'ETH Zurich is a public research university in Zurich, Switzerland.', 7, 'CHF 1,500 - CHF 2,000', TRUE, 'https://ethz.ch', 'admission@ethz.ch'),
('uni-010', 'Technical University of Munich', 'Germany', 'The Technical University of Munich is a public research university in Munich, Germany.', 50, '€0 - €3,000', TRUE, 'https://www.tum.de', 'studium@tum.de');

-- Sample Programs
INSERT INTO programs (id, university_id, name, level, duration, tuition_fee, requirements) VALUES
('prog-001', 'uni-001', 'Computer Science', 'bachelor', '4 years', 70000.00, 'SAT: 1500+, GPA: 3.9+, TOEFL: 100+'),
('prog-002', 'uni-001', 'Business Administration (MBA)', 'master', '2 years', 150000.00, 'GMAT: 730+, Work Experience: 3+ years'),
('prog-003', 'uni-002', 'Artificial Intelligence', 'master', '2 years', 65000.00, 'GRE: 320+, Bachelor in CS or related field'),
('prog-004', 'uni-003', 'Medicine', 'bachelor', '6 years', 35000.00, 'A-levels: AAA, BMAT required'),
('prog-005', 'uni-004', 'Engineering', 'bachelor', '4 years', 30000.00, 'A-levels: A*AA, STEP required'),
('prog-006', 'uni-005', 'Data Science', 'master', '1.5 years', 40000.00, 'Bachelor in relevant field, GRE optional'),
('prog-007', 'uni-006', 'Architecture', 'bachelor', '5 years', 40000.00, 'Portfolio required, Chinese language proficiency'),
('prog-008', 'uni-007', 'International Relations', 'master', '2 years', 50000.00, 'Bachelor in related field, IELTS: 7.0+'),
('prog-009', 'uni-008', 'Psychology', 'bachelor', '3 years', 45000.00, 'ATAR: 90+, IELTS: 6.5+'),
('prog-010', 'uni-009', 'Mechanical Engineering', 'master', '2 years', 2000.00, 'Bachelor in Engineering, German B1 level');

-- Sample Scholarships
INSERT INTO scholarships (id, name, country, amount, level, eligibility, deadline, description, application_url) VALUES
('sch-001', 'Fulbright Foreign Student Program', 'USA', '$50,000/year', 'master', 'International students with strong academic record', '2026-05-31', 'The Fulbright Program provides grants for international educational exchange for students, scholars, teachers, professionals, scientists and artists.', 'https://foreign.fulbrightonline.org'),
('sch-002', 'Chevening Scholarships', 'UK', '£18,000 - £30,000', 'master', 'Students from Chevening-eligible countries', '2026-11-02', 'Chevening Scholarships are the UK government''s global scholarship programme, funded by the FCO and partner organisations.', 'https://www.chevening.org'),
('sch-003', 'DAAD Scholarships', 'Germany', '€850 - €1,200/month', 'master', 'International students with excellent academic records', '2026-10-15', 'DAAD offers various scholarship programs for international students to study in Germany.', 'https://www.daad.de'),
('sch-004', 'Australia Awards Scholarships', 'Australia', 'Full tuition + living allowance', 'master', 'Students from developing countries', '2026-04-30', 'Long-term development awards to study in Australian universities.', 'https://www.dfat.gov.au/australia-awards'),
('sch-005', 'Chinese Government Scholarship', 'China', 'Full tuition + stipend', 'bachelor', 'International students with good academic performance', '2026-04-30', 'Offered by Chinese government to attract international students to China.', 'http://www.campuschina.org'),
('sch-006', 'Erasmus Mundus Joint Masters', 'Europe', '€24,000/year', 'master', 'Students worldwide with relevant bachelor degree', '2026-01-15', 'EU-funded international masters programmes implemented jointly by universities across Europe.', 'https://www.eacea.ec.europa.eu'),
('sch-007', 'Gates Cambridge Scholarship', 'UK', 'Full funding', 'master', 'Outstanding applicants outside UK', '2026-12-05', 'Prestigious scholarship for graduate study at University of Cambridge.', 'https://www.gatescambridge.org'),
('sch-008', 'Vanier Canada Graduate Scholarships', 'Canada', 'CAD$50,000/year', 'master', 'Doctoral students with leadership skills', '2026-11-01', 'Prestigious scholarship for doctoral students in Canada.', 'https://vanier.gc.ca'),
('sch-009', 'Asian Development Bank Scholarship', 'Asia', 'Full tuition + allowances', 'master', 'Students from ADB member countries', '2026-07-01', 'Scholarships for studies in Asian universities under ADB-Japan Scholarship Program.', 'https://www.adb.org/scholarships'),
('sch-010', 'Rhodes Scholarship', 'UK', 'Full funding', 'master', 'Outstanding students worldwide', '2026-10-01', 'The oldest and most prestigious international scholarship programme.', 'https://www.rhodeshouse.ox.ac.uk');

-- Sample Courses
INSERT INTO courses (id, title, type, price, description, duration, content, is_active) VALUES
('course-001', 'IELTS Preparation Course', 'paid', 49.00, 'Complete IELTS preparation covering all four sections: Listening, Reading, Writing, and Speaking.', '8 weeks', 'Module 1: Overview\nModule 2: Listening Skills\nModule 3: Reading Comprehension\nModule 4: Writing Tasks\nModule 5: Speaking Practice\nModule 6: Mock Tests', TRUE),
('course-002', 'TOEFL iBT Masterclass', 'paid', 59.00, 'Comprehensive TOEFL iBT preparation with practice tests and strategies.', '6 weeks', 'Week 1-2: Reading and Listening\nWeek 3-4: Speaking Section\nWeek 5-6: Writing Section + Full Tests', TRUE),
('course-003', 'SOP Writing Guide', 'free', 0.00, 'Learn how to write a compelling Statement of Purpose for university applications.', '2 weeks', 'Free guide with templates and examples', TRUE),
('course-004', 'Scholarship Application Workshop', 'free', 0.00, 'Master the art of writing successful scholarship applications.', '1 week', 'Tips, templates, and review checklist', TRUE),
('course-005', 'GRE Quantitative Reasoning', 'paid', 79.00, 'Advanced GRE math preparation course with practice problems.', '10 weeks', 'Arithmetic, Algebra, Geometry, Data Analysis', TRUE),
('course-006', 'Interview Preparation for Universities', 'paid', 39.00, 'Prepare for university admission interviews with mock sessions.', '4 weeks', 'Common questions, practice interviews, feedback', TRUE),
('course-007', 'CV/Resume Building for International Applications', 'free', 0.00, 'Create an impressive CV for international university applications.', '3 days', 'Format guide, templates, examples', TRUE),
('course-008', 'Study Abroad Visa Process Guide', 'free', 0.00, 'Complete guide to student visa applications for major countries.', '1 week', 'Country-specific guides and checklists', TRUE);

-- Note: Add admin user separately with hashed password
-- The registration API endpoint can be used to create users, or use the following:
-- Password: Admin@123
-- Hashed with bcrypt rounds=10
INSERT INTO users (id, full_name, email, password, country, subscription_type, role, is_active) VALUES
('admin-001', 'System Administrator', 'admin@studyproglobal.com.bd', '$2a$10$X9TqvN7OcY5OJJ2xL0qh5.dH0gP6YGKrVL4HZLQk8W5XwVy5tn0Ry', 'International', 'global', 'admin', TRUE);

-- Note: This is a sample password hash. In production, you should create admin user through secure means
