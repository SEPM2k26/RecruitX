const safeStudent = (student) => {
  if (!student) return null;
  const {
    password,
    resumeStoragePath,
    resumeMimeType,
    resumeSize,
    resumeUploadedAt,
    ...profile
  } = student;
  return {
    ...profile,
    profileCompletion: calculateProfileCompletion(student),
    resume: student.resumeFileName
      ? {
          fileName: student.resumeFileName,
          size: student.resumeSize,
          uploadedAt: student.resumeUploadedAt,
          downloadUrl: '/api/students/me/resume/file',
        }
      : null,
  };
};

const calculateProfileCompletion = (student) => {
  const checks = [
    Boolean(student.name),
    Boolean(student.email),
    Boolean(student.phone),
    Boolean(student.branch),
    Number.isInteger(Number(student.graduationYear)) && Number(student.graduationYear) > 0,
    Number.isFinite(Number(student.cgpa)) && Number(student.cgpa) > 0,
    student.backlogs !== null && student.backlogs !== undefined && Number.isFinite(Number(student.backlogs)),
    Array.isArray(student.skills) && student.skills.length > 0,
    Boolean(student.resumeFileName),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const getStudentResumeMetadata = (student) => {
  if (!student?.resumeFileName) return null;
  return {
    fileName: student.resumeFileName,
    mimeType: student.resumeMimeType,
    size: student.resumeSize,
    uploadedAt: student.resumeUploadedAt,
    downloadUrl: '/api/students/me/resume/file',
  };
};

module.exports = { safeStudent, calculateProfileCompletion, getStudentResumeMetadata };
