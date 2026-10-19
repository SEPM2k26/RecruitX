const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { companies } = require('../config/db');

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/companies
 * Query: ?search=name&industry=IT
 */
const getAllCompanies = async (req, res, next) => {
  try {
    const { search, industry } = req.query;
    const result = await companies.findAll({ search, industry });
    res.json({ success: true, total: result.length, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/companies/:id
 */
const getCompanyById = async (req, res, next) => {
  try {
    const company = await companies.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/companies
 */
const createCompany = [
  body('name').trim().notEmpty().withMessage('Company name required'),
  body('industry').trim().notEmpty().withMessage('Industry required'),
  body('contactEmail').isEmail().withMessage('Valid contact email required'),
  validate,
  async (req, res, next) => {
    try {
      const { name, industry, website, description, contactEmail, contactPhone, location } = req.body;

      const existing = await companies.findByName(name);
      if (existing) {
        return res.status(409).json({ success: false, message: 'Company already exists' });
      }

      const newCompany = await companies.create({
        name,
        industry,
        website,
        description,
        contactEmail,
        contactPhone,
        location,
      });

      res.status(201).json({ success: true, message: 'Company created', data: newCompany });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * PUT /api/admin/companies/:id
 */
const updateCompany = [
  body('name').optional().trim().notEmpty(),
  body('contactEmail').optional().isEmail(),
  validate,
  async (req, res, next) => {
    try {
      const existing = await companies.findById(req.params.id);
      if (!existing) return res.status(404).json({ success: false, message: 'Company not found' });

      const allowed = ['name', 'industry', 'website', 'description', 'contactEmail', 'contactPhone', 'location', 'logoUrl'];
      const updates = {};
      allowed.forEach((key) => {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      });

      const updated = await companies.update(req.params.id, updates);
      res.json({ success: true, message: 'Company updated', data: updated });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * DELETE /api/admin/companies/:id
 */
const deleteCompany = async (req, res, next) => {
  try {
    const existing = await companies.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Company not found' });

    await companies.delete(req.params.id);
    res.json({ success: true, message: 'Company deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllCompanies, getCompanyById, createCompany, updateCompany, deleteCompany };
