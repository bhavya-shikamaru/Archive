const { checkEligibility } = require('../services/eligibility');

console.log('🧪 Starting Eligibility Engine Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
  }
}

const baseStudent = {
  name: 'Rahul Sharma',
  branch: 'CSE',
  cgpa: 8.85,
  backlogs: 0
};

const baseDrive = {
  title: 'Google SDE 2026',
  status: 'open',
  company_approved: 1,
  min_cgpa: 7.50,
  allowed_branches: 'CSE,IT',
  max_backlogs: 0,
  deadline: new Date(Date.now() + 86400000 * 30).toISOString() 
};

{
  const res = checkEligibility(baseStudent, baseDrive);
  assert(res.isEligible === true && res.reasons.length === 0, 'Eligible student should pass all criteria');
}

{
  const student = { ...baseStudent, cgpa: 6.40 };
  const res = checkEligibility(student, baseDrive);
  assert(res.isEligible === false && res.reasons.some(r => r.includes('below the required minimum')), 'Low CGPA must fail');
}

{
  const student = { ...baseStudent, branch: 'MECH' };
  const res = checkEligibility(student, baseDrive);
  assert(res.isEligible === false && res.reasons.some(r => r.includes('not eligible')), 'Disallowed branch must fail');
}

{
  const student = { ...baseStudent, backlogs: 2 };
  const res = checkEligibility(student, baseDrive);
  assert(res.isEligible === false && res.reasons.some(r => r.includes('active backlog')), 'Exceeded backlogs must fail');
}

{
  const drive = { ...baseDrive, deadline: new Date(Date.now() - 86400000).toISOString() }; 
  const res = checkEligibility(baseStudent, drive);
  assert(res.isEligible === false && res.reasons.some(r => r.includes('deadline expired')), 'Expired deadline must fail');
}

{
  const drive = { ...baseDrive, company_approved: 0 };
  const res = checkEligibility(baseStudent, drive);
  assert(res.isEligible === false && res.reasons.some(r => r.includes('not yet approved')), 'Unapproved company drive must fail');
}

console.log(`\n📊 Test Results: ${passedTests}/${totalTests} Passed.`);
if (passedTests === totalTests) {
  console.log('🎉 ALL ELIGIBILITY LOGIC TESTS PASSED PERFECTLY!\n');
  process.exit(0);
} else {
  process.exit(1);
}
