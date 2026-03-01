// Job Notification Tracker - App Logic

let currentFilters = {
  keyword: '',
  location: '',
  mode: '',
  experience: '',
  source: '',
  sort: 'latest'
};

let selectedJobId = null;

// Get saved jobs from localStorage
function getSavedJobs() {
  const saved = localStorage.getItem('savedJobs');
  return saved ? JSON.parse(saved) : [];
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
  let filtered = jobs.filter(job => {
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
    
    return matchesKeyword && matchesLocation && matchesMode && matchesExperience && matchesSource;
  });

  // Sort
  if (currentFilters.sort === 'latest') {
    filtered.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
  }

  return filtered;
}

// Render job card
function renderJobCard(job, showUnsave = false) {
  const isSaved = isJobSaved(job.id);
  const saveButtonText = showUnsave ? 'Unsave' : (isSaved ? 'Saved' : 'Save');
  const saveButtonClass = isSaved && !showUnsave ? 'btn--success' : 'btn--secondary';
  
  return `
    <div class="job-card">
      <div class="job-card__header">
        <div>
          <h3 class="job-card__title">${job.title}</h3>
          <p class="job-card__company">${job.company}</p>
        </div>
        <span class="job-card__source job-card__source--${job.source.toLowerCase()}">${job.source}</span>
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

// Close modal on outside click
window.onclick = function(event) {
  const modal = document.getElementById('jobModal');
  if (event.target === modal) {
    closeModal();
  }
}
