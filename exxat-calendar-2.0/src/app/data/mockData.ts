// Candidate Stages - Common entity for all candidate workflows
export const CANDIDATE_STAGES = {
  TALENT_POOL: 'Talent Pool',
  SCREENING: 'Screening',
  QUALIFIED: 'Qualified',
  HIRED: 'Hired',
  DISQUALIFIED: 'Disqualified',
} as const;

export type CandidateStage = typeof CANDIDATE_STAGES[keyof typeof CANDIDATE_STAGES];

// Candidate Entity
export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobId: string; // Foreign key to JobOpening
  stage: CandidateStage;
  appliedDate: string;
  lastActivityDate: string;
  resumeUrl?: string;
  notes?: string;
  rating?: number; // 1-5 stars
  yearsOfExperience: number;
  currentTitle?: string;
  currentEmployer?: string;
}

// Job Opening Entity
export interface JobOpening {
  id: string;
  title: string;
  jobType: 'Full-Time' | 'Part-Time' | 'Contract' | 'Per Diem' | 'Travel';
  location: string;
  hospitalName: string;
  discipline: string;
  department: string;
  status: 'Active' | 'Draft' | 'Closed' | 'On Hold';
  postedDate: string;
  views: number;
  activeCandidates: number;
  lastUpdated: string;
  atsSource?: 'internal' | 'external';
  atsSourceName?: string;
  description?: string;
  requirements?: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
}

// Health Science specific job titles
const healthScienceJobTitles = [
  'Registered Nurse - ICU',
  'Registered Nurse - Emergency Department',
  'Registered Nurse - Medical/Surgical',
  'Registered Nurse - Pediatrics',
  'Registered Nurse - Labor & Delivery',
  'Registered Nurse - Oncology',
  'Registered Nurse - NICU',
  'Registered Nurse - Operating Room',
  'Nurse Practitioner - Family Medicine',
  'Nurse Practitioner - Acute Care',
  'Physician Assistant - Emergency Medicine',
  'Physician Assistant - Surgery',
  'Physical Therapist',
  'Occupational Therapist',
  'Speech Language Pathologist',
  'Respiratory Therapist',
  'Radiologic Technologist',
  'Medical Laboratory Scientist',
  'Clinical Laboratory Technician',
  'Pharmacist - Clinical',
  'Pharmacy Technician',
  'Certified Nursing Assistant',
  'Medical Assistant',
  'Phlebotomist',
  'Surgical Technologist',
  'Diagnostic Medical Sonographer',
  'Cardiovascular Technologist',
  'Nuclear Medicine Technologist',
  'Radiation Therapist',
  'MRI Technologist',
  'CT Technologist',
  'Mammography Technologist',
  'Clinical Dietitian',
  'Clinical Social Worker',
  'Case Manager - RN',
  'Utilization Review Nurse',
  'Infection Prevention Specialist',
  'Clinical Nurse Educator',
  'Nurse Manager - Med/Surg',
  'Director of Nursing',
  'Clinical Research Coordinator',
  'Anesthesiologist Assistant',
  'Perfusionist',
  'Genetic Counselor',
  'Audiologist',
  'Orthotist/Prosthetist',
  'Mental Health Counselor',
  'Psychiatric Nurse Practitioner',
  'Pediatric Nurse Practitioner',
  'Neonatal Nurse Practitioner',
  'Emergency Medical Technician - Paramedic',
  'Sterile Processing Technician',
  'Patient Care Coordinator',
  'Health Information Technician',
  'Medical Coder',
  'Health Educator',
  'Exercise Physiologist',
  'Cardiac Rehabilitation Specialist',
  'Wound Care Specialist',
  'Dialysis Technician',
  'Ophthalmic Technician',
  'Dental Hygienist',
  'Dental Assistant',
  'Medical Scribe',
  'Patient Navigator',
  'Transplant Coordinator',
  'Clinical Informatics Specialist',
  'Telehealth Coordinator',
  'Quality Improvement Specialist',
  'Patient Safety Officer',
  'Clinical Pharmacist - Oncology',
  'Clinical Pharmacist - Critical Care',
  'Pediatric Physical Therapist',
  'Geriatric Nurse Practitioner',
  'Hospice Nurse',
  'Home Health Nurse',
  'School Nurse',
  'Occupational Health Nurse',
  'Infection Control Nurse',
  'Lactation Consultant',
  'Certified Registered Nurse Anesthetist',
  'Clinical Nurse Specialist - Critical Care',
  'Vascular Technologist',
  'Sleep Technologist',
  'Electrophysiology Technologist',
  'Interventional Radiology Technologist',
  'Bone Densitometry Technologist',
  'Medical Laboratory Supervisor',
  'Pharmacy Manager',
  'Rehabilitation Director',
  'Laboratory Director',
  'Radiology Manager',
  'Emergency Department Manager',
  'Operating Room Manager',
  'Clinical Operations Manager',
  'Healthcare Compliance Officer',
  'Medical Staff Coordinator',
  'Credentialing Specialist',
  'Patient Experience Coordinator',
  'Healthcare Data Analyst',
];

