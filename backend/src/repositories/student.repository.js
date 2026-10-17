const database = require('../config/postgres');
const { students: studentModel } = require('../config/db');

let cache = [];

// Load cache from PostgreSQL database
async function loadCache() {
  try {
    cache = await studentModel.findAll();
  } catch (err) {
    console.error('Failed to load student repository cache from DB:', err.message);
  }
}

// Initial load
loadCache();

const mapStudent = (row) => row && ({
  id: row.id,
  authUserId: row.auth_user_id,
  name: row.name,
  email: row.email,
  role: row.role || 'student',
  registrationNumber: row.registration_number,
  cgpa: row.cgpa === null ? null : Number(row.cgpa),
  branch: row.branch,
  graduationYear: row.graduation_year,
  backlogs: row.backlogs,
  phone: row.phone,
  skills: Array.isArray(row.skills) ? row.skills : [],
  resumeUrl: row.resume_url,
  resumeFileName: row.resume_file_name,
  resumeStoragePath: row.resume_storage_path,
  resumeMimeType: row.resume_mime_type,
  resumeSize: row.resume_size === null ? null : Number(row.resume_size),
  resumeUploadedAt: row.resume_uploaded_at,
  linkedinUrl: row.linkedin_url,
  portfolioUrl: row.portfolio_url,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const findByAuthUserId = async (authUserId) => {
  const { rows } = await database.query(
    'SELECT * FROM public.students WHERE auth_user_id = $1 LIMIT 1',
    [authUserId],
  );
  return mapStudent(rows[0]);
};

const updateByAuthUserId = async (authUserId, changes) => {
  const columns = {
    name: 'name', phone: 'phone', branch: 'branch', graduationYear: 'graduation_year',
    cgpa: 'cgpa', backlogs: 'backlogs', skills: 'skills', linkedinUrl: 'linkedin_url',
    portfolioUrl: 'portfolio_url', resumeUrl: 'resume_url', resumeFileName: 'resume_file_name',
    resumeStoragePath: 'resume_storage_path', resumeMimeType: 'resume_mime_type',
    resumeSize: 'resume_size', resumeUploadedAt: 'resume_uploaded_at',
  };
  const entries = Object.entries(changes).filter(([key]) => columns[key]);
  if (!entries.length) return findByAuthUserId(authUserId);

  const assignments = entries.map(([key], index) => `${columns[key]} = $${index + 2}`).join(', ');
  const values = entries.map(([key, value]) => key === 'skills' ? JSON.stringify(value) : value);
  const { rows } = await database.query(
    `UPDATE public.students SET ${assignments}, updated_at = NOW() WHERE auth_user_id = $1 RETURNING *`,
    [authUserId, ...values],
  );
  return mapStudent(rows[0]);
};

const findById = async (id) => {
  const { rows } = await database.query('SELECT * FROM public.students WHERE id = $1 LIMIT 1', [id]);
  return mapStudent(rows[0]);

  const findByRegistrationNumber = (registrationNumber) => {
    const normalized = normalizeRegistrationNumber(registrationNumber);
    return cache.find((student) => normalizeRegistrationNumber(student.registrationNumber) === normalized) || null;
  };

  const create = (student) => {
    cache.push(student);
    studentModel.create(student).catch((err) => {
      console.error('Failed to persist new student in database:', err.message);
    });
    return student;
  };

  const update = (id, changes) => {
    const student = findById(id);
    if (!student) return null;
    Object.assign(student, changes, { updatedAt: new Date().toISOString() });
    studentModel.update(id, changes).catch((err) => {
      console.error('Failed to persist student updates in database:', err.message);
    });
    return student;
  };

  module.exports = { findById, findByAuthUserId, updateByAuthUserId, mapStudent };
