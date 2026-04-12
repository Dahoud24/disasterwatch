// js/map.js

const CATEGORY_COLORS = {
  'Wildfires': '#e74c3c',
  'Severe Storms': '#8e44ad',
  'Earthquakes': '#e67e22',
  'Floods': '#2980b9',
  'Volcanoes': '#c0392b',
  'Sea and Lake Ice': '#00bcd4',
  'Landslides': '#795548',
  'Drought': '#f39c12',
  'Manmade': '#607d8b'
};



const worldBounds = [
  [-85, -180],
  [85, 180]
];

const map = L.map('map', {
  minZoom: 2,
  maxBounds: worldBounds,
  maxBoundsViscosity: 0.5,
  worldCopyJump: false
}).setView([20, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 18,
  noWrap: true
}).addTo(map);

map.attributionControl.setPrefix(false);

const legend = L.control({ position: 'bottomright' });

legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'map-legend');
  div.innerHTML = '<strong>Categories</strong><br>';

  for (const [name, color] of Object.entries(CATEGORY_COLORS)) {
    div.innerHTML += '<span style="background:' + color + '"></span> ' + name + '<br>';
  }

  return div;
};

legend.addTo(map);


async function loadDisasters() {
  document.getElementById('eventInfo').innerHTML =
    '<div class="alert alert-info">Loading disaster data from NASA...</div>';

  try {
    const response = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=all&days=30&limit=400');

    if (!response.ok) {
      throw new Error('Failed to fetch NASA EONET data');
    }

    const data = await response.json();

    document.getElementById('eventInfo').innerHTML = '';

    if (!data.events || data.events.length === 0) {
      document.getElementById('eventInfo').innerHTML =
        '<div class="alert alert-warning">No active events found.</div>';
      return;
    }

   
    data.events.forEach(function (event) {
      plotEvent(event);
    });
  } catch (error) {
    document.getElementById('eventInfo').innerHTML =
      '<div class="alert alert-danger">Could not load disaster data. Check your internet connection.</div>';
    console.error('NASA EONET fetch error:', error);
  }
}

function plotEvent(event) {
  if (!event.geometry || event.geometry.length === 0) return;

  const geo = event.geometry[event.geometry.length - 1];

  if (geo.type !== 'Point') return;

  const lng = geo.coordinates[0];
  const lat = geo.coordinates[1];

  const category = event.categories && event.categories[0]
    ? event.categories[0].title
    : 'Unknown';

  const color = CATEGORY_COLORS[category] || '#999999';

  const marker = L.circleMarker([lat, lng], {
    radius: 9,
    color: color,
    fillColor: color,
    fillOpacity: 0.65,
    weight: 2
  }).addTo(map);

  marker.bindTooltip(event.title, { permanent: false, direction: 'top' });

  marker.on('click', function () {
    showEventInfo(event, lat, lng, color);
  });
}

function showEventInfo(event, lat, lng, color) {
  const category = event.categories && event.categories[0]
    ? event.categories[0].title
    : 'Unknown';

  const rawDate = event.geometry && event.geometry[0]
    ? event.geometry[0].date
    : null;

  const dateStr = rawDate
    ? new Date(rawDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Unknown date';

  const user = getLoggedInUser();

  document.getElementById('eventInfo').innerHTML = `
    <div class="card shadow-sm p-3 mb-3">
      <div class="d-flex align-items-center mb-2">
        <span class="badge me-2" style="background:${color}; font-size:1rem;">
          ${category}
        </span>
        <h5 class="mb-0">${event.title}</h5>
      </div>
      <p class="mb-1"><strong>Date:</strong> ${dateStr}</p>
      <p class="mb-1"><strong>Coordinates:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
      <div id="bookmarkAction"></div>
    </div>
    <div id="weatherInfo"></div>
  `;

  const bookmarkAction = document.getElementById('bookmarkAction');

  if (user) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-warning btn-sm mt-2';
    btn.textContent = '⭐ Bookmark this Event';

    btn.addEventListener('click', function () {
      bookmarkEvent({
        id: event.id,
        title: event.title,
        category: category,
        date: dateStr,
        lat: lat,
        lng: lng
      });
    });

    bookmarkAction.appendChild(btn);
  } else {
    bookmarkAction.innerHTML =
      '<a href="login.html" class="btn btn-outline-primary btn-sm mt-2">🔐 Login to Bookmark</a>';
  }

  fetchWeatherForLocation(lat, lng);

  document.getElementById('eventInfo').scrollIntoView({
    behavior: 'smooth',
    block: 'nearest'
  });
}

loadDisasters();