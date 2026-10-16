const { v4: uuidv4 } = require('uuid');

// In-memory store — Person 3 will replace with real DB queries
// Seed data for development
const admins = [
  {
    id: 'admin-1',
    name: 'Super Admin',
    email: 'admin@recruitx.com',
    // bcrypt hash of 'password'
    password: '$2b$10$ZMmMzS.uOZkXWQWq5avGC.KvId3W8z2fRQxHZkEjYqgIgmRnxhnce',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
];

const students = [
  {
    id: 'stu-1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: '$2b$10$ZMmMzS.uOZkXWQWq5avGC.KvId3W8z2fRQxHZkEjYqgIgmRnxhnce',
    role: 'student',
    cgpa: 8.5,
    branch: 'CSE',
    graduationYear: 2025,
    backlogs: 0,
    phone: '9876543210',
    skills: ['React', 'Node.js', 'Python'],
    resumeUrl: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stu-2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    password: '$2b$10$ZMmMzS.uOZkXWQWq5avGC.KvId3W8z2fRQxHZkEjYqgIgmRnxhnce',
    role: 'student',
    cgpa: 7.2,
    branch: 'ECE',
    graduationYear: 2025,
    backlogs: 1,
    phone: '9876543211',
    skills: ['C++', 'Embedded Systems'],
    resumeUrl: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stu-3',
    name: 'Carol White',
    email: 'carol@example.com',
    password: '$2b$10$ZMmMzS.uOZkXWQWq5avGC.KvId3W8z2fRQxHZkEjYqgIgmRnxhnce',
    role: 'student',
    cgpa: 9.1,
    branch: 'CSE',
    graduationYear: 2025,
    backlogs: 0,
    phone: '9876543212',
    skills: ['Java', 'Spring Boot', 'SQL'],
    resumeUrl: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

const companies = [
  {
    id: 'comp-1',
    name: 'TechCorp India',
    industry: 'IT Services',
    website: 'https://techcorp.com',
    description: 'Leading IT services company',
    contactEmail: 'hr@techcorp.com',
    contactPhone: '0222345678',
    location: 'Mumbai',
    logoUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'comp-2',
    name: 'FinSolve',
    industry: 'Fintech',
    website: 'https://finsolve.com',
    description: 'Modern fintech solutions provider',
    contactEmail: 'careers@finsolve.com',
    contactPhone: '0224567890',
    location: 'Pune',
    logoUrl: null,
    createdAt: new Date().toISOString(),
  },
];

const trainings = [
  {
    id: 'train-1',
    title: 'Full Stack Web Development',
    description: 'Comprehensive full-stack course covering React and Node.js',
    instructor: 'Mr. Sharma',
    startDate: '2025-01-15',
    endDate: '2025-03-15',
    duration: '8 weeks',
    mode: 'online',
    maxStudents: 30,
    status: 'active',
    enrolledStudents: ['stu-1'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'train-2',
    title: 'Data Structures & Algorithms',
    description: 'DSA preparation for placement interviews',
    instructor: 'Ms. Verma',
    startDate: '2025-02-01',
    endDate: '2025-04-01',
    duration: '8 weeks',
    mode: 'offline',
    maxStudents: 40,
    status: 'upcoming',
    enrolledStudents: [],
    createdAt: new Date().toISOString(),
  },
];

const placementDrives = [
  {
    id: 'drive-1',
    companyId: 'comp-1',
    jobRole: 'Software Engineer',
    package: '8 LPA',
    location: 'Mumbai',
    applicationDeadline: '2025-02-28',
    eligibleBranches: ['CSE', 'IT'],
    minCGPA: 7.0,
    maxBacklogs: 0,
    graduationYear: 2025,
    description: 'Full-stack development role',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'drive-2',
    companyId: 'comp-2',
    jobRole: 'Backend Developer',
    package: '6 LPA',
    location: 'Pune',
    applicationDeadline: '2025-03-10',
    eligibleBranches: ['CSE', 'ECE', 'IT'],
    minCGPA: 6.5,
    maxBacklogs: 1,
    graduationYear: 2025,
    description: 'Java backend development role',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
];

const applications = [
  {
    id: 'app-1',
    studentId: 'stu-1',
    driveId: 'drive-1',
    status: 'Shortlisted',
    appliedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'app-2',
    studentId: 'stu-3',
    driveId: 'drive-1',
    status: 'Applied',
    appliedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'app-3',
    studentId: 'stu-2',
    driveId: 'drive-2',
    status: 'Applied',
    appliedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const interviews = [
  {
    id: 'int-1',
    studentId: 'stu-1',
    driveId: 'drive-1',
    applicationId: 'app-1',
    round: 'Technical Interview',
    scheduledAt: '2025-03-05T10:00:00Z',
    mode: 'online',
    meetingLink: 'https://meet.google.com/abc-xyz',
    status: 'scheduled',
    result: null,
    feedback: null,
    createdAt: new Date().toISOString(),
  },
];

const notifications = [];

// Helper to generate IDs
const generateId = (prefix) => `${prefix}-${uuidv4().split('-')[0]}`;

module.exports = {
  admins,
  students,
  companies,
  trainings,
  placementDrives,
  applications,
  interviews,
  notifications,
  generateId,
};
