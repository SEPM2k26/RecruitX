const { students } = require('../config/db');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeRegistrationNumber = (value) => String(value || '').trim().toUpperCase();

const findById = (id) => students.find((student) => student.id === id) || null;
const findByEmail = (email) => {
  const normalized = normalizeEmail(email);
  return students.find((student) => normalizeEmail(student.email) === normalized) || null;
};
const findByRegistrationNumber = (registrationNumber) => {
  const normalized = normalizeRegistrationNumber(registrationNumber);
  return students.find((student) => normalizeRegistrationNumber(student.registrationNumber) === normalized) || null;
};
const create = (student) => {
  students.push(student);
  return student;
};
const update = (id, changes) => {
  const student = findById(id);
  if (!student) return null;
  Object.assign(student, changes, { updatedAt: new Date().toISOString() });
  return student;
};

module.exports = { findById, findByEmail, findByRegistrationNumber, create, update, normalizeEmail, normalizeRegistrationNumber };