// Health science disciplines
const disciplines = [
  'Nursing',
  'Allied Health',
  'Pharmacy',
  'Laboratory',
  'Radiology',
  'Rehabilitation',
  'Respiratory',
  'Surgery',
  'Emergency Medicine',
  'Critical Care',
  'Pediatrics',
  'Oncology',
  'Mental Health',
  'Primary Care',
  'Administration',
];

// Locations (major healthcare markets)
const locations = [
  'New York, NY',
  'Los Angeles, CA',
  'Chicago, IL',
  'Houston, TX',
  'Philadelphia, PA',
  'Phoenix, AZ',
  'San Antonio, TX',
  'San Diego, CA',
  'Dallas, TX',
  'San Francisco, CA',
  'Boston, MA',
  'Seattle, WA',
  'Denver, CO',
  'Atlanta, GA',
  'Miami, FL',
  'Baltimore, MD',
  'Minneapolis, MN',
  'Detroit, MI',
  'Portland, OR',
  'Cleveland, OH',
  'Remote',
];

// Hospital names
const hospitalNames = [
  'St. Mary\'s Medical Center',
  'Memorial Hospital',
  'University Health System',
  'Regional Medical Center',
  'Community General Hospital',
  'Children\'s Hospital',
  'Veterans Memorial Hospital',
  'Mercy Hospital',
  'Good Samaritan Medical Center',
  'Providence Regional Medical Center',
  'Scripps Health',
  'Kaiser Permanente',
  'Mayo Clinic',
  'Cleveland Clinic',
  'Johns Hopkins Hospital',
  'Massachusetts General Hospital',
  'New York-Presbyterian Hospital',
  'UCSF Medical Center',
  'Barnes-Jewish Hospital',
  'Cedars-Sinai Medical Center',
];

// Departments
const departments = [
  'Emergency Department',
  'Intensive Care Unit',
  'Medical/Surgical',
  'Pediatrics',
  'Women\'s Health',
  'Oncology',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Radiology',
  'Laboratory Services',
  'Pharmacy',
  'Rehabilitation Services',
  'Respiratory Care',
  'Operating Room',
  'Outpatient Services',
  'Behavioral Health',
  'Primary Care',
  'Specialty Clinic',
  'Administration',
];

// ATS Sources
const atsSourceNames = [
  'Indeed',
  'LinkedIn',
  'Greenhouse',
  'Workday',
  'iCIMS',
  'Taleo',
  'JobVite',
  'SmartRecruiters',
];

// First names
const firstNames = [
  'Sarah', 'Michael', 'Jennifer', 'David', 'Emily', 'James', 'Lisa', 'Robert',
  'Maria', 'William', 'Jessica', 'John', 'Amanda', 'Daniel', 'Ashley', 'Matthew',
  'Melissa', 'Christopher', 'Nicole', 'Andrew', 'Elizabeth', 'Joshua', 'Rachel',
  'Kevin', 'Stephanie', 'Brian', 'Lauren', 'Thomas', 'Rebecca', 'Ryan',
  'Michelle', 'Jason', 'Samantha', 'Justin', 'Angela', 'Brandon', 'Heather',
  'Eric', 'Brittany', 'Jacob', 'Kimberly', 'Nicholas', 'Christina', 'Tyler',
  'Amy', 'Aaron', 'Victoria', 'Jonathan', 'Megan', 'Steven',
];

// Last names
const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen',
  'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera',
  'Campbell', 'Mitchell', 'Carter', 'Roberts',
];

// Current titles for candidates
const candidateTitles = [
  'Registered Nurse',
  'Senior Nurse',
  'Staff Nurse',
  'Clinical Nurse',
  'Travel Nurse',
  'Nurse Practitioner',
  'Physical Therapist',
  'Occupational Therapist',
  'Pharmacist',
  'Pharmacy Technician',
  'Medical Technologist',
  'Radiologic Technologist',
  'Respiratory Therapist',
  'Medical Assistant',
  'Physician Assistant',
  'Case Manager',
  'Clinical Coordinator',
  'Healthcare Administrator',
  'Lab Technician',
  'Surgical Technologist',
];

