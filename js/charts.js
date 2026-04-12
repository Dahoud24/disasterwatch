// js/charts.js

const TREND_DAYS = 30;

async function loadCharts() {
  try {
    const response = await fetch(
      `https://eonet.gsfc.nasa.gov/api/v3/events?status=all&days=${TREND_DAYS}&limit=500`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch chart data');
    }

    const data = await response.json();
    const events = Array.isArray(data.events) ? data.events : [];

    const loading = document.getElementById('chartsLoading');
    const content = document.getElementById('chartsContent');

    if (loading) {
      loading.classList.add('d-none');
    }

    if (content) {
      content.classList.remove('d-none');
    }

    buildPieChart(events);
    buildStatsRow(events);
  } catch (error) {
    const loading = document.getElementById('chartsLoading');
    if (loading) {
      loading.innerHTML =
        '<div class="alert alert-danger">Could not load chart data. Please refresh the page.</div>';
    }

    console.error('Charts fetch error:', error);
  }
}

function buildPieChart(events) {
  const counts = {};

  events.forEach(function (event) {
    const category = event.categories && event.categories[0]
      ? event.categories[0].title
      : 'Other';

    counts[category] = (counts[category] || 0) + 1;
  });

  const chartData = Object.entries(counts)
    .sort(function (a, b) {
      return b[1] - a[1];
    })
    .map(function ([name, value]) {
      return {
        name: name,
        y: value
      };
    });

  Highcharts.chart('pieChartContainer', {
    chart: {
      type: 'pie'
    },
    title: {
      text: 'Disaster Distribution (Past 30 Days)'
    },
    tooltip: {
      pointFormat: '<b>{point.y} events</b> ({point.percentage:.1f}%)'
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.percentage:.1f}%'
        }
      }
    },
    series: [
      {
        name: 'Events',
        colorByPoint: true,
        data: chartData
      }
    ],
    credits: {
      enabled: false
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

  const openCount = events.filter(function (event) {
    return event.closed === null || event.closed === undefined;
  }).length;

  const todayCount = events.filter(function (event) {
    const dateStr = event.geometry && event.geometry[0]
      ? event.geometry[0].date
      : null;

    if (!dateStr) return false;

    const today = new Date().toISOString().split('T')[0];
    const eventDay = new Date(dateStr).toISOString().split('T')[0];
    return today === eventDay;
  }).length;

  const stats = [
    { number: events.length, label: 'Total Events (Past 30 Days)' },
    { number: openCount, label: 'Currently Active' },
    { number: todayCount, label: 'Events Today' },
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