// Simple Router for Job Notification Tracker
const routes = {
  landing: renderLanding,
  dashboard: renderDashboard,
  saved: renderSaved,
  digest: renderDigest,
  settings: renderSettings,
  proof: renderProof
};

function renderLanding() {
  return `
    <div class="landing">
      <div class="landing__content">
        <h1 class="landing__title">Stop Missing The Right Jobs.</h1>
        <p class="landing__subtitle">Precision-matched job discovery delivered daily at 9AM.</p>
        <button class="btn btn--primary btn--large" onclick="navigateTo('settings')">Start Tracking</button>
      </div>
    </div>
  `;
}

function renderDashboard() {
  const filteredJobs = filterJobs(jobsData);
  
  // Get unique values for dropdowns
  const locations = [...new Set(jobsData.map(j => j.location))].sort();
  const modes = ['Remote', 'Hybrid', 'Onsite'];
  const experiences = ['Fresher', '0-1', '1-3', '3-5'];
  const sources = ['LinkedIn', 'Naukri', 'Indeed'];
  
  // Preferences banner
  const preferencesBanner = !userPreferences ? `
    <div class="preferences-banner">
      <div class="preferences-banner__content">
        <strong>Set your preferences to activate intelligent matching.</strong>
        <button class="btn btn--primary btn--small" onclick="navigateTo('settings')">Configure Preferences</button>
      </div>
    </div>
  ` : '';
  
  // Show only matches toggle
  const matchToggle = userPreferences ? `
    <div class="match-toggle">
      <label class="toggle-label">
        <input 
          type="checkbox" 
          ${currentFilters.showOnlyMatches ? 'checked' : ''}
          onchange="toggleShowOnlyMatches()"
        >
        <span>Show only jobs above my threshold (${userPreferences.minMatchScore || 40}%)</span>
      </label>
    </div>
  ` : '';
  
  return `
    <div class="route-page">
      <h1 class="route-page__title">Dashboard</h1>
      <p class="route-page__subtitle">Browse and track job opportunities.</p>
      
      ${preferencesBanner}
      
      <div class="filter-bar">
        <input 
          type="text" 
          class="input filter-input" 
          placeholder="Search by title or company..."
          value="${currentFilters.keyword}"
          oninput="updateFilter('keyword', this.value)"
        >
        
        <select class="input filter-select" onchange="updateFilter('location', this.value)">
          <option value="">All Locations</option>
          ${locations.map(loc => `<option value="${loc}" ${currentFilters.location === loc ? 'selected' : ''}>${loc}</option>`).join('')}
        </select>
        
        <select class="input filter-select" onchange="updateFilter('mode', this.value)">
          <option value="">All Modes</option>
          ${modes.map(mode => `<option value="${mode}" ${currentFilters.mode === mode ? 'selected' : ''}>${mode}</option>`).join('')}
        </select>
        
        <select class="input filter-select" onchange="updateFilter('experience', this.value)">
          <option value="">All Experience</option>
          ${experiences.map(exp => `<option value="${exp}" ${currentFilters.experience === exp ? 'selected' : ''}>${exp}</option>`).join('')}
        </select>
        
        <select class="input filter-select" onchange="updateFilter('source', this.value)">
          <option value="">All Sources</option>
          ${sources.map(src => `<option value="${src}" ${currentFilters.source === src ? 'selected' : ''}>${src}</option>`).join('')}
        </select>
        
        <select class="input filter-select" onchange="updateFilter('sort', this.value)">
          <option value="latest" ${currentFilters.sort === 'latest' ? 'selected' : ''}>Latest First</option>
          <option value="score" ${currentFilters.sort === 'score' ? 'selected' : ''}>Match Score</option>
          <option value="salary" ${currentFilters.sort === 'salary' ? 'selected' : ''}>Salary</option>
        </select>
      </div>
      
      ${matchToggle}
      
      <div class="jobs-count">${filteredJobs.length} jobs found</div>
      
      <div class="jobs-grid">
        ${filteredJobs.length > 0 ? filteredJobs.map(job => renderJobCard(job)).join('') : `
          <div class="empty-state">
            <div class="empty-state__title">No roles match your criteria.</div>
            <p class="empty-state__text">Adjust filters or lower threshold to see more opportunities.</p>
          </div>
        `}
      </div>
    </div>
  `;
}

