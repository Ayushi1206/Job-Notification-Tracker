// Job Notification Tracker - App Logic

let currentFilters = {
  keyword: '',
  location: '',
  mode: '',
  experience: '',
  source: '',
  sort: 'latest',
  showOnlyMatches: false,
  status: ''
};

let selectedJobId = null;
let userPreferences = null;
let jobStatuses = {};

// Get saved jobs from localStorage
function getSavedJobs() {
  const saved = localStorage.getItem('savedJobs');
  return saved ? JSON.parse(saved) : [];
}

// Get user preferences from localStorage
function getUserPreferences() {
  const prefs = localStorage.getItem('jobTrackerPreferences');
  return prefs ? JSON.parse(prefs) : null;
}

// Save user preferences to localStorage
function saveUserPreferences(preferences) {
  localStorage.setItem('jobTrackerPreferences', JSON.stringify(preferences));
  userPreferences = preferences;
}

// Get job statuses from localStorage
function getJobStatuses() {
  const statuses = localStorage.getItem('jobTrackerStatus');
  return statuses ? JSON.parse(statuses) : {};
}

// Get status for a specific job
function getJobStatus(jobId) {
  return jobStatuses[jobId] || 'Not Applied';
}

// Update job status
function updateJobStatus(jobId, status) {
  jobStatuses[jobId] = status;
  localStorage.setItem('jobTrackerStatus', JSON.stringify(jobStatuses));
  
  // Add to status history
  const history = getStatusHistory();
  history.unshift({
    jobId,
    status,
    date: new Date().toISOString()
  });
  // Keep only last 20 updates
  localStorage.setItem('jobTrackerStatusHistory', JSON.stringify(history.slice(0, 20)));
  
  // Show toast notification
  showToast(`Status updated: ${status}`);
  
  // Re-render current route
  const currentRoute = window.location.hash.slice(1) || 'landing';
  renderRoute(currentRoute);
}

// Get status history
function getStatusHistory() {
  const history = localStorage.getItem('jobTrackerStatusHistory');
  return history ? JSON.parse(history) : [];
}

// Calculate match score for a job
function calculateMatchScore(job) {
  if (!userPreferences) return 0;
  
  let score = 0;
  
  // +25 if any roleKeyword appears in job.title (case-insensitive)
  if (userPreferences.roleKeywords && userPreferences.roleKeywords.length > 0) {
    const titleLower = job.title.toLowerCase();
    for (const keyword of userPreferences.roleKeywords) {
      if (titleLower.includes(keyword.toLowerCase().trim())) {
        score += 25;
        break;
      }
    }
  }
  
  // +15 if any roleKeyword appears in job.description
  if (userPreferences.roleKeywords && userPreferences.roleKeywords.length > 0) {
    const descLower = job.description.toLowerCase();
    for (const keyword of userPreferences.roleKeywords) {
      if (descLower.includes(keyword.toLowerCase().trim())) {
        score += 15;
        break;
      }
    }
  }
  
  // +15 if job.location matches preferredLocations
  if (userPreferences.preferredLocations && userPreferences.preferredLocations.length > 0) {
    if (userPreferences.preferredLocations.includes(job.location)) {
      score += 15;
    }
  }
  
  // +10 if job.mode matches preferredMode
  if (userPreferences.preferredMode && userPreferences.preferredMode.length > 0) {
    if (userPreferences.preferredMode.includes(job.mode)) {
      score += 10;
    }
  }
  
  // +10 if job.experience matches experienceLevel
  if (userPreferences.experienceLevel && job.experience === userPreferences.experienceLevel) {
    score += 10;
  }
  
  // +15 if overlap between job.skills and user.skills (any match)
  if (userPreferences.skills && userPreferences.skills.length > 0) {
    const userSkillsLower = userPreferences.skills.map(s => s.toLowerCase().trim());
    const jobSkillsLower = job.skills.map(s => s.toLowerCase().trim());
    const hasOverlap = userSkillsLower.some(skill => jobSkillsLower.includes(skill));
    if (hasOverlap) {
      score += 15;
    }
  }
  
  // +5 if postedDaysAgo <= 2
  if (job.postedDaysAgo <= 2) {
    score += 5;
  }
  
  // +5 if source is LinkedIn
  if (job.source === 'LinkedIn') {
    score += 5;
  }
  
  // Cap score at 100
  return Math.min(score, 100);
}

