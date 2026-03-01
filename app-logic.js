// Job Notification Tracker - App Logic

let currentFilters = {
  keyword: '',
  location: '',
  mode: '',
  experience: '',
  source: '',
  sort: 'latest',
  showOnlyMatches: false
};

let selectedJobId = null;
let userPreferences = null;

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
    
    return matchesKeyword && matchesLocation && matchesMode && matchesExperience && matchesSource && matchesThreshold;
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
  
  return `
    <div class="job-card">
      <div class="job-card__header">
        <div>
          <h3 class="job-card__title">${job.title}</h3>
          <p class="job-card__company">${job.company}</p>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          ${matchBadge}
          <span class="job-card__source job-card__source--${job.source.toLowerCase()}">${job.source}</span>
        </div>
      </div>
      
      <div class="job-card__details">
        <span class="job-card__detail">📍 ${job.location}</span>
        <span class="job-card__detail">💼 ${job.mode}</span>
        <span class="job-card__detail">⏱️ ${job.experience}</span>
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
}

// Close modal on outside click
window.onclick = function(event) {
  const modal = document.getElementById('jobModal');
  if (event.target === modal) {
    closeModal();
  }
}
