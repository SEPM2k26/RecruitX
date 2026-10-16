const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { companies, generateId } = require('../config/db');

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/companies
 * Query: ?search=name&industry=IT
 */
const getAllCompanies = (req, res) => {
  let result = [...companies];
  const { search, industry } = req.query;

  if (search) {
    const q = search.toLowerCase();
    result = result.filter((c) => c.name.toLowerCase().includes(q));
  }
  if (industry) result = result.filter((c) => c.industry === industry);

  res.json({ success: true, total: result.length, data: result });
};

/**
 * GET /api/admin/companies/:id
 */
const getCompanyById = (req, res) => {
  const company = companies.find((c) => c.id === req.params.id);
  if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
  res.json({ success: true, data: company });
};

/**
 * POST /api/admin/companies
 */
const createCompany = [
  body('name').trim().notEmpty().withMessage('Company name required'),
  body('industry').trim().notEmpty().withMessage('Industry required'),
  body('contactEmail').isEmail().withMessage('Valid contact email required'),
  validate,
  (req, res) => {
    const { name, industry, website, description, contactEmail, contactPhone, location } = req.body;

    if (companies.find((c) => c.name.toLowerCase() === name.toLowerCase())) {
      return res.status(409).json({ success: false, message: 'Company already exists' });
    }

    const newCompany = {
      id: generateId('comp'),
      name,
      industry,
      website: website || null,
      description: description || null,
      contactEmail,
      contactPhone: contactPhone || null,
      location: location || null,
      logoUrl: null,
      createdAt: new Date().toISOString(),
    };
    companies.push(newCompany);

    res.status(201).json({ success: true, message: 'Company created', data: newCompany });
  },
];

/**
 * PUT /api/admin/companies/:id
 */
const updateCompany = [
  body('name').optional().trim().notEmpty(),
  body('contactEmail').optional().isEmail(),
  validate,
  (req, res) => {
    const idx = companies.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Company not found' });

    const allowed = ['name', 'industry', 'website', 'description', 'contactEmail', 'contactPhone', 'location'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) companies[idx][key] = req.body[key];
    });
    companies[idx].updatedAt = new Date().toISOString();

    res.json({ success: true, message: 'Company updated', data: companies[idx] });
  },
];

/**
 * DELETE /api/admin/companies/:id
 */
const deleteCompany = (req, res) => {
  const idx = companies.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Company not found' });

  companies.splice(idx, 1);
  res.json({ success: true, message: 'Company deleted' });
};

module.exports = { getAllCompanies, getCompanyById, createCompany, updateCompany, deleteCompany };
