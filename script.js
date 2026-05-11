const DEFAULT_PLACE = {
  name: "New York",
  admin1: "New York",
  country: "United States",
  country_code: "US",
  latitude: 40.7128,
  longitude: -74.006
};

const STORAGE_KEY = "skycast:last-place";
const SEARCH_MIN_LENGTH = 2;
const MAX_SUGGESTIONS = 6;

const WEATHER_CODES = {
  0: { label: "Clear sky", icon: "\u2600" },
  1: { label: "Mostly clear", icon: "\u{1F324}" },
  2: { label: "Partly cloudy", icon: "\u26C5" },
  3: { label: "Overcast", icon: "\u2601" },
  45: { label: "Fog", icon: "\u{1F32B}" },
  48: { label: "Rime fog", icon: "\u{1F32B}" },
  51: { label: "Light drizzle", icon: "\u{1F326}" },
  53: { label: "Drizzle", icon: "\u{1F326}" },
  55: { label: "Dense drizzle", icon: "\u{1F327}" },
  56: { label: "Freezing drizzle", icon: "\u{1F327}" },
  57: { label: "Heavy freezing drizzle", icon: "\u{1F327}" },
  61: { label: "Light rain", icon: "\u{1F326}" },
  63: { label: "Rain", icon: "\u{1F327}" },
  65: { label: "Heavy rain", icon: "\u{1F327}" },
  66: { label: "Freezing rain", icon: "\u{1F327}" },
  67: { label: "Heavy freezing rain", icon: "\u{1F327}" },
  71: { label: "Light snow", icon: "\u{1F328}" },
  73: { label: "Snow", icon: "\u{1F328}" },
  75: { label: "Heavy snow", icon: "\u2744" },
  77: { label: "Snow grains", icon: "\u2744" },
  80: { label: "Rain showers", icon: "\u{1F326}" },
  81: { label: "Heavy showers", icon: "\u{1F327}" },
  82: { label: "Violent showers", icon: "\u{1F327}" },
  85: { label: "Snow showers", icon: "\u{1F328}" },
  86: { label: "Heavy snow showers", icon: "\u2744" },
  95: { label: "Thunderstorm", icon: "\u26C8" },
  96: { label: "Storm with hail", icon: "\u26C8" },
  99: { label: "Severe hailstorm", icon: "\u26C8" }
};

const THEMES = {
  clearDay: {
    "--bg-top": "#1d4c82",
    "--bg-bottom": "#071423",
    "--accent": "#9ee7ff",
    "--accent-soft": "rgba(158, 231, 255, 0.18)",
    "--surface": "rgba(9, 20, 36, 0.46)"
  },
  clearNight: {
    "--bg-top": "#111a3d",
    "--bg-bottom": "#030713",
    "--accent": "#c9c8ff",
    "--accent-soft": "rgba(201, 200, 255, 0.18)",
    "--surface": "rgba(9, 14, 30, 0.58)"
  },
  cloudy: {
    "--bg-top": "#31485f",
    "--bg-bottom": "#09121b",
    "--accent": "#b3d9ff",
    "--accent-soft": "rgba(179, 217, 255, 0.18)",
    "--surface": "rgba(9, 16, 27, 0.56)"
  },
  rain: {
    "--bg-top": "#21354f",
    "--bg-bottom": "#040b15",
    "--accent": "#8ce4e7",
    "--accent-soft": "rgba(140, 228, 231, 0.18)",
    "--surface": "rgba(7, 14, 26, 0.6)"
  },
  storm: {
    "--bg-top": "#2f2d59",
    "--bg-bottom": "#04050d",
    "--accent": "#f7cd7b",
    "--accent-soft": "rgba(247, 205, 123, 0.18)",
    "--surface": "rgba(10, 12, 24, 0.62)"
  },
  snow: {
    "--bg-top": "#5c7295",
    "--bg-bottom": "#0a1220",
    "--accent": "#ebfbff",
    "--accent-soft": "rgba(235, 251, 255, 0.18)",
    "--surface": "rgba(10, 18, 33, 0.58)"
  },
  mist: {
    "--bg-top": "#495c69",
    "--bg-bottom": "#080d14",
    "--accent": "#d8f2ff",
    "--accent-soft": "rgba(216, 242, 255, 0.18)",
    "--surface": "rgba(11, 16, 24, 0.58)"
  }
};

