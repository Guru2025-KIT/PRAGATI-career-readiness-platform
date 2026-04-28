const router = require('express').Router();
const { Company } = require('../models/index');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// GET /api/companies
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, sector } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (sector) filter.sector = sector;
    const companies = await Company.find(filter).sort({ campusVisitDate: -1 });
    res.json({ companies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/companies/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json({ company });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/companies — admin only
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json({ message: 'Company added', company });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/companies/:id
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Company updated', company });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/companies/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.json({ message: 'Company deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
