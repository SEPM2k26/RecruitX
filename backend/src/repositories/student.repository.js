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

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeRegistrationNumber = (value) => String(value || '').trim().toUpperCase();

const findById = (id) => cache.find((student) => student.id === id) || null;

const findByEmail = (email) => {
  const normalized = normalizeEmail(email);
  return cache.find((student) => normalizeEmail(student.email) === normalized) || null;
};

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

module.exports = {
  findById,
  findByEmail,
  findByRegistrationNumber,
  create,
  update,
  normalizeEmail,
  normalizeRegistrationNumber,
  loadCache,
};
