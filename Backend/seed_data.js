require('dotenv').config();
const { pool } = require('./config/database');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const generateUUID = () => crypto.randomUUID();

const seedData = async () => {
  console.log('🌱 Starting database seed...\n');

  try {
    const connection = await pool.getConnection();

    // Sample Universities
    console.log('📚 Seeding universities...');
    const universities = [
      { id: generateUUID(), name: 'Harvard University', country: 'USA', description: 'One of the world\'s most prestigious universities', ranking: 1, tuition_range: '$50,000 - $55,000', has_scholarships: true, website: 'https://www.harvard.edu' },
      { id: generateUUID(), name: 'University of Oxford', country: 'UK', description: 'The oldest university in the English-speaking world', ranking: 2, tuition_range: '£30,000 - £40,000', has_scholarships: true, website: 'https://www.ox.ac.uk' },
      { id: generateUUID(), name: 'University of Toronto', country: 'Canada', description: 'Canada\'s top research university', ranking: 18, tuition_range: 'CAD 45,000 - 65,000', has_scholarships: true, website: 'https://www.utoronto.ca' },
      { id: generateUUID(), name: 'Technical University of Munich', country: 'Germany', description: 'Leading German technical university', ranking: 50, tuition_range: 'Free - €200/semester', has_scholarships: true, website: 'https://www.tum.de' },
      { id: generateUUID(), name: 'University of Melbourne', country: 'Australia', description: 'Australia\'s leading university', ranking: 33, tuition_range: 'AUD 35,000 - 45,000', has_scholarships: true, website: 'https://www.unimelb.edu.au' },
      { id: generateUUID(), name: 'National University of Singapore', country: 'Singapore', description: 'Asia\'s leading global university', ranking: 11, tuition_range: 'SGD 30,000 - 40,000', has_scholarships: true, website: 'https://www.nus.edu.sg' },
      { id: generateUUID(), name: 'University of Tokyo', country: 'Japan', description: 'Japan\'s most prestigious university', ranking: 23, tuition_range: '¥535,800/year', has_scholarships: true, website: 'https://www.u-tokyo.ac.jp' },
      { id: generateUUID(), name: 'ETH Zurich', country: 'Switzerland', description: 'World-renowned science and technology university', ranking: 8, tuition_range: 'CHF 1,460/year', has_scholarships: true, website: 'https://ethz.ch' }
    ];

    for (const uni of universities) {
      await connection.query(
        `INSERT IGNORE INTO universities (id, name, country, description, ranking, tuition_range, has_scholarships, website) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uni.id, uni.name, uni.country, uni.description, uni.ranking, uni.tuition_range, uni.has_scholarships, uni.website]
      );
    }
    console.log(`  ✅ ${universities.length} universities seeded`);

    // Sample Programs
    console.log('📖 Seeding programs...');
    const programs = [
      { university_id: universities[0].id, name: 'Computer Science', level: 'Master', duration: '2 years', tuition_fee: 52000, requirements: 'Bachelor\'s degree, GRE, TOEFL 100+' },
      { university_id: universities[0].id, name: 'Business Administration', level: 'Master', duration: '2 years', tuition_fee: 55000, requirements: 'Bachelor\'s degree, GMAT 700+, TOEFL 100+' },
      { university_id: universities[1].id, name: 'Mathematics', level: 'PhD', duration: '3-4 years', tuition_fee: 35000, requirements: 'Master\'s degree, Research proposal, IELTS 7.5+' },
      { university_id: universities[1].id, name: 'Law', level: 'Bachelor', duration: '3 years', tuition_fee: 32000, requirements: 'A-Levels, LNAT, IELTS 7.0+' },
      { university_id: universities[2].id, name: 'Data Science', level: 'Master', duration: '2 years', tuition_fee: 45000, requirements: 'Bachelor\'s in related field, Programming experience' },
      { university_id: universities[3].id, name: 'Mechanical Engineering', level: 'Master', duration: '2 years', tuition_fee: 0, requirements: 'Bachelor\'s in Engineering, German B1 or English C1' },
      { university_id: universities[4].id, name: 'Medicine', level: 'Bachelor', duration: '6 years', tuition_fee: 70000, requirements: 'ATAR 99+, UCAT, Interview' },
      { university_id: universities[5].id, name: 'Artificial Intelligence', level: 'Master', duration: '2 years', tuition_fee: 38000, requirements: 'Bachelor\'s in CS/Math, Programming experience' }
    ];

    for (const prog of programs) {
      await connection.query(
        `INSERT IGNORE INTO programs (id, university_id, name, level, duration, tuition_fee, requirements) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [generateUUID(), prog.university_id, prog.name, prog.level, prog.duration, prog.tuition_fee, prog.requirements]
      );
    }
    console.log(`  ✅ ${programs.length} programs seeded`);

    // Sample Scholarships
    console.log('🎓 Seeding scholarships...');
    const scholarships = [
      { name: 'Fulbright Scholarship', country: 'USA', amount: 'Full tuition + living expenses', level: 'Master', eligibility: 'Non-US citizens with bachelor\'s degree', deadline: '2025-10-01', description: 'Prestigious scholarship for international students' },
      { name: 'Chevening Scholarship', country: 'UK', amount: 'Full tuition + £12,000 stipend', level: 'Master', eligibility: 'Citizens of Chevening-eligible countries', deadline: '2025-11-05', description: 'UK government\'s global scholarship programme' },
      { name: 'DAAD Scholarship', country: 'Germany', amount: '€934/month', level: 'Master', eligibility: 'Bachelor\'s degree with 2 years experience', deadline: '2025-09-30', description: 'German Academic Exchange Service scholarship' },
      { name: 'Australia Awards', country: 'Australia', amount: 'Full tuition + living expenses', level: 'Master', eligibility: 'Citizens of participating countries', deadline: '2025-04-30', description: 'Australian government scholarships' },
      { name: 'Singapore International Graduate Award', country: 'Singapore', amount: 'Full tuition + S$3,200/month', level: 'PhD', eligibility: 'Master\'s degree, Strong research background', deadline: '2025-06-01', description: 'For PhD studies in science and engineering' },
      { name: 'MEXT Scholarship', country: 'Japan', amount: 'Full tuition + ¥144,000/month', level: 'Master', eligibility: 'Under 35 years, Bachelor\'s degree', deadline: '2025-04-15', description: 'Japanese government scholarship' }
    ];

    for (const scholarship of scholarships) {
      await connection.query(
        `INSERT IGNORE INTO scholarships (id, name, country, amount, level, eligibility, deadline, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [generateUUID(), scholarship.name, scholarship.country, scholarship.amount, scholarship.level, scholarship.eligibility, scholarship.deadline, scholarship.description]
      );
    }
    console.log(`  ✅ ${scholarships.length} scholarships seeded`);

    // Sample Courses
    console.log('📚 Seeding courses...');
    const courses = [
      { title: 'Application Guide E-book', type: 'free', price: 0, description: 'Comprehensive guide to university applications', duration: 'Self-paced', content: 'E-book download' },
      { title: 'SOP Writing Templates', type: 'free', price: 0, description: 'Professional statement of purpose templates', duration: 'Self-paced', content: 'Template files' },
      { title: 'IELTS Preparation Course', type: 'paid', price: 49, description: 'Complete IELTS preparation with practice tests', duration: '4 weeks', content: 'Video lessons + practice tests' },
      { title: 'Interview Skills Mastery', type: 'paid', price: 39, description: 'Master the art of university interviews', duration: '2 weeks', content: 'Video lessons + mock interviews' },
      { title: 'GRE Prep Course', type: 'paid', price: 79, description: 'Comprehensive GRE preparation', duration: '6 weeks', content: 'Video lessons + practice tests' },
      { title: 'Visa Application Guide', type: 'free', price: 0, description: 'Step-by-step visa application guidance', duration: 'Self-paced', content: 'E-book + checklists' }
    ];

    for (const course of courses) {
      await connection.query(
        `INSERT IGNORE INTO courses (id, title, type, price, description, duration, content, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, true)`,
        [generateUUID(), course.title, course.type, course.price, course.description, course.duration, course.content]
      );
    }
    console.log(`  ✅ ${courses.length} courses seeded`);

    // Sample Admin User
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'AdminPass123!', 10);
    const adminId = generateUUID();
    await connection.query(
      `INSERT IGNORE INTO users (id, full_name, email, password, role, is_active, subscription_type) VALUES (?, ?, ?, ?, 'admin', true, 'global')`,
      [adminId, 'System Administrator', process.env.ADMIN_EMAIL || 'admin@studyproglobal.com.bd', adminPassword]
    );
    console.log('  ✅ Admin user created');

    // Sample Demo User
    console.log('👤 Creating demo user...');
    const demoPassword = await bcrypt.hash('DemoUser123!', 10);
    const demoUserId = generateUUID();
    await connection.query(
      `INSERT IGNORE INTO users (id, full_name, email, password, country, academic_level, role, is_active, subscription_type, profile_complete) VALUES (?, ?, ?, ?, ?, ?, 'student', true, 'free', 60)`,
      [demoUserId, 'Demo Student', 'demo@studyproglobal.com.bd', demoPassword, 'Bangladesh', 'Bachelor']
    );
    console.log('  ✅ Demo user created');

    connection.release();
    console.log('\n✅ Database seeding completed successfully!\n');
    
    console.log('📝 Test credentials:');
    console.log('   Admin: admin@studyproglobal.com.bd / [ADMIN_PASSWORD from .env]');
    console.log('   Demo: demo@studyproglobal.com.bd / DemoUser123!\n');

  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    process.exit(1);
  }

  process.exit(0);
};

seedData();