const state = {
  place: null,
  weather: null,
  suggestions: [],
  suggestionsQuery: "",
  activeSuggestionIndex: -1,
  searchTimeoutId: null,
  searchController: null,
  selectedDayIndex: 0
};

const elements = {
  form: document.getElementById("search-form"),
  searchInput: document.getElementById("search-input"),
  geoButton: document.getElementById("geo-button"),
  suggestions: document.getElementById("suggestions"),
  stateBanner: document.getElementById("state-banner"),
  locationLabel: document.getElementById("location-label"),
  statusText: document.getElementById("status-text"),
  currentDate: document.getElementById("current-date"),
  temperatureValue: document.getElementById("temperature-value"),
  conditionText: document.getElementById("condition-text"),
  feelsLike: document.getElementById("feels-like"),
  conditionIcon: document.getElementById("condition-icon"),
  spotlightCopy: document.getElementById("spotlight-copy"),
  humidity: document.getElementById("humidity-value"),
  wind: document.getElementById("wind-value"),
  rain: document.getElementById("rain-value"),
  pressure: document.getElementById("pressure-value"),
  sunrise: document.getElementById("sunrise-value"),
  sunset: document.getElementById("sunset-value"),
  hourlyTitle: document.getElementById("hourly-title"),
  hourlySummary: document.getElementById("hourly-summary"),
  hourlyList: document.getElementById("hourly-list"),
  dailyRange: document.getElementById("daily-range"),
  dailyList: document.getElementById("daily-list"),
  selectedDayLabel: document.getElementById("selected-day-label"),
  selectedDaySummary: document.getElementById("selected-day-summary"),
  selectedMax: document.getElementById("selected-max"),
  selectedMin: document.getElementById("selected-min"),
  selectedRain: document.getElementById("selected-rain"),
  selectedUv: document.getElementById("selected-uv"),
  selectedSunrise: document.getElementById("selected-sunrise"),
  selectedSunset: document.getElementById("selected-sunset")
};

function init() {
  bindEvents();

  const savedPlace = readSavedPlace();
  const initialPlace = savedPlace ?? DEFAULT_PLACE;
  elements.searchInput.value = formatPlace(initialPlace);
  loadWeather(initialPlace, `Loading live weather for ${formatPlace(initialPlace)}.`);
}

function bindEvents() {
  elements.form.addEventListener("submit", handleSearchSubmit);
  elements.searchInput.addEventListener("input", handleSearchInput);
  elements.searchInput.addEventListener("keydown", handleSearchKeydown);
  elements.geoButton.addEventListener("click", handleUseMyLocation);
  elements.suggestions.addEventListener("click", handleSuggestionClick);
  elements.dailyList.addEventListener("click", handleDaySelection);

  document.addEventListener("click", (event) => {
    if (!elements.form.contains(event.target)) {
      hideSuggestions();
    }
  });
}

async function handleSearchSubmit(event) {
  event.preventDefault();

  const query = elements.searchInput.value.trim();
  if (!query) {
    showBanner("Enter a city or region to load its weather.", "error");
    elements.searchInput.focus();
    return;
  }

  if (state.activeSuggestionIndex >= 0 && state.suggestions[state.activeSuggestionIndex]) {
    selectPlace(state.suggestions[state.activeSuggestionIndex]);
    return;
  }

  let nextPlace = state.suggestionsQuery === query ? state.suggestions[0] : null;
  if (!nextPlace) {
    const results = await fetchLocations(query);
    nextPlace = results[0];
  }

  if (!nextPlace) {
    showBanner(`No places matched "${query}". Try another search.`, "error");
    return;
  }

  selectPlace(nextPlace);
}

