// Simple Router for Job Notification Tracker
const routes = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'This section will be built in the next step.'
  },
  saved: {
    title: 'Saved',
    subtitle: 'This section will be built in the next step.'
  },
  digest: {
    title: 'Digest',
    subtitle: 'This section will be built in the next step.'
  },
  settings: {
    title: 'Settings',
    subtitle: 'This section will be built in the next step.'
  },
  proof: {
    title: 'Proof',
    subtitle: 'This section will be built in the next step.'
  }
};

function renderRoute(routeName) {
  const route = routes[routeName] || routes.dashboard;
  const container = document.getElementById('routeContainer');
  
  container.innerHTML = `
    <div class="route-page">
      <h1 class="route-page__title">${route.title}</h1>
      <p class="route-page__subtitle">${route.subtitle}</p>
    </div>
  `;
  
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

function handleNavigation(e) {
  const link = e.target.closest('.nav__link');
  if (link) {
    e.preventDefault();
    const route = link.dataset.route;
    window.location.hash = route;
  }
}

function handleHashChange() {
  const hash = window.location.hash.slice(1) || 'dashboard';
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
