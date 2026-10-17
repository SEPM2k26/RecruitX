const database = require('../config/postgres');
const { generateId } = require('../config/db');

const mapStudent = (row) => row && ({
  id: row.id,
  authUserId: row.auth_user_id,
  name: row.name,
  email: row.email,
  password: row.password,
  role: row.role || 'student',
  registrationNumber: row.registration_number,
  cgpa: row.cgpa === null ? null : Number(row.cgpa),
  branch: row.branch,
  graduationYear: row.graduation_year,
  backlogs: row.backlogs,
  phone: row.phone,
  skills: Array.isArray(row.skills) ? row.skills : (typeof row.skills === 'string' ? JSON.parse(row.skills) : []),
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

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeRegistrationNumber = (value) => String(value || '').trim().toUpperCase();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (val) => typeof val === 'string' && UUID_REGEX.test(val);

const findByAuthUserId = async (authUserId) => {
  if (!isUuid(authUserId)) return null;
  const { rows } = await database.query(
    'SELECT * FROM public.students WHERE auth_user_id = $1 LIMIT 1',
    [authUserId],
  );
  return mapStudent(rows[0]);
};

const findById = async (id) => {
  const { rows } = await database.query('SELECT * FROM public.students WHERE id = $1 LIMIT 1', [id]);
  return mapStudent(rows[0]);
};

const findByEmail = async (email) => {
  const { rows } = await database.query(
    'SELECT * FROM public.students WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [normalizeEmail(email)],
  );
  return mapStudent(rows[0]);
};

const findByRegistrationNumber = async (registrationNumber) => {
  const { rows } = await database.query(
    'SELECT * FROM public.students WHERE UPPER(registration_number) = UPPER($1) LIMIT 1',
    [normalizeRegistrationNumber(registrationNumber)],
  );
  return mapStudent(rows[0]);
};

const updateByAuthUserId = async (authUserId, changes) => {
  if (!isUuid(authUserId)) return null;
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

const update = async (id, changes) => {
  const columns = {
    name: 'name', phone: 'phone', branch: 'branch', graduationYear: 'graduation_year',
    cgpa: 'cgpa', backlogs: 'backlogs', skills: 'skills', linkedinUrl: 'linkedin_url',
    portfolioUrl: 'portfolio_url', resumeUrl: 'resume_url', resumeFileName: 'resume_file_name',
    resumeStoragePath: 'resume_storage_path', resumeMimeType: 'resume_mime_type',
    resumeSize: 'resume_size', resumeUploadedAt: 'resume_uploaded_at', isActive: 'is_active',
  };
  const entries = Object.entries(changes).filter(([key]) => columns[key]);
  if (!entries.length) return findById(id);

  const assignments = entries.map(([key], index) => `${columns[key]} = $${index + 2}`).join(', ');
  const values = entries.map(([key, value]) => key === 'skills' ? JSON.stringify(value) : value);
  const { rows } = await database.query(
    `UPDATE public.students SET ${assignments}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values],
  );
  return mapStudent(rows[0]);
};

const create = async (student) => {
  const id = student.id || generateId('stu');
  const { rows } = await database.query(
    `INSERT INTO public.students (
      id, name, email, password, role, registration_number, cgpa, branch,
      graduation_year, backlogs, phone, skills, linkedin_url, portfolio_url,
      resume_url, resume_file_name, resume_storage_path, resume_mime_type,
      resume_size, resume_uploaded_at, auth_user_id, is_active
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
    ) RETURNING *`,
    [
      id,
      student.name,
      normalizeEmail(student.email),
      student.password || '',
      student.role || 'student',
      student.registrationNumber || null,
      student.cgpa || null,
      student.branch || null,
      student.graduationYear || null,
      student.backlogs || 0,
      student.phone || null,
      JSON.stringify(student.skills || []),
      student.linkedinUrl || null,
      student.portfolioUrl || null,
      student.resumeUrl || null,
      student.resumeFileName || null,
      student.resumeStoragePath || null,
      student.resumeMimeType || null,
      student.resumeSize || null,
      student.resumeUploadedAt || null,
      student.authUserId || null,
      student.isActive !== undefined ? student.isActive : true,
    ]
  );
  return mapStudent(rows[0]);
};

module.exports = {
  findById,
  findByAuthUserId,
  findByEmail,
  findByRegistrationNumber,
  updateByAuthUserId,
  update,
  create,
  mapStudent,
  normalizeEmail,
  normalizeRegistrationNumber,
};