function handleSearchInput(event) {
  const query = event.target.value.trim();
  state.activeSuggestionIndex = -1;

  if (state.searchTimeoutId) {
    window.clearTimeout(state.searchTimeoutId);
  }

  if (query.length < SEARCH_MIN_LENGTH) {
    state.suggestions = [];
    state.suggestionsQuery = "";
    hideSuggestions();
    return;
  }

  state.searchTimeoutId = window.setTimeout(async () => {
    const results = await fetchLocations(query);
    if (elements.searchInput.value.trim() === query) {
      renderSuggestions(results);
    }
  }, 240);
}

function handleSearchKeydown(event) {
  if (elements.suggestions.hidden) {
    if (event.key === "Escape") {
      hideSuggestions();
    }
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    state.activeSuggestionIndex = Math.min(state.activeSuggestionIndex + 1, state.suggestions.length - 1);
    renderSuggestions(state.suggestions);
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    state.activeSuggestionIndex = Math.max(state.activeSuggestionIndex - 1, 0);
    renderSuggestions(state.suggestions);
    return;
  }

  if (event.key === "Escape") {
    hideSuggestions();
  }
}

function handleUseMyLocation() {
  if (!navigator.geolocation) {
    showBanner("This browser does not support location access. Search for a city instead.", "error");
    return;
  }

  elements.statusText.textContent = "Requesting your location";
  showBanner("Allow location access to load weather near you.", "info");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const currentPlace = {
        name: "Current location",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      elements.searchInput.value = currentPlace.name;
      loadWeather(currentPlace, "Loading weather for your current location.");
    },
    () => {
      showBanner("Location access was not granted. Search for a city to continue.", "error");
      elements.statusText.textContent = "Location permission needed";
    },
    { enableHighAccuracy: true, timeout: 12000 }
  );
}

function handleSuggestionClick(event) {
  const suggestionButton = event.target.closest("button[data-index]");
  if (!suggestionButton) {
    return;
  }

  const index = Number(suggestionButton.dataset.index);
  const selectedPlace = state.suggestions[index];
  if (selectedPlace) {
    selectPlace(selectedPlace);
  }
}

function handleDaySelection(event) {
  const button = event.target.closest("button[data-day-index]");
  if (!button || !state.weather) {
    return;
  }

  state.selectedDayIndex = Number(button.dataset.dayIndex);
  renderForecastViews();
}

function selectPlace(place) {
  hideSuggestions();
  elements.searchInput.value = formatPlace(place);
  loadWeather(place, `Loading live weather for ${formatPlace(place)}.`);
}

async function fetchLocations(query) {
  if (state.searchController) {
    state.searchController.abort();
  }

  state.searchController = new AbortController();

  try {
    const endpoint = new URL("https://geocoding-api.open-meteo.com/v1/search");
    endpoint.search = new URLSearchParams({
      name: query,
      count: String(MAX_SUGGESTIONS),
      language: "en",
      format: "json"
    }).toString();

    const response = await fetch(endpoint, { signal: state.searchController.signal });
    if (!response.ok) {
      throw new Error("Location lookup failed.");
    }

    const payload = await response.json();
    state.suggestions = payload.results ?? [];
    state.suggestionsQuery = query;
    return state.suggestions;
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error(error);
      showBanner("Location search is unavailable right now. Try again in a moment.", "error");
    }
    return [];
  }
}

