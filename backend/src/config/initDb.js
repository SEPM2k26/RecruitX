const { Pool } = require('pg');
const config = require('./config');

const poolConfig = config.db.url
  ? { connectionString: config.db.url, ssl: config.db.ssl }
  : {
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
      user: config.db.user,
      password: config.db.password,
      ssl: config.db.ssl,
    };

const pool = new Pool(poolConfig);

const createTablesQuery = `
-- 1. Admins
CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Students
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'student',
  cgpa NUMERIC(4,2) DEFAULT 0.0,
  branch VARCHAR(100),
  graduation_year INTEGER,
  backlogs INTEGER DEFAULT 0,
  phone VARCHAR(50),
  skills JSONB DEFAULT '[]'::jsonb,
  resume_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Companies
CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  website VARCHAR(255),
  description TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  location VARCHAR(100),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Trainings
CREATE TABLE IF NOT EXISTS trainings (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructor VARCHAR(255),
  start_date VARCHAR(50),
  end_date VARCHAR(50),
  duration VARCHAR(100),
  mode VARCHAR(50) DEFAULT 'online',
  max_students INTEGER DEFAULT 50,
  status VARCHAR(50) DEFAULT 'upcoming',
  enrolled_students JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Placement Drives
CREATE TABLE IF NOT EXISTS placement_drives (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) REFERENCES companies(id) ON DELETE SET NULL,
  job_role VARCHAR(255) NOT NULL,
  package VARCHAR(100),
  location VARCHAR(100),
  application_deadline VARCHAR(50),
  eligible_branches JSONB DEFAULT '[]'::jsonb,
  min_cgpa NUMERIC(4,2) DEFAULT 0.0,
  max_backlogs INTEGER DEFAULT 0,
  graduation_year INTEGER,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Applications
CREATE TABLE IF NOT EXISTS applications (
  id VARCHAR(100) PRIMARY KEY,
  student_id VARCHAR(100) REFERENCES students(id) ON DELETE CASCADE,
  drive_id VARCHAR(100) REFERENCES placement_drives(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'Applied',
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, drive_id)
);

-- 7. Interviews
CREATE TABLE IF NOT EXISTS interviews (
  id VARCHAR(100) PRIMARY KEY,
  student_id VARCHAR(100) REFERENCES students(id) ON DELETE CASCADE,
  drive_id VARCHAR(100) REFERENCES placement_drives(id) ON DELETE CASCADE,
  application_id VARCHAR(100),
  round VARCHAR(100) NOT NULL,
  scheduled_at TIMESTAMPTZ,
  mode VARCHAR(50) DEFAULT 'online',
  meeting_link TEXT,
  venue TEXT,
  status VARCHAR(50) DEFAULT 'scheduled',
  result VARCHAR(50),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100),
  type VARCHAR(100) DEFAULT 'general',
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function seedDataIfEmpty() {
  // Check admins
  const { rows: adminRows } = await pool.query('SELECT count(*) FROM admins');
  if (parseInt(adminRows[0].count, 10) === 0) {
    console.log('🌱 Seeding admins table...');
    await pool.query(
      `INSERT INTO admins (id, name, email, password, role) VALUES
       ('admin-1', 'Super Admin', 'admin@recruitx.com', '$2b$10$ZMmMzS.uOZkXWQWq5avGC.KvId3W8z2fRQxHZkEjYqgIgmRnxhnce', 'admin')`
    );
  }

  // Check students
  const { rows: studentRows } = await pool.query('SELECT count(*) FROM students');
  if (parseInt(studentRows[0].count, 10) === 0) {
    console.log('🌱 Seeding students table...');
    await pool.query(
      `INSERT INTO students (id, name, email, password, role, cgpa, branch, graduation_year, backlogs, phone, skills) VALUES
       ('stu-1', 'Alice Johnson', 'alice@example.com', '$2b$10$ZMmMzS.uOZkXWQWq5avGC.KvId3W8z2fRQxHZkEjYqgIgmRnxhnce', 'student', 8.5, 'CSE', 2025, 0, '9876543210', '["React", "Node.js", "Python"]'::jsonb),
       ('stu-2', 'Bob Smith', 'bob@example.com', '$2b$10$ZMmMzS.uOZkXWQWq5avGC.KvId3W8z2fRQxHZkEjYqgIgmRnxhnce', 'student', 7.2, 'ECE', 2025, 1, '9876543211', '["C++", "Embedded Systems"]'::jsonb),
       ('stu-3', 'Carol White', 'carol@example.com', '$2b$10$ZMmMzS.uOZkXWQWq5avGC.KvId3W8z2fRQxHZkEjYqgIgmRnxhnce', 'student', 9.1, 'CSE', 2025, 0, '9876543212', '["Java", "Spring Boot", "SQL"]'::jsonb)`
    );
  }

  // Check companies
  const { rows: companyRows } = await pool.query('SELECT count(*) FROM companies');
  if (parseInt(companyRows[0].count, 10) === 0) {
    console.log('🌱 Seeding companies table...');
    await pool.query(
      `INSERT INTO companies (id, name, industry, website, description, contact_email, contact_phone, location) VALUES
       ('comp-1', 'TechCorp India', 'IT Services', 'https://techcorp.com', 'Leading IT services company', 'hr@techcorp.com', '0222345678', 'Mumbai'),
       ('comp-2', 'FinSolve', 'Fintech', 'https://finsolve.com', 'Modern fintech solutions provider', 'careers@finsolve.com', '0224567890', 'Pune')`
    );
  }

  // Check trainings
  const { rows: trainingRows } = await pool.query('SELECT count(*) FROM trainings');
  if (parseInt(trainingRows[0].count, 10) === 0) {
    console.log('🌱 Seeding trainings table...');
    await pool.query(
      `INSERT INTO trainings (id, title, description, instructor, start_date, end_date, duration, mode, max_students, status, enrolled_students) VALUES
       ('train-1', 'Full Stack Web Development', 'Comprehensive full-stack course covering React and Node.js', 'Mr. Sharma', '2025-01-15', '2025-03-15', '8 weeks', 'online', 30, 'active', '["stu-1"]'::jsonb),
       ('train-2', 'Data Structures & Algorithms', 'DSA preparation for placement interviews', 'Ms. Verma', '2025-02-01', '2025-04-01', '8 weeks', 'offline', 40, 'upcoming', '[]'::jsonb)`
    );
  }

  // Check placement drives
  const { rows: driveRows } = await pool.query('SELECT count(*) FROM placement_drives');
  if (parseInt(driveRows[0].count, 10) === 0) {
    console.log('🌱 Seeding placement_drives table...');
    await pool.query(
      `INSERT INTO placement_drives (id, company_id, job_role, package, location, application_deadline, eligible_branches, min_cgpa, max_backlogs, graduation_year, description, status) VALUES
       ('drive-1', 'comp-1', 'Software Engineer', '8 LPA', 'Mumbai', '2025-02-28', '["CSE", "IT"]'::jsonb, 7.0, 0, 2025, 'Full-stack development role', 'active'),
       ('drive-2', 'comp-2', 'Backend Developer', '6 LPA', 'Pune', '2025-03-10', '["CSE", "ECE", "IT"]'::jsonb, 6.5, 1, 2025, 'Java backend development role', 'active')`
    );
  }

  // Check applications
  const { rows: appRows } = await pool.query('SELECT count(*) FROM applications');
  if (parseInt(appRows[0].count, 10) === 0) {
    console.log('🌱 Seeding applications table...');
    await pool.query(
      `INSERT INTO applications (id, student_id, drive_id, status) VALUES
       ('app-1', 'stu-1', 'drive-1', 'Shortlisted'),
       ('app-2', 'stu-3', 'drive-1', 'Applied'),
       ('app-3', 'stu-2', 'drive-2', 'Applied')
       ON CONFLICT (student_id, drive_id) DO NOTHING`
    );
  }

  // Check interviews
  const { rows: interviewRows } = await pool.query('SELECT count(*) FROM interviews');
  if (parseInt(interviewRows[0].count, 10) === 0) {
    console.log('🌱 Seeding interviews table...');
    await pool.query(
      `INSERT INTO interviews (id, student_id, drive_id, application_id, round, scheduled_at, mode, meeting_link, status) VALUES
       ('int-1', 'stu-1', 'drive-1', 'app-1', 'Technical Interview', '2025-03-05T10:00:00Z', 'online', 'https://meet.google.com/abc-xyz', 'scheduled')`
    );
  }
}

async function initializeDatabase() {
  console.log('⏳ Connecting to PostgreSQL database...');
  try {
    await pool.query(createTablesQuery);
    console.log('✅ Tables created or verified successfully in database.');
    await seedDataIfEmpty();
    console.log('✅ Database initialization complete.');
    return pool;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Done! Exiting.');
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}

module.exports = {
  pool,
  initializeDatabase,
};
