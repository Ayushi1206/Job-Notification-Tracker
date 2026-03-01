// Simple Router for Job Notification Tracker
const routes = {
  landing: renderLanding,
  dashboard: renderDashboard,
  saved: renderSaved,
  digest: renderDigest,
  settings: renderSettings,
  proof: renderProof,
  test: renderTest,
  ship: renderShip
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
  const statuses = ['Not Applied', 'Applied', 'Rejected', 'Selected'];
  
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
        
        <select class="input filter-select" onchange="updateFilter('status', this.value)">
          <option value="">All Status</option>
          ${statuses.map(status => `<option value="${status}" ${currentFilters.status === status ? 'selected' : ''}>${status}</option>`).join('')}
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
  const today = getTodayDate();
  const digest = getDigest(today);
  const todayFormatted = new Date(today).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Check if preferences are set
  if (!userPreferences) {
    return `
      <div class="route-page">
        <h1 class="route-page__title">Digest</h1>
        <p class="route-page__subtitle">Your personalized daily job digest.</p>
        
        <div class="digest-blocking">
          <div class="empty-state">
            <div class="empty-state__title">Set preferences to generate a personalized digest.</div>
            <p class="empty-state__text">Configure your job preferences to receive tailored job recommendations.</p>
            <button class="btn btn--primary" onclick="navigateTo('settings')">Configure Preferences</button>
          </div>
        </div>
      </div>
    `;
  }
  
  // If no digest exists, show generate button
  if (!digest) {
    return `
      <div class="route-page">
        <h1 class="route-page__title">Digest</h1>
        <p class="route-page__subtitle">Your personalized daily job digest.</p>
        
        <div class="digest-generate">
          <div class="card">
            <h3 class="card__title">Generate Today's Digest</h3>
            <div class="card__content">
              <p>Generate your personalized 9AM job digest with the top 10 matching opportunities.</p>
              <button class="btn btn--primary" onclick="generateDigest()">Generate Today's 9AM Digest (Simulated)</button>
              <p class="digest-note">Demo Mode: Daily 9AM trigger simulated manually.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Render digest
  return `
    <div class="route-page">
      <h1 class="route-page__title">Digest</h1>
      <p class="route-page__subtitle">Your personalized daily job digest.</p>
      
      <div class="digest-actions">
        <button class="btn btn--secondary btn--small" onclick="copyDigestToClipboard()">Copy Digest to Clipboard</button>
        <button class="btn btn--secondary btn--small" onclick="createEmailDraft()">Create Email Draft</button>
      </div>
      
      <div class="digest-container">
        <div class="digest-card">
          <div class="digest-header">
            <h2 class="digest-title">Top 10 Jobs For You — 9AM Digest</h2>
            <p class="digest-date">${todayFormatted}</p>
          </div>
          
          <div class="digest-jobs">
            ${digest.jobs.map((job, index) => `
              <div class="digest-job">
                <div class="digest-job__number">${index + 1}</div>
                <div class="digest-job__content">
                  <h3 class="digest-job__title">${job.title}</h3>
                  <p class="digest-job__company">${job.company}</p>
                  <div class="digest-job__details">
                    <span>📍 ${job.location}</span>
                    <span>💼 ${job.mode}</span>
                    <span>⏱️ ${job.experience}</span>
                  </div>
                  <div class="digest-job__footer">
                    <span class="digest-job__match">Match Score: ${job.matchScore}%</span>
                    <button class="btn btn--primary btn--small" onclick="applyJob('${job.applyUrl}')">Apply</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="digest-footer">
            <p>This digest was generated based on your preferences.</p>
            <p class="digest-note">Demo Mode: Daily 9AM trigger simulated manually.</p>
          </div>
        </div>
        
        ${renderStatusUpdates()}
      </div>
    </div>
  `;
}

function renderStatusUpdates() {
  const history = getStatusHistory();
  
  if (history.length === 0) {
    return '';
  }
  
  return `
    <div class="status-updates">
      <h2 class="status-updates__title">Recent Status Updates</h2>
      <div class="status-updates__list">
        ${history.slice(0, 10).map(update => {
          const job = jobsData.find(j => j.id === update.jobId);
          if (!job) return '';
          
          const date = new Date(update.date);
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          let statusClass = 'status-update--neutral';
          if (update.status === 'Applied') statusClass = 'status-update--blue';
          else if (update.status === 'Rejected') statusClass = 'status-update--red';
          else if (update.status === 'Selected') statusClass = 'status-update--green';
          
          return `
            <div class="status-update ${statusClass}">
              <div class="status-update__content">
                <h4 class="status-update__job">${job.title}</h4>
                <p class="status-update__company">${job.company}</p>
              </div>
              <div class="status-update__meta">
                <span class="status-update__status">${update.status}</span>
                <span class="status-update__date">${dateStr}</span>
              </div>
            </div>
          `;
        }).join('')}
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

function renderTest() {
  const testResults = getTestResults();
  const totalTests = 10;
  const passedTests = Object.values(testResults).filter(v => v).length;
  const allPassed = passedTests === totalTests;
  
  const testItems = [
    {
      id: 'preferences_persist',
      label: 'Preferences persist after refresh',
      tooltip: 'Set preferences in Settings, refresh page, verify they are still there'
    },
    {
      id: 'match_score',
      label: 'Match score calculates correctly',
      tooltip: 'Set preferences, check Dashboard, verify match scores appear on job cards'
    },
    {
      id: 'show_matches_toggle',
      label: '"Show only matches" toggle works',
      tooltip: 'Enable toggle on Dashboard, verify only jobs above threshold show'
    },
    {
      id: 'save_persist',
      label: 'Save job persists after refresh',
      tooltip: 'Save a job, refresh page, go to Saved, verify job is still there'
    },
    {
      id: 'apply_new_tab',
      label: 'Apply opens in new tab',
      tooltip: 'Click Apply button on any job, verify it opens in new tab'
    },
    {
      id: 'status_persist',
      label: 'Status update persists after refresh',
      tooltip: 'Change job status, refresh page, verify status is maintained'
    },
    {
      id: 'status_filter',
      label: 'Status filter works correctly',
      tooltip: 'Set some jobs to Applied, use status filter, verify only Applied jobs show'
    },
    {
      id: 'digest_top10',
      label: 'Digest generates top 10 by score',
      tooltip: 'Generate digest, verify it shows 10 jobs sorted by match score'
    },
    {
      id: 'digest_persist',
      label: 'Digest persists for the day',
      tooltip: 'Generate digest, refresh page, verify same digest loads'
    },
    {
      id: 'no_console_errors',
      label: 'No console errors on main pages',
      tooltip: 'Open browser console (F12), navigate all routes, verify no errors'
    }
  ];
  
  return `
    <div class="route-page">
      <h1 class="route-page__title">Test Checklist</h1>
      <p class="route-page__subtitle">Verify all features before shipping.</p>
      
      <div class="test-summary ${allPassed ? 'test-summary--success' : 'test-summary--warning'}">
        <div class="test-summary__score">
          <span class="test-summary__label">Tests Passed:</span>
          <span class="test-summary__value">${passedTests} / ${totalTests}</span>
        </div>
        ${!allPassed ? `
          <div class="test-summary__warning">
            <strong>⚠️ Resolve all issues before shipping.</strong>
          </div>
        ` : `
          <div class="test-summary__success">
            <strong>✓ All tests passed! Ready to ship.</strong>
          </div>
        `}
      </div>
      
      <div class="test-actions">
        <button class="btn btn--secondary btn--small" onclick="resetTestStatus()">Reset Test Status</button>
      </div>
      
      <div class="test-checklist">
        ${testItems.map(item => `
          <div class="test-item">
            <label class="test-item__label">
              <input 
                type="checkbox" 
                class="test-item__checkbox"
                ${testResults[item.id] ? 'checked' : ''}
                onchange="updateTestResult('${item.id}', this.checked)"
              >
              <span class="test-item__text">${item.label}</span>
            </label>
            <div class="test-item__tooltip" title="${item.tooltip}">
              <span class="test-item__tooltip-icon">?</span>
              <div class="test-item__tooltip-content">${item.tooltip}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderShip() {
  const testResults = getTestResults();
  const totalTests = 10;
  const passedTests = Object.values(testResults).filter(v => v).length;
  const allPassed = passedTests === totalTests;
  
  if (!allPassed) {
    return `
      <div class="route-page">
        <h1 class="route-page__title">Ship</h1>
        <p class="route-page__subtitle">Deploy your application.</p>
        
        <div class="ship-locked">
          <div class="empty-state">
            <div class="empty-state__title">🔒 Shipping Locked</div>
            <p class="empty-state__text">Complete all test checklist items before shipping.</p>
            <p class="empty-state__text">Tests Passed: ${passedTests} / ${totalTests}</p>
            <button class="btn btn--primary" onclick="navigateTo('test')">Go to Test Checklist</button>
          </div>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="route-page">
      <h1 class="route-page__title">Ship</h1>
      <p class="route-page__subtitle">Deploy your application.</p>
      
      <div class="ship-ready">
        <div class="card">
          <h3 class="card__title">✓ Ready to Ship</h3>
          <div class="card__content">
            <p>All tests have passed. Your Job Notification Tracker is ready for deployment.</p>
            <p style="margin-top: 16px;"><strong>Next Steps:</strong></p>
            <ul style="margin-left: 20px; line-height: 1.8;">
              <li>Deploy to your hosting platform</li>
              <li>Configure production environment variables</li>
              <li>Set up monitoring and analytics</li>
              <li>Share with users</li>
            </ul>
            <button class="btn btn--primary" style="margin-top: 24px;">Deploy Now</button>
          </div>
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
