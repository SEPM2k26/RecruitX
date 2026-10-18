const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function hash(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * RecruitX synthetic development seed.
 *
 * Safety notes:
 * - This script is for DEVELOPMENT / TEST databases only.
 * - Never run against a production database.
 * - Uses upsert so rerunning does not duplicate rows.
 * - Does not delete existing rows.
 * - All passwords are synthetic development hashes; no real or mock passwords are copied.
 */
async function main() {
  console.log('Seeding RecruitX development database...');

  // 1. Users (auth core)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@recruitx.dev' },
    update: {},
    create: {
      email: 'admin@recruitx.dev',
      passwordHash: await hash('dev_admin_123'),
      name: 'Dev Admin',
      role: 'ADMIN',
    },
  });

  const studentUser1 = await prisma.user.upsert({
    where: { email: 'alice.dev@recruitx.dev' },
    update: {},
    create: {
      email: 'alice.dev@recruitx.dev',
      passwordHash: await hash('dev_student_123'),
      name: 'Alice Dev',
      role: 'STUDENT',
    },
  });

  const studentUser2 = await prisma.user.upsert({
    where: { email: 'bob.dev@recruitx.dev' },
    update: {},
    create: {
      email: 'bob.dev@recruitx.dev',
      passwordHash: await hash('dev_student_456'),
      name: 'Bob Dev',
      role: 'STUDENT',
    },
  });

  const studentUser3 = await prisma.user.upsert({
    where: { email: 'carol.dev@recruitx.dev' },
    update: {},
    create: {
      email: 'carol.dev@recruitx.dev',
      passwordHash: await hash('dev_student_789'),
      name: 'Carol Dev',
      role: 'STUDENT',
    },
  });

  const recruiterUser1 = await prisma.user.upsert({
    where: { email: 'recruiter.techcorp@recruitx.dev' },
    update: {},
    create: {
      email: 'recruiter.techcorp@recruitx.dev',
      passwordHash: await hash('dev_recruiter_123'),
      name: 'TechCorp Recruiter',
      role: 'RECRUITER',
    },
  });

  const recruiterUser2 = await prisma.user.upsert({
    where: { email: 'recruiter.finsolve@recruitx.dev' },
    update: {},
    create: {
      email: 'recruiter.finsolve@recruitx.dev',
      passwordHash: await hash('dev_recruiter_456'),
      name: 'FinSolve Recruiter',
      role: 'RECRUITER',
    },
  });

  // 2. Student profiles (1:1 with User)
  const studentProfile1 = await prisma.studentProfile.upsert({
    where: { userId: studentUser1.id },
    update: {},
    create: {
      userId: studentUser1.id,
      cgpa: 8.5,
      branch: 'CSE',
      graduationYear: 2025,
      backlogs: 0,
      phone: '9876543210',
      skills: ['React', 'Node.js', 'Python'],
      resumeUrl: null,
      isActive: true,
    },
  });

  const studentProfile2 = await prisma.studentProfile.upsert({
    where: { userId: studentUser2.id },
    update: {},
    create: {
      userId: studentUser2.id,
      cgpa: 7.2,
      branch: 'ECE',
      graduationYear: 2025,
      backlogs: 1,
      phone: '9876543211',
      skills: ['C++', 'Embedded Systems'],
      resumeUrl: null,
      isActive: true,
    },
  });

  const studentProfile3 = await prisma.studentProfile.upsert({
    where: { userId: studentUser3.id },
    update: {},
    create: {
      userId: studentUser3.id,
      cgpa: 9.1,
      branch: 'CSE',
      graduationYear: 2025,
      backlogs: 0,
      phone: '9876543212',
      skills: ['Java', 'Spring Boot', 'SQL'],
      resumeUrl: null,
      isActive: true,
    },
  });


  // 3. Companies
  const companyTechcorp = await prisma.company.upsert({
    where: { id: 'comp-dev-techcorp' },
    update: {},
    create: {
      id: 'comp-dev-techcorp',
      name: 'TechCorp India',
      industry: 'IT Services',
      website: 'https://techcorp.dev',
      description: 'Leading IT services company',
      contactEmail: 'hr@techcorp.dev',
      contactPhone: '0222345678',
      location: 'Mumbai',
      logoUrl: null,
    },
  });

  const companyFinsolve = await prisma.company.upsert({
    where: { id: 'comp-dev-finsolve' },
    update: {},
    create: {
      id: 'comp-dev-finsolve',
      name: 'FinSolve',
      industry: 'Fintech',
      website: 'https://finsolve.dev',
      description: 'Modern fintech solutions provider',
      contactEmail: 'careers@finsolve.dev',
      contactPhone: '0224567890',
      location: 'Pune',
      logoUrl: null,
    },
  });

  // 4. Recruiter profiles (1:1 with User, N:1 to Company)
  const recruiterProfile1 = await prisma.recruiterProfile.upsert({
    where: { userId: recruiterUser1.id },
    update: {},
    create: {
      userId: recruiterUser1.id,
      companyId: companyTechcorp.id,
      jobTitle: 'Technical Recruiter',
      isPrimaryContact: true,
    },
  });

  const recruiterProfile2 = await prisma.recruiterProfile.upsert({
    where: { userId: recruiterUser2.id },
    update: {},
    create: {
      userId: recruiterUser2.id,
      companyId: companyFinsolve.id,
      jobTitle: 'Talent Acquisition Lead',
      isPrimaryContact: true,
    },
  });

  // 5. Placement drives (N:1 to Company)
  const driveTechcorp = await prisma.placementDrive.upsert({
    where: { id: 'drive-dev-techcorp-se' },
    update: {},
    create: {
      id: 'drive-dev-techcorp-se',
      companyId: companyTechcorp.id,
      jobRole: 'Software Engineer',
      package: '8 LPA',
      packageLpa: 8.0,
      location: 'Mumbai',
      applicationDeadline: new Date('2026-02-28T23:59:59Z'),
      eligibleBranches: ['CSE', 'IT'],
      minCGPA: 7.0,
      maxBacklogs: 0,
      graduationYear: 2025,
      description: 'Full-stack development role',
      status: 'ACTIVE',
    },
  });

  const driveFinsolve = await prisma.placementDrive.upsert({
    where: { id: 'drive-dev-finsolve-be' },
    update: {},
    create: {
      id: 'drive-dev-finsolve-be',
      companyId: companyFinsolve.id,
      jobRole: 'Backend Developer',
      package: '6 LPA',
      packageLpa: 6.5,
      location: 'Pune',
      applicationDeadline: new Date('2026-03-10T23:59:59Z'),
      eligibleBranches: ['CSE', 'ECE', 'IT'],
      minCGPA: 6.5,
      maxBacklogs: 1,
      graduationYear: 2025,
      description: 'Java backend development role',
      status: 'ACTIVE',
    },
  });

  const driveClosed = await prisma.placementDrive.upsert({
    where: { id: 'drive-dev-techcorp-closed' },
    update: {},
    create: {
      id: 'drive-dev-techcorp-closed',
      companyId: companyTechcorp.id,
      jobRole: 'Data Analyst',
      package: '7 LPA',
      packageLpa: 7.0,
      location: 'Bangalore',
      applicationDeadline: new Date('2026-01-15T23:59:59Z'),
      eligibleBranches: ['CSE', 'ECE'],
      minCGPA: 7.5,
      maxBacklogs: 0,
      graduationYear: 2025,
      description: 'Data analytics role (closed)',
      status: 'CLOSED',
    },
  });

  // 6. Applications (N:1 to StudentProfile, N:1 to PlacementDrive)
  const app1 = await prisma.application.upsert({
    where: { id: 'app-dev-1' },
    update: {},
    create: {
      id: 'app-dev-1',
      studentId: studentProfile1.id,
      driveId: driveTechcorp.id,
      status: 'SHORTLISTED',
      resumeUrl: null,
    },
  });

  const app2 = await prisma.application.upsert({
    where: { id: 'app-dev-2' },
    update: {},
    create: {
      id: 'app-dev-2',
      studentId: studentProfile3.id,
      driveId: driveTechcorp.id,
      status: 'APPLIED',
      resumeUrl: null,
    },
  });

  const app3 = await prisma.application.upsert({
    where: { id: 'app-dev-3' },
    update: {},
    create: {
      id: 'app-dev-3',
      studentId: studentProfile2.id,
      driveId: driveFinsolve.id,
      status: 'APPLIED',
      resumeUrl: null,
    },
  });

  // 7. Interviews (composite FK to Application(id, studentId, driveId))
  const interview1 = await prisma.interview.upsert({
    where: { id: 'int-dev-1' },
    update: {},
    create: {
      id: 'int-dev-1',
      applicationId: app1.id,
      studentId: studentProfile1.id,
      driveId: driveTechcorp.id,
      round: 'TECHNICAL_INTERVIEW',
      scheduledAt: new Date('2026-03-05T10:00:00Z'),
      mode: 'ONLINE',
      meetingLink: 'https://meet.google.com/dev-abc-xyz',
      venue: null,
      status: 'SCHEDULED',
      result: null,
      feedback: null,
    },
  });

  // 8. Final results (1:1 with Application via applicationId @unique)
  // (No final results seeded yet � Result is created when a placement decision is made.)

  // 9. Trainings
  const training1 = await prisma.training.upsert({
    where: { id: 'train-dev-fullstack' },
    update: {},
    create: {
      id: 'train-dev-fullstack',
      title: 'Full Stack Web Development',
      description: 'Comprehensive full-stack course covering React and Node.js',
      instructor: 'Mr. Sharma',
      startDate: new Date('2026-01-15T00:00:00Z'),
      endDate: new Date('2026-03-15T00:00:00Z'),
      duration: '8 weeks',
      mode: 'ONLINE',
      maxStudents: 30,
      status: 'ACTIVE',
    },
  });

  const training2 = await prisma.training.upsert({
    where: { id: 'train-dev-dsa' },
    update: {},
    create: {
      id: 'train-dev-dsa',
      title: 'Data Structures & Algorithms',
      description: 'DSA preparation for placement interviews',
      instructor: 'Ms. Verma',
      startDate: new Date('2026-02-01T00:00:00Z'),
      endDate: new Date('2026-04-01T00:00:00Z'),
      duration: '8 weeks',
      mode: 'OFFLINE',
      maxStudents: 40,
      status: 'UPCOMING',
    },
  });

  // 10. Enrollments (N:1 to StudentProfile, N:1 to Training)
  await prisma.enrollment.upsert({
    where: { id: 'enroll-dev-1' },
    update: {},
    create: {
      id: 'enroll-dev-1',
      studentId: studentProfile1.id,
      trainingId: training1.id,
    },
  });

  // 11. Notifications (N:1 to User)
  await prisma.notification.upsert({
    where: { id: 'notif-dev-1' },
    update: {},
    create: {
      id: 'notif-dev-1',
      userId: studentUser1.id,
      type: 'SHORTLISTED',
      message: 'Congratulations! You have been shortlisted for the Software Engineer role at TechCorp India.',
      read: false,
    },
  });

  await prisma.notification.upsert({
    where: { id: 'notif-dev-2' },
    update: {},
    create: {
      id: 'notif-dev-2',
      userId: studentUser2.id,
      type: 'INTERVIEW_SCHEDULED',
      message: 'You have been scheduled for Technical Interview on 5 Mar 2026.',
      read: false,
    },
  });

  console.log('Seed completed successfully.');
  console.log('Users: 1 admin, 3 students, 2 recruiters');
  console.log('Companies: TechCorp India, FinSolve');
  console.log('Drives: 3 (1 closed, 2 active with packageLpa values 8.0 and 6.5)');
  console.log('Applications: 3; Interviews: 1; Trainings: 2; Enrollments: 1; Notifications: 2');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
