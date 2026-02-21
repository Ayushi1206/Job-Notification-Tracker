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
  return `
    <div class="route-page">
      <h1 class="route-page__title">Dashboard</h1>
      <div class="empty-state">
        <div class="empty-state__title">No jobs yet.</div>
        <p class="empty-state__text">In the next step, you will load a realistic dataset.</p>
      </div>
    </div>
  `;
}

function renderSaved() {
  return `
    <div class="route-page">
      <h1 class="route-page__title">Saved</h1>
      <div class="empty-state">
        <div class="empty-state__title">No saved jobs yet.</div>
        <p class="empty-state__text">Jobs you save will appear here for easy access.</p>
      </div>
    </div>
  `;
}

function renderDigest() {
  return `
    <div class="route-page">
      <h1 class="route-page__title">Digest</h1>
      <div class="empty-state">
        <div class="empty-state__title">No digest available.</div>
        <p class="empty-state__text">Your daily job digest will be delivered at 9AM.</p>
      </div>
    </div>
  `;
}

function renderSettings() {
  return `
    <div class="route-page">
      <h1 class="route-page__title">Settings</h1>
      <p class="route-page__subtitle">Configure your job preferences.</p>
      
      <div class="settings-form">
        <div class="form-group">
          <label class="form-label">Role Keywords</label>
          <input type="text" class="input" placeholder="e.g. Product Manager, Senior Engineer">
        </div>
        
        <div class="form-group">
          <label class="form-label">Preferred Locations</label>
          <input type="text" class="input" placeholder="e.g. San Francisco, Remote">
        </div>
        
        <div class="form-group">
          <label class="form-label">Work Mode</label>
          <select class="input">
            <option value="">Select mode</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Experience Level</label>
          <select class="input">
            <option value="">Select level</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
            <option value="executive">Executive</option>
          </select>
        </div>
        
        <button class="btn btn--primary">Save Preferences</button>
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
