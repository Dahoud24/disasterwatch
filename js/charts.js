const CHART_COLORS = [
  '#e74c3c',
  '#8e44ad',
  '#e67e22',
  '#2980b9',
  '#c0392b',
  '#00bcd4',
  '#795548',
  '#f39c12',
  '#607d8b',
  '#2ecc71',
  '#34495e'
];

async function loadCharts() {
  try {
    const response = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=all&limit=500');
    if (!response.ok) {
      throw new Error('Failed to fetch chart data');
    }

    const data = await response.json();
    const events = Array.isArray(data.events) ? data.events : [];

    document.getElementById('chartsLoading').classList.add('d-none');
    document.getElementById('chartsContent').classList.remove('d-none');

    buildCategoryChart(events);
    buildMonthChart(events);
    buildStatsRow(events);
  } catch (error) {
    document.getElementById('chartsLoading').innerHTML =
      '<div class="alert alert-danger">Could not load chart data. Please refresh the page.</div>';
    console.error('Charts fetch error:', error);
  }
}

function buildCategoryChart(events) {
  const counts = {};

  events.forEach(function (event) {
    const category = event.categories && event.categories[0]
      ? event.categories[0].title
      : 'Other';

    counts[category] = (counts[category] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort(function (a, b) {
    return b[1] - a[1];
  });

  const labels = sorted.map(function (item) {
    return item[0];
  });

  const values = sorted.map(function (item) {
    return item[1];
  });

  new Chart(document.getElementById('categoryChart'), {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: CHART_COLORS,
          borderWidth: 2,
          borderColor: '#fff'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const total = ctx.dataset.data.reduce(function (a, b) {
                return a + b;
              }, 0);
              const pct = total ? Math.round((ctx.parsed / total) * 100) : 0;
              return ctx.label + ': ' + ctx.parsed + ' events (' + pct + '%)';
            }
          }
        }
      }
    }
  });
}

function buildMonthChart(events) {
  const currentYear = new Date().getFullYear();
  const months = Array(12).fill(0);

  events.forEach(function (event) {
    const dateStr = event.geometry && event.geometry[0]
      ? event.geometry[0].date
      : null;

    if (!dateStr) return;

    const date = new Date(dateStr);

    if (date.getFullYear() === currentYear) {
      months[date.getMonth()]++;
    }
  });

  new Chart(document.getElementById('monthChart'), {
    type: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Disaster Events in ' + currentYear,
          data: months,
          backgroundColor: '#1A73A7',
          borderRadius: 5,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

function buildStatsRow(events) {
  const container = document.getElementById('statsRow');
  if (!container) return;

  const counts = {};

  events.forEach(function (event) {
    const category = event.categories && event.categories[0]
      ? event.categories[0].title
      : 'Other';

    counts[category] = (counts[category] || 0) + 1;
  });

  const sortedCategories = Object.entries(counts).sort(function (a, b) {
    return b[1] - a[1];
  });

  const topCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : 'N/A';

  const currentYear = new Date().getFullYear();

  const thisYearCount = events.filter(function (event) {
    const dateStr = event.geometry && event.geometry[0]
      ? event.geometry[0].date
      : null;

    if (!dateStr) return false;

    const date = new Date(dateStr);
    return date.getFullYear() === currentYear;
  }).length;

  const openCount = events.filter(function (event) {
    return event.closed === null || event.closed === undefined;
  }).length;

  const stats = [
    { number: events.length, label: 'Total Events (Last 500)' },
    { number: openCount, label: 'Currently Active' },
    { number: thisYearCount, label: 'Events This Year' },
    { number: topCategory, label: 'Most Common Type' }
  ];

  container.innerHTML = stats.map(function (stat) {
    return `
      <div class="col-md-3 col-6 mb-3">
        <div class="stat-box">
          <div class="stat-number">${stat.number}</div>
          <div class="stat-label">${stat.label}</div>
        </div>
      </div>
    `;
  }).join('');
}

loadCharts();