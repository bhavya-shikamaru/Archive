const checkEligibility = (student, drive) => {
  const reasons = [];

  if (drive.status !== 'open') {
    reasons.push('This placement drive is currently closed for applications.');
  }

  const now = new Date();
  const deadlineDate = new Date(drive.deadline);
  if (now > deadlineDate) {
    reasons.push(`Application deadline expired on ${deadlineDate.toLocaleString()}.`);
  }

  if (drive.company_approved !== undefined && Number(drive.company_approved) !== 1) {
    reasons.push('The recruiting company is not yet approved by the Placement Cell.');
  }

  const studentCgpa = parseFloat(student.cgpa || 0);
  const minCgpa = parseFloat(drive.min_cgpa || 0);
  if (studentCgpa < minCgpa) {
    reasons.push(`Your CGPA (${studentCgpa.toFixed(2)}) is below the required minimum of ${minCgpa.toFixed(2)}.`);
  }

  const studentBranch = (student.branch || '').trim().toUpperCase();
  const allowedBranchesList = (drive.allowed_branches || '')
    .split(',')
    .map(b => b.trim().toUpperCase())
    .filter(Boolean);

  if (allowedBranchesList.length > 0 && !allowedBranchesList.includes(studentBranch)) {
    reasons.push(
      `Your branch (${studentBranch}) is not eligible. Permitted branches: ${allowedBranchesList.join(', ')}.`
    );
  }

  const studentBacklogs = parseInt(student.backlogs || 0, 10);
  const maxBacklogs = parseInt(drive.max_backlogs || 0, 10);
  if (studentBacklogs > maxBacklogs) {
    reasons.push(
      `You have ${studentBacklogs} active backlog(s), exceeding the maximum allowed limit of ${maxBacklogs}.`
    );
  }

  return {
    isEligible: reasons.length === 0,
    reasons
  };
};

module.exports = {
  checkEligibility
};