async function loadWeather(place, loadingMessage) {
  try {
    state.selectedDayIndex = 0;
    elements.statusText.textContent = "Refreshing weather";
    showBanner(loadingMessage, "info");

    const weatherData = await fetchWeather(place);
    state.weather = normalizeWeatherData(weatherData, place);
    state.place = state.weather.place;

    applyTheme(resolveTheme(state.weather.current.weatherCode, state.weather.current.isDay));
    renderCurrentConditions();
    renderForecastViews();
    elements.searchInput.value = formatPlace(state.place);
    hideBanner();
    elements.statusText.textContent = `Live in ${state.weather.timezone}`;
    savePlace(state.place);
  } catch (error) {
    console.error(error);
    elements.statusText.textContent = "Weather unavailable";
    showBanner("Weather data could not be loaded. Try another place or retry in a moment.", "error");
  }
}

async function fetchWeather(place) {
  const endpoint = new URL("https://api.open-meteo.com/v1/forecast");
  endpoint.search = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "surface_pressure"
    ].join(","),
    hourly: [
      "temperature_2m",
      "apparent_temperature",
      "precipitation_probability",
      "weather_code"
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "sunrise",
      "sunset",
      "uv_index_max"
    ].join(","),
    timezone: "auto",
    forecast_days: "7"
  }).toString();

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error("Weather request failed.");
  }

  return response.json();
}

function normalizeWeatherData(payload, place) {
  const daily = payload.daily.time.map((date, index) => ({
    date,
    weatherCode: payload.daily.weather_code[index],
    maxTemp: payload.daily.temperature_2m_max[index],
    minTemp: payload.daily.temperature_2m_min[index],
    rainChance: payload.daily.precipitation_probability_max[index],
    sunrise: payload.daily.sunrise[index],
    sunset: payload.daily.sunset[index],
    uvIndex: payload.daily.uv_index_max[index]
  }));

  const hourly = payload.hourly.time.map((time, index) => ({
    time,
    date: time.slice(0, 10),
    temperature: payload.hourly.temperature_2m[index],
    apparentTemperature: payload.hourly.apparent_temperature[index],
    rainChance: payload.hourly.precipitation_probability[index],
    weatherCode: payload.hourly.weather_code[index]
  }));

  const hourlyByDate = hourly.reduce((collection, hour) => {
    if (!collection[hour.date]) {
      collection[hour.date] = [];
    }
    collection[hour.date].push(hour);
    return collection;
  }, {});

  return {
    place: {
      ...place,
      timezone: payload.timezone
    },
    timezone: payload.timezone,
    current: {
      time: payload.current.time,
      temperature: payload.current.temperature_2m,
      humidity: payload.current.relative_humidity_2m,
      apparentTemperature: payload.current.apparent_temperature,
      isDay: payload.current.is_day,
      precipitation: payload.current.precipitation,
      weatherCode: payload.current.weather_code,
      windSpeed: payload.current.wind_speed_10m,
      pressure: payload.current.surface_pressure
    },
    daily,
    hourlyByDate
  };
}

function renderCurrentConditions() {
  const { current, daily, place } = state.weather;
  const today = daily[0];
  const weatherMeta = getWeatherMeta(current.weatherCode);

  elements.locationLabel.textContent = formatPlace(place);
  elements.currentDate.textContent = `${formatWeekday(current.time)} / ${formatClock(current.time)}`;
  elements.temperatureValue.textContent = Math.round(current.temperature);
  elements.conditionText.textContent = weatherMeta.label;
  elements.feelsLike.textContent = `Feels like ${formatTemp(current.apparentTemperature)}`;
  elements.conditionIcon.textContent = weatherMeta.icon;
  elements.spotlightCopy.textContent = `${weatherMeta.label} with ${Math.round(current.windSpeed)} km/h winds and ${Math.round(current.humidity)}% humidity.`;
  elements.humidity.textContent = `${Math.round(current.humidity)}%`;
  elements.wind.textContent = `${Math.round(current.windSpeed)} km/h`;
  elements.rain.textContent = `${formatNumber(current.precipitation)} mm`;
  elements.pressure.textContent = `${Math.round(current.pressure)} hPa`;
  elements.sunrise.textContent = formatClock(today.sunrise);
  elements.sunset.textContent = formatClock(today.sunset);
  elements.dailyRange.textContent = `${formatShortDate(daily[0].date)} to ${formatShortDate(daily[daily.length - 1].date)}`;
}