function renderSaved() {
  const savedJobIds = getSavedJobs();
  const savedJobsData = jobsData.filter(job => savedJobIds.includes(job.id));
  
  return `
    <div class="route-page">
      <h1 class="route-page__title">Saved</h1>
      <p class="route-page__subtitle">Jobs you've saved for later.</p>
      
      ${savedJobsData.length > 0 ? `
        <div class="jobs-count">${savedJobsData.length} saved jobs</div>
        <div class="jobs-grid">
          ${savedJobsData.map(job => renderJobCard(job, true)).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state__title">No saved jobs yet.</div>
          <p class="empty-state__text">Jobs you save will appear here for easy access.</p>
          <button class="btn btn--primary" onclick="navigateTo('dashboard')">Browse Jobs</button>
        </div>
      `}
    </div>
  `;
}

function renderDigest() {
  return `
    <div class="route-page">
      <h1 class="route-page__title">Digest</h1>
      <p class="route-page__subtitle">Your personalized daily job digest.</p>
      
      <div class="empty-state">
        <div class="empty-state__title">No digest available.</div>
        <p class="empty-state__text">Your daily job digest will be delivered at 9AM.</p>
      </div>
    </div>
  `;
}

function renderSettings() {
  const prefs = userPreferences || {
    roleKeywords: [],
    preferredLocations: [],
    preferredMode: [],
    experienceLevel: '',
    skills: [],
    minMatchScore: 40
  };
  
  // Get unique locations from jobs data
  const locations = [...new Set(jobsData.map(j => j.location))].sort();
  
  return `
    <div class="route-page">
      <h1 class="route-page__title">Settings</h1>
      <p class="route-page__subtitle">Configure your job preferences.</p>
      
      <div class="settings-form">
        <div class="form-group">
          <label class="form-label">Role Keywords (comma-separated)</label>
          <input 
            type="text" 
            id="roleKeywords" 
            class="input" 
            placeholder="e.g. Developer, Engineer, Intern"
            value="${prefs.roleKeywords.join(', ')}"
          >
          <p class="form-hint">Keywords to match in job titles and descriptions</p>
        </div>
        
        <div class="form-group">
          <label class="form-label">Preferred Locations (hold Ctrl/Cmd for multiple)</label>
          <select id="preferredLocations" class="input" multiple size="5">
            ${locations.map(loc => `
              <option value="${loc}" ${prefs.preferredLocations.includes(loc) ? 'selected' : ''}>${loc}</option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Work Mode</label>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" name="preferredMode" value="Remote" ${prefs.preferredMode.includes('Remote') ? 'checked' : ''}>
              <span>Remote</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" name="preferredMode" value="Hybrid" ${prefs.preferredMode.includes('Hybrid') ? 'checked' : ''}>
              <span>Hybrid</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" name="preferredMode" value="Onsite" ${prefs.preferredMode.includes('Onsite') ? 'checked' : ''}>
              <span>Onsite</span>
            </label>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Experience Level</label>
          <select id="experienceLevel" class="input">
            <option value="">Any</option>
            <option value="Fresher" ${prefs.experienceLevel === 'Fresher' ? 'selected' : ''}>Fresher</option>
            <option value="0-1" ${prefs.experienceLevel === '0-1' ? 'selected' : ''}>0-1 Years</option>
            <option value="1-3" ${prefs.experienceLevel === '1-3' ? 'selected' : ''}>1-3 Years</option>
            <option value="3-5" ${prefs.experienceLevel === '3-5' ? 'selected' : ''}>3-5 Years</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Skills (comma-separated)</label>
          <input 
            type="text" 
            id="skills" 
            class="input" 
            placeholder="e.g. React, Python, AWS"
            value="${prefs.skills.join(', ')}"
          >
          <p class="form-hint">Skills you have or want to work with</p>
        </div>
        
        <div class="form-group">
          <label class="form-label">Minimum Match Score: <span id="scoreValue">${prefs.minMatchScore}</span>%</label>
          <input 
            type="range" 
            id="minMatchScore" 
            class="slider" 
            min="0" 
            max="100" 
            value="${prefs.minMatchScore}"
            oninput="document.getElementById('scoreValue').textContent = this.value"
          >
          <p class="form-hint">Jobs below this score will be hidden when filter is enabled</p>
        </div>
        
        <button class="btn btn--primary" onclick="savePreferencesFromForm()">Save Preferences</button>
      </div>
    </div>
  `;
}

function renderProof() {
  return `
    <div class="route-page">
      <h1 class="route-page__title">Proof</h1>
      <p class="route-page__subtitle">Artifact collection placeholder.</p>
      
      <div class="card">
        <h3 class="card__title">Proof Collection</h3>
        <div class="card__content">
          <p>This section will collect proof artifacts in future steps.</p>
        </div>
      </div>
    </div>
  `;
}

function renderRoute(routeName) {
  const renderFn = routes[routeName] || routes.landing;
  const container = document.getElementById('routeContainer');
  
  container.innerHTML = renderFn();
  
  // Update active link
  document.querySelectorAll('.nav__link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.route === routeName) {
      link.classList.add('active');
    }
  });
  
  // Close mobile menu
  const navMenu = document.getElementById('navMenu');
  const hamburger = document.getElementById('hamburger');
  navMenu.classList.remove('active');
  hamburger.classList.remove('active');
}

function navigateTo(route) {
  window.location.hash = route;
}

function handleNavigation(e) {
  const link = e.target.closest('.nav__link');
  if (link) {
    e.preventDefault();
    const route = link.dataset.route;
    window.location.hash = route;
  }
}

function handleHashChange() {
  const hash = window.location.hash.slice(1) || 'landing';
  renderRoute(hash);
}

// Hamburger menu toggle
document.getElementById('hamburger').addEventListener('click', () => {
  const navMenu = document.getElementById('navMenu');
  const hamburger = document.getElementById('hamburger');
  navMenu.classList.toggle('active');
  hamburger.classList.toggle('active');
});

// Navigation click handler
document.getElementById('navMenu').addEventListener('click', handleNavigation);

// Hash change handler
window.addEventListener('hashchange', handleHashChange);

// Initial render
handleHashChange();

// Initialize preferences on load
initializePreferences();
