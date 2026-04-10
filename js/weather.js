const WEATHER_API_KEY = 'e73ac511d24c02b05a9e9c3de11b410f';

async function fetchWeatherForLocation(lat, lng) {
  const weatherDiv = document.getElementById('weatherInfo');
  if (!weatherDiv) return;

  weatherDiv.innerHTML = '<p class="text-muted small">Loading weather data...</p>';

  try {
    const url =
      'https://api.openweathermap.org/data/2.5/weather' +
      '?lat=' + lat +
      '&lon=' + lng +
      '&appid=' + WEATHER_API_KEY +
      '&units=metric';

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const weather = await response.json();

    if (weather.cod && Number(weather.cod) !== 200) {
      weatherDiv.innerHTML =
        '<p class="text-muted small">Weather data unavailable for this location.</p>';
      return;
    }

    const emoji = getWeatherEmoji(weather.weather[0].main);

    weatherDiv.innerHTML = `
      <div class="card shadow-sm p-3" style="border-left: 4px solid #145b85;">
        <h6 class="fw-bold mb-2">🌤 Current Weather at this Location</h6>
        <div class="row text-center">
          <div class="col-3">
            <div class="fw-bold fs-5">${emoji}</div>
            <div class="small text-muted">${weather.weather[0].description}</div>
          </div>
          <div class="col-3">
            <div class="fw-bold fs-5">${Math.round(weather.main.temp)}°C</div>
            <div class="small text-muted">Temperature</div>
          </div>
          <div class="col-3">
            <div class="fw-bold fs-5">${weather.main.humidity}%</div>
            <div class="small text-muted">Humidity</div>
          </div>
          <div class="col-3">
            <div class="fw-bold fs-5">${weather.wind.speed} m/s</div>
            <div class="small text-muted">Wind Speed</div>
          </div>
        </div>
        <p class="small text-muted mt-2 mb-0">
          Near: ${weather.name || 'Remote location'}
        </p>
      </div>
    `;
  } catch (error) {
    weatherDiv.innerHTML =
      '<p class="text-muted small">Weather data could not be loaded.</p>';
    console.error('Weather fetch error:', error);
  }
}

function getWeatherEmoji(condition) {
  const map = {
    Clear: '☀️',
    Clouds: '☁️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Snow: '❄️',
    Mist: '🌫️',
    Smoke: '💨',
    Haze: '🌫️',
    Dust: '🌪️',
    Fog: '🌫️',
    Sand: '🌪️',
    Ash: '🌋',
    Squall: '💨',
    Tornado: '🌪️'
  };

  return map[condition] || '🌡️';
}