function renderForecastViews() {
  renderDailyForecast();
  renderSelectedDayDetails();
  renderHourlyForecast();
}

function renderDailyForecast() {
  const markup = state.weather.daily.map((day, index) => {
    const meta = getWeatherMeta(day.weatherCode);
    const isActive = index === state.selectedDayIndex;
    const label = index === 0 ? "Today" : formatWeekday(day.date);

    return `
      <button
        type="button"
        class="daily-item${isActive ? " is-active" : ""}"
        data-day-index="${index}"
        aria-pressed="${isActive}"
      >
        <span class="daily-meta">
          <strong>${label}</strong>
          <span>${meta.label}</span>
        </span>
        <span>${meta.icon}</span>
        <span class="daily-temps">
          <strong>${formatTemp(day.maxTemp)}</strong>
          <span>${formatTemp(day.minTemp)}</span>
        </span>
      </button>
    `;
  }).join("");

  elements.dailyList.innerHTML = markup;
}

function renderSelectedDayDetails() {
  const selectedDay = state.weather.daily[state.selectedDayIndex];
  const meta = getWeatherMeta(selectedDay.weatherCode);

  elements.selectedDayLabel.textContent = state.selectedDayIndex === 0 ? "Today" : formatLongDate(selectedDay.date);
  elements.selectedDaySummary.textContent = `${meta.label} with a ${Math.round(selectedDay.rainChance)}% chance of rain and a ${formatTemp(selectedDay.maxTemp - selectedDay.minTemp)} daytime swing.`;
  elements.selectedMax.textContent = formatTemp(selectedDay.maxTemp);
  elements.selectedMin.textContent = formatTemp(selectedDay.minTemp);
  elements.selectedRain.textContent = `${Math.round(selectedDay.rainChance)}%`;
  elements.selectedUv.textContent = formatNumber(selectedDay.uvIndex, 1);
  elements.selectedSunrise.textContent = formatClock(selectedDay.sunrise);
  elements.selectedSunset.textContent = formatClock(selectedDay.sunset);
}

function renderHourlyForecast() {
  const selectedDay = state.weather.daily[state.selectedDayIndex];
  const currentDate = state.weather.current.time.slice(0, 10);
  const rawHours = state.weather.hourlyByDate[selectedDay.date] ?? [];

  let hours = rawHours;
  if (selectedDay.date === currentDate) {
    hours = rawHours.filter((hour) => hour.time >= state.weather.current.time);
  }

  const sampledHours = sampleHourlyEntries(hours);
  elements.hourlyTitle.textContent = selectedDay.date === currentDate
    ? "The next hours"
    : `${formatWeekday(selectedDay.date)} timeline`;
  elements.hourlySummary.textContent = `Local time in ${formatPlace(state.weather.place)}.`;

  if (!sampledHours.length) {
    elements.hourlyList.innerHTML = "<p>No hourly forecast is available for this day.</p>";
    return;
  }

  elements.hourlyList.innerHTML = sampledHours.map((hour, index) => {
    const meta = getWeatherMeta(hour.weatherCode);

    return `
      <article class="hourly-item" style="animation-delay: ${index * 60}ms">
        <time datetime="${hour.time}">${formatClock(hour.time)}</time>
        <span class="hourly-icon" aria-hidden="true">${meta.icon}</span>
        <span class="hourly-temp">${formatTemp(hour.temperature)}</span>
        <p>${meta.label}</p>
        <p class="hourly-rain">Rain ${Math.round(hour.rainChance)}%</p>
      </article>
    `;
  }).join("");
}

