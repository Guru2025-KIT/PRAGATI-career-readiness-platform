/**
 * Placement Drive Routes
 * Admin/Faculty: add, edit, delete drives
 * Students: view upcoming drives
 */
const router = require('express').Router();
const { PlacementDrive } = require('../models/index');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// GET /api/drives — all drives (students see upcoming, faculty see all)
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'student') {
      filter.driveDate = { $gte: new Date() };
    }
    const drives = await PlacementDrive
      .find(filter)
      .sort({ driveDate: 1 })
      .populate('companyId', 'name logoUrl')
      .populate('createdBy', 'name');
    res.json({ drives });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/drives — faculty/admin creates a drive
router.post('/', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const drive = await PlacementDrive.create({
      ...req.body,
      createdBy: req.user._id,
    });
    res.status(201).json({ drive, message: '✅ Drive created successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/drives/:id — update drive
router.patch('/:id', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const drive = await PlacementDrive.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!drive) return res.status(404).json({ error: 'Drive not found' });
    res.json({ drive, message: 'Drive updated' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/drives/:id
router.delete('/:id', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    await PlacementDrive.findByIdAndDelete(req.params.id);
    res.json({ message: 'Drive deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;