// Helper functions
function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate mock job openings
function generateMockJobs(): JobOpening[] {
  const jobs: JobOpening[] = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-11-10');
  
  for (let i = 1; i <= 100; i++) {
    const postedDate = randomDate(startDate, endDate);
    const lastUpdatedDate = randomDate(new Date(postedDate), new Date('2024-11-10'));
    const jobType = randomElement(['Full-Time', 'Part-Time', 'Contract', 'Per Diem', 'Travel'] as const);
    const status = randomElement(['Active', 'Draft', 'Closed', 'On Hold'] as const);
    const useAts = Math.random() > 0.5;
    
    jobs.push({
      id: String(i),
      title: randomElement(healthScienceJobTitles),
      jobType,
      location: randomElement(locations),
      hospitalName: randomElement(hospitalNames),
      discipline: randomElement(disciplines),
      department: randomElement(departments),
      status,
      postedDate,
      views: randomInt(50, 2000),
      activeCandidates: 0, // Will be calculated from candidates
      lastUpdated: lastUpdatedDate,
      ...(useAts && {
        atsSource: randomElement(['internal', 'external'] as const),
        atsSourceName: randomElement(atsSourceNames),
      }),
    });
  }
  
  return jobs;
}

// Generate mock candidates for a job
function generateCandidatesForJob(jobId: string, count: number): Candidate[] {
  const candidates: Candidate[] = [];
  const stages = Object.values(CANDIDATE_STAGES);
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-11-10');
  
  for (let i = 1; i <= count; i++) {
    const appliedDate = randomDate(startDate, endDate);
    const lastActivityDate = randomDate(new Date(appliedDate), new Date('2024-11-10'));
    const candidateId = `${jobId}-${i}`;
    
    candidates.push({
      id: candidateId,
      firstName: randomElement(firstNames),
      lastName: randomElement(lastNames),
      email: `candidate${candidateId}@example.com`,
      phone: `(${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
      jobId,
      stage: randomElement(stages),
      appliedDate,
      lastActivityDate,
      rating: Math.random() > 0.3 ? randomInt(1, 5) : undefined,
      yearsOfExperience: randomInt(0, 25),
      currentTitle: Math.random() > 0.2 ? randomElement(candidateTitles) : undefined,
      currentEmployer: Math.random() > 0.3 ? randomElement(hospitalNames) : undefined,
    });
  }
  
  return candidates;
}

// Generate all mock data
export function generateMockData() {
  const jobs = generateMockJobs();
  const allCandidates: Candidate[] = [];
  
  // Generate 3-30 candidates for each job
  jobs.forEach(job => {
    const candidateCount = randomInt(3, 30);
    const candidates = generateCandidatesForJob(job.id, candidateCount);
    allCandidates.push(...candidates);
    
    // Update activeCandidates count for job (excluding Hired and Disqualified)
    job.activeCandidates = candidates.filter(c => 
      c.stage !== CANDIDATE_STAGES.HIRED && c.stage !== CANDIDATE_STAGES.DISQUALIFIED
    ).length;
  });
  
  return { jobs, candidates: allCandidates };
}

// Export the generated data
export const { jobs: mockJobs, candidates: mockCandidates } = generateMockData();

// Helper function to get candidates for a specific job
export function getCandidatesForJob(jobId: string): Candidate[] {
  return mockCandidates.filter(candidate => candidate.jobId === jobId);
}

// Helper function to get candidates by stage
export function getCandidatesByStage(jobId: string, stage: CandidateStage): Candidate[] {
  return mockCandidates.filter(
    candidate => candidate.jobId === jobId && candidate.stage === stage
  );
}

// Helper function to get candidate count by stage for a job
export function getCandidateCountByStage(jobId: string): Record<CandidateStage, number> {
  const candidates = getCandidatesForJob(jobId);
  const counts = {
    [CANDIDATE_STAGES.TALENT_POOL]: 0,
    [CANDIDATE_STAGES.SCREENING]: 0,
    [CANDIDATE_STAGES.QUALIFIED]: 0,
    [CANDIDATE_STAGES.HIRED]: 0,
    [CANDIDATE_STAGES.DISQUALIFIED]: 0,
  } as Record<CandidateStage, number>;
  
  candidates.forEach(candidate => {
    counts[candidate.stage]++;
  });
  
  return counts;
}