function renderSuggestions(suggestions) {
  state.suggestions = suggestions;

  if (!suggestions.length) {
    hideSuggestions();
    return;
  }

  const markup = suggestions.map((suggestion, index) => {
    const isActive = index === state.activeSuggestionIndex;

    return `
      <li role="presentation">
        <button
          type="button"
          class="suggestion-button${isActive ? " is-active" : ""}"
          role="option"
          aria-selected="${isActive}"
          data-index="${index}"
        >
          <span class="suggestion-name">${suggestion.name}</span>
          <span class="suggestion-meta">${formatPlace(suggestion)}</span>
        </button>
      </li>
    `;
  }).join("");

  elements.suggestions.innerHTML = markup;
  elements.suggestions.hidden = false;
  elements.searchInput.setAttribute("aria-expanded", "true");
}

function hideSuggestions() {
  elements.suggestions.hidden = true;
  elements.suggestions.innerHTML = "";
  elements.searchInput.setAttribute("aria-expanded", "false");
  state.activeSuggestionIndex = -1;
}

function applyTheme(themeName) {
  const nextTheme = THEMES[themeName] ?? THEMES.cloudy;
  Object.entries(nextTheme).forEach(([name, value]) => {
    document.documentElement.style.setProperty(name, value);
  });
}

function resolveTheme(weatherCode, isDay) {
  if ([95, 96, 99].includes(weatherCode)) {
    return "storm";
  }

  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return "snow";
  }

  if ([45, 48].includes(weatherCode)) {
    return "mist";
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
    return "rain";
  }

  if (weatherCode === 0) {
    return isDay ? "clearDay" : "clearNight";
  }

  return "cloudy";
}

function getWeatherMeta(code) {
  return WEATHER_CODES[code] ?? { label: "Variable conditions", icon: "\u2601" };
}

function sampleHourlyEntries(hours) {
  if (hours.length <= 8) {
    return hours;
  }

  const everyThreeHours = hours.filter((hour) => Number(hour.time.slice(11, 13)) % 3 === 0);
  if (everyThreeHours.length >= 6) {
    return everyThreeHours.slice(0, 8);
  }

  return hours.filter((_, index) => index % 2 === 0).slice(0, 8);
}

function formatPlace(place) {
  const parts = [place.name];
  if (place.admin1 && place.admin1 !== place.name) {
    parts.push(place.admin1);
  }

  if (place.country) {
    parts.push(place.country);
  } else if (place.country_code) {
    parts.push(place.country_code);
  }

  return parts.filter(Boolean).join(", ");
}

function formatTemp(value) {
  return `${Math.round(value)}\u00B0`;
}

function formatNumber(value, precision = 0) {
  return Number(value).toFixed(precision);
}

function formatWeekday(dateTimeValue) {
  const date = toUtcDate(dateTimeValue);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(date);
}

function formatLongDate(dateValue) {
  const date = toUtcDate(dateValue);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(date);
}

function formatShortDate(dateValue) {
  const date = toUtcDate(dateValue);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function formatClock(dateTimeValue) {
  const [hoursText, minutesText] = dateTimeValue.slice(11, 16).split(":");
  let hours = Number(hoursText);
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutesText} ${suffix}`;
}

function toUtcDate(dateValue) {
  const cleanDate = dateValue.slice(0, 10);
  return new Date(`${cleanDate}T00:00:00Z`);
}

function showBanner(message, tone) {
  elements.stateBanner.hidden = false;
  elements.stateBanner.dataset.tone = tone;
  elements.stateBanner.textContent = message;
}

function hideBanner() {
  elements.stateBanner.hidden = true;
  elements.stateBanner.textContent = "";
}

function savePlace(place) {
  if (place.name === "Current location") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(place));
}

function readSavedPlace() {
  try {
    const savedPlace = localStorage.getItem(STORAGE_KEY);
    return savedPlace ? JSON.parse(savedPlace) : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

init();
