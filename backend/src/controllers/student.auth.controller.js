const students = require('../repositories/student.repository');
const { safeStudent } = require('../services/student-profile.service');

const getMe = async (req, res, next) => {
  try {
    const student = await students.findByAuthUserId(req.user.id);
    if (!student) {
      return res.status(409).json({
        success: false,
        message: 'Your Supabase account is valid, but its student profile is not linked yet. Contact the placement office.',
      });
    }
    if (student.isActive === false) return res.status(403).json({ success: false, message: 'This student account is inactive.' });
    return res.json({ success: true, user: safeStudent(student) });
  } catch (error) { return next(error); }
};

module.exports = { getMe };