// Save job to localStorage
function saveJob(jobId) {
  const savedJobs = getSavedJobs();
  if (!savedJobs.includes(jobId)) {
    savedJobs.push(jobId);
    localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
  }
}

// Remove job from saved
function unsaveJob(jobId) {
  let savedJobs = getSavedJobs();
  savedJobs = savedJobs.filter(id => id !== jobId);
  localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
}

// Check if job is saved
function isJobSaved(jobId) {
  return getSavedJobs().includes(jobId);
}

// Filter and sort jobs
function filterJobs(jobs) {
  // Add match scores to jobs
  const jobsWithScores = jobs.map(job => ({
    ...job,
    matchScore: calculateMatchScore(job)
  }));
  
  let filtered = jobsWithScores.filter(job => {
    const matchesKeyword = !currentFilters.keyword || 
      job.title.toLowerCase().includes(currentFilters.keyword.toLowerCase()) ||
      job.company.toLowerCase().includes(currentFilters.keyword.toLowerCase());
    
    const matchesLocation = !currentFilters.location || 
      job.location === currentFilters.location;
    
    const matchesMode = !currentFilters.mode || 
      job.mode === currentFilters.mode;
    
    const matchesExperience = !currentFilters.experience || 
      job.experience === currentFilters.experience;
    
    const matchesSource = !currentFilters.source || 
      job.source === currentFilters.source;
    
    // Show only matches filter
    const matchesThreshold = !currentFilters.showOnlyMatches || 
      (userPreferences && job.matchScore >= (userPreferences.minMatchScore || 40));
    
    // Status filter
    const matchesStatus = !currentFilters.status || 
      getJobStatus(job.id) === currentFilters.status;
    
    return matchesKeyword && matchesLocation && matchesMode && matchesExperience && matchesSource && matchesThreshold && matchesStatus;
  });

  // Sort
  if (currentFilters.sort === 'latest') {
    filtered.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
  } else if (currentFilters.sort === 'score') {
    filtered.sort((a, b) => b.matchScore - a.matchScore);
  } else if (currentFilters.sort === 'salary') {
    filtered.sort((a, b) => {
      const extractNumber = (str) => {
        const match = str.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      return extractNumber(b.salaryRange) - extractNumber(a.salaryRange);
    });
  }

  return filtered;
}

// Render job card
function renderJobCard(job, showUnsave = false) {
  const isSaved = isJobSaved(job.id);
  const saveButtonText = showUnsave ? 'Unsave' : (isSaved ? 'Saved' : 'Save');
  const saveButtonClass = isSaved && !showUnsave ? 'btn--success' : 'btn--secondary';
  
  // Match score badge
  const matchScore = job.matchScore || 0;
  let matchBadgeClass = 'match-badge--grey';
  if (matchScore >= 80) matchBadgeClass = 'match-badge--green';
  else if (matchScore >= 60) matchBadgeClass = 'match-badge--amber';
  else if (matchScore >= 40) matchBadgeClass = 'match-badge--neutral';
  
  const matchBadge = userPreferences ? `<span class="match-badge ${matchBadgeClass}">${matchScore}% Match</span>` : '';
  
  // Status badge
  const status = getJobStatus(job.id);
  let statusBadgeClass = 'status-badge--neutral';
  if (status === 'Applied') statusBadgeClass = 'status-badge--blue';
  else if (status === 'Rejected') statusBadgeClass = 'status-badge--red';
  else if (status === 'Selected') statusBadgeClass = 'status-badge--green';
  
  return `
    <div class="job-card">
      <div class="job-card__header">
        <div>
          <h3 class="job-card__title">${job.title}</h3>
          <p class="job-card__company">${job.company}</p>
        </div>
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          ${matchBadge}
          <span class="status-badge ${statusBadgeClass}">${status}</span>
          <span class="job-card__source job-card__source--${job.source.toLowerCase()}">${job.source}</span>
        </div>
      </div>
      
      <div class="job-card__details">
        <span class="job-card__detail">📍 ${job.location}</span>
        <span class="job-card__detail">💼 ${job.mode}</span>
        <span class="job-card__detail">⏱️ ${job.experience}</span>
      </div>
      
      <div class="job-card__status-buttons">
        <button class="btn btn--status ${status === 'Not Applied' ? 'btn--status-active' : ''}" onclick="updateJobStatus(${job.id}, 'Not Applied')">Not Applied</button>
        <button class="btn btn--status ${status === 'Applied' ? 'btn--status-active' : ''}" onclick="updateJobStatus(${job.id}, 'Applied')">Applied</button>
        <button class="btn btn--status ${status === 'Rejected' ? 'btn--status-active' : ''}" onclick="updateJobStatus(${job.id}, 'Rejected')">Rejected</button>
        <button class="btn btn--status ${status === 'Selected' ? 'btn--status-active' : ''}" onclick="updateJobStatus(${job.id}, 'Selected')">Selected</button>
      </div>
      
      <div class="job-card__footer">
        <div class="job-card__meta">
          <span class="job-card__salary">${job.salaryRange}</span>
          <span class="job-card__posted">${job.postedDaysAgo === 0 ? 'Today' : job.postedDaysAgo === 1 ? '1 day ago' : job.postedDaysAgo + ' days ago'}</span>
        </div>
        <div class="job-card__actions">
          <button class="btn btn--secondary btn--small" onclick="viewJob(${job.id})">View</button>
          <button class="btn ${saveButtonClass} btn--small" onclick="${showUnsave ? 'unsaveJobHandler' : 'saveJobHandler'}(${job.id})">${saveButtonText}</button>
          <button class="btn btn--primary btn--small" onclick="applyJob('${job.applyUrl}')">Apply</button>
        </div>
      </div>
    </div>
  `;
}

// View job modal
function viewJob(jobId) {
  const job = jobsData.find(j => j.id === jobId);
  if (!job) return;
  
  const modal = document.getElementById('jobModal');
  const modalContent = document.getElementById('modalContent');
  
  modalContent.innerHTML = `
    <div class="modal__header">
      <h2 class="modal__title">${job.title}</h2>
      <button class="modal__close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal__body">
      <p class="modal__company">${job.company} • ${job.location} • ${job.mode}</p>
      <p class="modal__meta">${job.experience} • ${job.salaryRange}</p>
      
      <div class="modal__section">
        <h3>Description</h3>
        <p>${job.description}</p>
      </div>
      
      <div class="modal__section">
        <h3>Required Skills</h3>
        <div class="skill-tags">
          ${job.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
        </div>
      </div>
      
      <div class="modal__actions">
        <button class="btn btn--primary" onclick="applyJob('${job.applyUrl}')">Apply Now</button>
        <button class="btn btn--secondary" onclick="closeModal()">Close</button>
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
}

function closeModal() {
  document.getElementById('jobModal').style.display = 'none';
}

function applyJob(url) {
  window.open(url, '_blank');
}

function saveJobHandler(jobId) {
  saveJob(jobId);
  renderRoute(window.location.hash.slice(1) || 'landing');
}

function unsaveJobHandler(jobId) {
  unsaveJob(jobId);
  renderRoute('saved');
}

// Update filters
function updateFilter(filterName, value) {
  currentFilters[filterName] = value;
  renderRoute('dashboard');
}

// Toggle show only matches
function toggleShowOnlyMatches() {
  currentFilters.showOnlyMatches = !currentFilters.showOnlyMatches;
  renderRoute('dashboard');
}

// Save preferences from form
function savePreferencesFromForm() {
  const roleKeywords = document.getElementById('roleKeywords').value
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0);
  
  const locationSelects = document.querySelectorAll('#preferredLocations option:checked');
  const preferredLocations = Array.from(locationSelects).map(opt => opt.value);
  
  const modeCheckboxes = document.querySelectorAll('input[name="preferredMode"]:checked');
  const preferredMode = Array.from(modeCheckboxes).map(cb => cb.value);
  
  const experienceLevel = document.getElementById('experienceLevel').value;
  
  const skills = document.getElementById('skills').value
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  const minMatchScore = parseInt(document.getElementById('minMatchScore').value);
  
  const preferences = {
    roleKeywords,
    preferredLocations,
    preferredMode,
    experienceLevel,
    skills,
    minMatchScore
  };
  
  saveUserPreferences(preferences);
  alert('Preferences saved successfully!');
}

// Initialize preferences on load
function initializePreferences() {
  userPreferences = getUserPreferences();
  jobStatuses = getJobStatuses();
}

// Show toast notification
function showToast(message) {
  // Remove existing toast if any
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Create toast
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Show toast
  setTimeout(() => {
    toast.classList.add('toast--show');
  }, 10);
  
  // Hide and remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('toast--show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Get digest for a specific date
function getDigest(date) {
  const key = `jobTrackerDigest_${date}`;
  const digest = localStorage.getItem(key);
  return digest ? JSON.parse(digest) : null;
}

// Save digest for a specific date
function saveDigest(date, jobs) {
  const key = `jobTrackerDigest_${date}`;
  localStorage.setItem(key, JSON.stringify({
    date,
    jobs,
    generatedAt: new Date().toISOString()
  }));
}

// Generate today's digest
function generateDigest() {
  if (!userPreferences) {
    alert('Please set your preferences first to generate a personalized digest.');
    navigateTo('settings');
    return;
  }
  
  const today = getTodayDate();
  
  // Check if digest already exists for today
  const existingDigest = getDigest(today);
  if (existingDigest) {
    alert('Digest already generated for today. Showing existing digest.');
    renderRoute('digest');
    return;
  }
  
  // Calculate match scores for all jobs
  const jobsWithScores = jobsData.map(job => ({
    ...job,
    matchScore: calculateMatchScore(job)
  }));
  
  // Filter jobs with score >= minMatchScore
  const minScore = userPreferences.minMatchScore || 40;
  const matchingJobs = jobsWithScores.filter(job => job.matchScore >= minScore);
  
  if (matchingJobs.length === 0) {
    alert('No matching roles found. Try adjusting your preferences or lowering your threshold.');
    return;
  }
  
  // Sort by matchScore descending, then postedDaysAgo ascending
  matchingJobs.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return a.postedDaysAgo - b.postedDaysAgo;
  });
  
  // Take top 10
  const top10 = matchingJobs.slice(0, 10);
  
  // Save digest
  saveDigest(today, top10);
  
  // Re-render digest page
  renderRoute('digest');
}

// Copy digest to clipboard
function copyDigestToClipboard() {
  const today = getTodayDate();
  const digest = getDigest(today);
  
  if (!digest) {
    alert('No digest available. Generate one first.');
    return;
  }
  
  let text = `Top 10 Jobs For You — 9AM Digest\n`;
  text += `Date: ${new Date(today).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;
  
  digest.jobs.forEach((job, index) => {
    text += `${index + 1}. ${job.title}\n`;
    text += `   Company: ${job.company}\n`;
    text += `   Location: ${job.location} | ${job.mode}\n`;
    text += `   Experience: ${job.experience}\n`;
    text += `   Match Score: ${job.matchScore}%\n`;
    text += `   Apply: ${job.applyUrl}\n\n`;
  });
  
  text += `This digest was generated based on your preferences.\n`;
  
  navigator.clipboard.writeText(text).then(() => {
    alert('Digest copied to clipboard!');
  }).catch(() => {
    alert('Failed to copy. Please try again.');
  });
}

// Create email draft
function createEmailDraft() {
  const today = getTodayDate();
  const digest = getDigest(today);
  
  if (!digest) {
    alert('No digest available. Generate one first.');
    return;
  }
  
  const subject = 'My 9AM Job Digest';
  let body = `Top 10 Jobs For You — 9AM Digest%0D%0A`;
  body += `Date: ${new Date(today).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}%0D%0A%0D%0A`;
  
  digest.jobs.forEach((job, index) => {
    body += `${index + 1}. ${job.title}%0D%0A`;
    body += `   Company: ${job.company}%0D%0A`;
    body += `   Location: ${job.location} | ${job.mode}%0D%0A`;
    body += `   Experience: ${job.experience}%0D%0A`;
    body += `   Match Score: ${job.matchScore}%25%0D%0A`;
    body += `   Apply: ${job.applyUrl}%0D%0A%0D%0A`;
  });
  
  body += `This digest was generated based on your preferences.%0D%0A`;
  
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
}

// Close modal on outside click
window.onclick = function(event) {
  const modal = document.getElementById('jobModal');
  if (event.target === modal) {
    closeModal();
  }
}
