const CATEGORY_ICONS = {
  'Wildfires': 'images/markers/wildfire.png',
  'Severe Storms': 'images/markers/storm.png',
  'Earthquakes': 'images/markers/earthquake.png',
  'Floods': 'images/markers/flood.png',
  'Volcanoes': 'images/markers/volcano.png'
};

const ALLOWED_CATEGORIES = Object.keys(CATEGORY_ICONS);

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

  ALLOWED_CATEGORIES.forEach(function (category) {
    const iconPath = CATEGORY_ICONS[category];
    div.innerHTML += `
      <div style="display:flex; align-items:center; margin-bottom:6px;">
        <img src="${iconPath}" alt="${category}" style="width:18px; height:18px; margin-right:8px;">
        <span>${category}</span>
      </div>
    `;
  });

  return div;
};

legend.addTo(map);

async function loadDisasters() {
  document.getElementById('eventInfo').innerHTML =
    '<div class="alert alert-info">Loading disaster data from NASA...</div>';

  try {
    const response = await fetch(
      'https://eonet.gsfc.nasa.gov/api/v3/events?status=all&days=30&limit=400'
    );

    if (!response.ok) {
      throw new Error('Failed to fetch NASA EONET data');
    }

    const data = await response.json();

    document.getElementById('eventInfo').innerHTML = '';

    if (!data.events || data.events.length === 0) {
      document.getElementById('eventInfo').innerHTML =
        '<div class="alert alert-warning">No disaster events found.</div>';
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

  if (!ALLOWED_CATEGORIES.includes(category)) return;

  const iconUrl = CATEGORY_ICONS[category];

  const icon = L.icon({
    iconUrl: iconUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });

  const marker = L.marker([lat, lng], { icon: icon }).addTo(map);

  marker.bindTooltip(event.title, {
    permanent: false,
    direction: 'top'
  });

  marker.on('click', function () {
    showEventInfo(event, lat, lng, category);
  });
}

function showEventInfo(event, lat, lng, category) {
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
        <img src="${CATEGORY_ICONS[category]}" alt="${category}" style="width:28px; height:28px; margin-right:10px;">
        <div>
          <span class="badge bg-primary mb-1">${category}</span>
          <h5 class="mb-0">${event.title}</h5>
        </div>
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