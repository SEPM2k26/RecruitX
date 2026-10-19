const { calculateProfileCompletion } = require('./student-profile.service');

const checkStudentEligibility = (student, drive) => {
  const hasNumber = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
  const profileCompletion = student ? calculateProfileCompletion(student) : 0;
  const checks = {
    profileCompletion: profileCompletion >= 100,
    cgpa: hasNumber(student?.cgpa) && hasNumber(drive?.minCGPA) && Number(student.cgpa) >= Number(drive.minCGPA),
    backlogs: hasNumber(student?.backlogs) && hasNumber(drive?.maxBacklogs) && Number(student.backlogs) <= Number(drive.maxBacklogs),
    branch: Array.isArray(drive?.eligibleBranches) && drive.eligibleBranches.includes(student?.branch),
    graduationYear: hasNumber(student?.graduationYear) && hasNumber(drive?.graduationYear) && Number(student.graduationYear) === Number(drive.graduationYear),
  };

  return {
    eligible: Object.values(checks).every(Boolean),
    profileCompletion,
    checks,
  };
};

module.exports = { checkStudentEligibility };
