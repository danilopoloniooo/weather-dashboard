(function(){
  "use strict";

  // ---------- Elementos ----------
  const cityInput = document.getElementById('cityInput');
  const suggestionsBox = document.getElementById('suggestions');
  const locateBtn = document.getElementById('locateBtn');

  const stateEmpty = document.getElementById('stateEmpty');
  const stateLoading = document.getElementById('stateLoading');
  const stateError = document.getElementById('stateError');
  const result = document.getElementById('result');
  const errorTitle = document.getElementById('errorTitle');
  const errorSub = document.getElementById('errorSub');

  const skyA = document.getElementById('sky-a');
  const skyB = document.getElementById('sky-b');
  let skyTopIsA = true;

  // ---------- Cenários visuais por condição/período do dia ----------
  const SCENES = {
    'clear-day':    { from:'#2E6FBF', to:'#8FC0E8', accent:'#F2A65A' },
    'clear-night':  { from:'#0B1330', to:'#2B2E68', accent:'#8FA6F2' },
    'cloudy-day':   { from:'#4B5A73', to:'#8896AB', accent:'#D8E0EA' },
    'cloudy-night': { from:'#151C2C', to:'#37415A', accent:'#9AA8C2' },
    'fog':          { from:'#54606E', to:'#8A93A0', accent:'#E4E8ED' },
    'rain':         { from:'#1C2C42', to:'#3E5876', accent:'#6FCFEB' },
    'snow':         { from:'#3D5A82', to:'#9DBDDD', accent:'#F4F9FF' },
    'storm':        { from:'#181322', to:'#3C2E4C', accent:'#F2C15A' }
  };

  function applyScene(key){
    const scene = SCENES[key] || SCENES['clear-day'];
    const gradient = `radial-gradient(120% 90% at 50% -10%, ${scene.to} 0%, ${scene.from} 60%, ${scene.from} 100%)`;
    const nextLayer = skyTopIsA ? skyB : skyA;
    const prevLayer = skyTopIsA ? skyA : skyB;
    nextLayer.style.background = gradient;
    nextLayer.style.opacity = '1';
    prevLayer.style.opacity = '0';
    skyTopIsA = !skyTopIsA;
    document.documentElement.style.setProperty('--accent', scene.accent);
  }

  // ---------- Mapeamento de códigos meteorológicos (WMO) ----------
  function describeWeather(code, isDay){
    const day = isDay === 1;
    const map = {
      0:  { label: 'Céu limpo',        scene: day ? 'clear-day' : 'clear-night', icon: day ? 'sun' : 'moon' },
      1:  { label: 'Predominantemente limpo', scene: day ? 'clear-day' : 'clear-night', icon: day ? 'sun-cloud' : 'moon-cloud' },
      2:  { label: 'Parcialmente nublado', scene: day ? 'cloudy-day' : 'cloudy-night', icon: day ? 'sun-cloud' : 'moon-cloud' },
      3:  { label: 'Nublado',          scene: day ? 'cloudy-day' : 'cloudy-night', icon: 'cloud' },
      45: { label: 'Neblina',          scene: 'fog', icon: 'fog' },
      48: { label: 'Neblina com geada',scene: 'fog', icon: 'fog' },
      51: { label: 'Garoa fraca',      scene: 'rain', icon: 'rain-light' },
      53: { label: 'Garoa moderada',   scene: 'rain', icon: 'rain-light' },
      55: { label: 'Garoa forte',      scene: 'rain', icon: 'rain' },
      56: { label: 'Garoa congelante', scene: 'rain', icon: 'rain-light' },
      57: { label: 'Garoa congelante forte', scene: 'rain', icon: 'rain' },
      61: { label: 'Chuva fraca',      scene: 'rain', icon: 'rain-light' },
      63: { label: 'Chuva moderada',   scene: 'rain', icon: 'rain' },
      65: { label: 'Chuva forte',      scene: 'rain', icon: 'rain' },
      66: { label: 'Chuva congelante', scene: 'rain', icon: 'rain' },
      67: { label: 'Chuva congelante forte', scene: 'rain', icon: 'rain' },
      71: { label: 'Neve fraca',       scene: 'snow', icon: 'snow' },
      73: { label: 'Neve moderada',    scene: 'snow', icon: 'snow' },
      75: { label: 'Neve forte',       scene: 'snow', icon: 'snow' },
      77: { label: 'Grãos de neve',    scene: 'snow', icon: 'snow' },
      80: { label: 'Pancadas de chuva fracas', scene: 'rain', icon: 'rain-light' },
      81: { label: 'Pancadas de chuva', scene: 'rain', icon: 'rain' },
      82: { label: 'Pancadas de chuva fortes', scene: 'rain', icon: 'rain' },
      85: { label: 'Pancadas de neve fracas', scene: 'snow', icon: 'snow' },
      86: { label: 'Pancadas de neve fortes', scene: 'snow', icon: 'snow' },
      95: { label: 'Tempestade',       scene: 'storm', icon: 'storm' },
      96: { label: 'Tempestade com granizo', scene: 'storm', icon: 'storm' },
      99: { label: 'Tempestade com granizo forte', scene: 'storm', icon: 'storm' }
    };
    return map[code] || { label: 'Condição desconhecida', scene: day ? 'cloudy-day' : 'cloudy-night', icon: 'cloud' };
  }

  // ---------- Ícones (SVG inline, usam a cor de destaque da cena) ----------
  const ICONS = {
    sun: `<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="13" fill="var(--accent)"/><g stroke="var(--accent)" stroke-width="3.2" stroke-linecap="round"><line x1="32" y1="4" x2="32" y2="12"/><line x1="32" y1="52" x2="32" y2="60"/><line x1="4" y1="32" x2="12" y2="32"/><line x1="52" y1="32" x2="60" y2="32"/><line x1="11" y1="11" x2="16.5" y2="16.5"/><line x1="47.5" y1="47.5" x2="53" y2="53"/><line x1="11" y1="53" x2="16.5" y2="47.5"/><line x1="47.5" y1="16.5" x2="53" y2="11"/></g></svg>`,
    moon: `<svg viewBox="0 0 64 64" fill="none"><path d="M40 8a24 24 0 1 0 16 42 20 20 0 0 1-16-42Z" fill="var(--accent)"/></svg>`,
    cloud: `<svg viewBox="0 0 64 64" fill="none"><path d="M20 44a11 11 0 0 1-1-21.9A14 14 0 0 1 46 26a10 10 0 0 1-2 18H20Z" fill="var(--accent)" opacity="0.9"/></svg>`,
    'sun-cloud': `<svg viewBox="0 0 64 64" fill="none"><circle cx="24" cy="22" r="10" fill="var(--accent)"/><g stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round"><line x1="24" y1="4" x2="24" y2="9"/><line x1="8" y1="22" x2="13" y2="22"/><line x1="11" y1="9" x2="14.5" y2="12.5"/></g><path d="M24 46a11 11 0 0 1-1-21.9 13.9 13.9 0 0 1 25.6 5A10 10 0 0 1 47 48H24Z" fill="#EDEFF2" opacity="0.92"/></svg>`,
    'moon-cloud': `<svg viewBox="0 0 64 64" fill="none"><path d="M34 8a13 13 0 1 0 8 23 10.8 10.8 0 0 1-8-23Z" fill="var(--accent)"/><path d="M24 46a11 11 0 0 1-1-21.9 13.9 13.9 0 0 1 25.6 5A10 10 0 0 1 47 48H24Z" fill="#DDE2EA" opacity="0.9"/></svg>`,
    fog: `<svg viewBox="0 0 64 64" fill="none"><path d="M20 26a11 11 0 0 1 22.5-3.5A10 10 0 0 1 44 42H20a9 9 0 0 1 0-18Z" fill="var(--accent)" opacity="0.55"/><g stroke="#F2F5F8" stroke-width="3" stroke-linecap="round" opacity="0.85"><line x1="12" y1="48" x2="52" y2="48"/><line x1="16" y1="55" x2="48" y2="55"/></g></svg>`,
    rain: `<svg viewBox="0 0 64 64" fill="none"><path d="M20 36a11 11 0 0 1-1-21.9A14 14 0 0 1 46 18a10 10 0 0 1-2 18H20Z" fill="var(--accent)" opacity="0.9"/><g stroke="var(--accent)" stroke-width="3" stroke-linecap="round"><line x1="22" y1="44" x2="18" y2="56"/><line x1="34" y1="44" x2="30" y2="56"/><line x1="46" y1="44" x2="42" y2="56"/></g></svg>`,
    'rain-light': `<svg viewBox="0 0 64 64" fill="none"><path d="M20 34a11 11 0 0 1-1-21.9A14 14 0 0 1 46 16a10 10 0 0 1-2 18H20Z" fill="var(--accent)" opacity="0.9"/><g stroke="var(--accent)" stroke-width="3" stroke-linecap="round" opacity="0.75"><line x1="24" y1="44" x2="21" y2="52"/><line x1="40" y1="44" x2="37" y2="52"/></g></svg>`,
    snow: `<svg viewBox="0 0 64 64" fill="none"><path d="M20 34a11 11 0 0 1-1-21.9A14 14 0 0 1 46 16a10 10 0 0 1-2 18H20Z" fill="var(--accent)" opacity="0.9"/><g stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round"><line x1="24" y1="46" x2="24" y2="54"/><line x1="20" y1="50" x2="28" y2="50"/><line x1="40" y1="46" x2="40" y2="54"/><line x1="36" y1="50" x2="44" y2="50"/></g></svg>`,
    storm: `<svg viewBox="0 0 64 64" fill="none"><path d="M20 32a11 11 0 0 1-1-21.9A14 14 0 0 1 46 14a10 10 0 0 1-2 18H20Z" fill="#8B93A5"/><path d="M33 38 24 52h8l-4 10 14-16h-8l5-8Z" fill="var(--accent)"/></svg>`
  };

  // ---------- Máquina de estados de UI ----------
  function showState(state){
    stateEmpty.style.display = state === 'empty' ? 'flex' : 'none';
    stateLoading.style.display = state === 'loading' ? 'flex' : 'none';
    stateError.style.display = state === 'error' ? 'flex' : 'none';
    result.classList.toggle('visible', state === 'result');
  }

  function showError(title, sub){
    errorTitle.textContent = title;
    errorSub.textContent = sub;
    showState('error');
  }

  // ---------- Busca de cidades (geocoding) ----------
  let debounceTimer = null;
  let activeSuggestionIndex = -1;
  let currentSuggestions = [];

  cityInput.addEventListener('input', () => {
    const query = cityInput.value.trim();
    clearTimeout(debounceTimer);
    if (query.length < 2){
      hideSuggestions();
      return;
    }
    debounceTimer = setTimeout(() => fetchSuggestions(query), 380);
  });

  cityInput.addEventListener('keydown', (e) => {
    if (!currentSuggestions.length) return;
    if (e.key === 'ArrowDown'){
      e.preventDefault();
      activeSuggestionIndex = Math.min(activeSuggestionIndex + 1, currentSuggestions.length - 1);
      renderSuggestions();
    } else if (e.key === 'ArrowUp'){
      e.preventDefault();
      activeSuggestionIndex = Math.max(activeSuggestionIndex - 1, 0);
      renderSuggestions();
    } else if (e.key === 'Enter'){
      e.preventDefault();
      const pick = currentSuggestions[activeSuggestionIndex >= 0 ? activeSuggestionIndex : 0];
      if (pick) selectCity(pick);
    } else if (e.key === 'Escape'){
      hideSuggestions();
    }
  });

  document.addEventListener('click', (e) => {
    if (!suggestionsBox.contains(e.target) && e.target !== cityInput){
      hideSuggestions();
    }
  });

  async function fetchSuggestions(query){
    try{
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=pt&format=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('geocoding failed');
      const data = await res.json();
      currentSuggestions = data.results || [];
      activeSuggestionIndex = -1;
      if (!currentSuggestions.length){
        renderSuggestionMessage('Nenhuma cidade encontrada com esse nome.');
        return;
      }
      renderSuggestions();
    }catch(err){
      console.error('Falha ao buscar cidades:', err);
      renderSuggestionMessage('Não foi possível buscar cidades agora. Verifique sua conexão com a internet (se você abriu este arquivo direto do disco, tente rodar um servidor local — veja o comentário no topo do código-fonte).');
    }
  }

  function renderSuggestionMessage(text){
    suggestionsBox.innerHTML = `<div class="suggestion-message">${text}</div>`;
    suggestionsBox.style.display = 'block';
  }

  function renderSuggestions(){
    if (!currentSuggestions.length){
      hideSuggestions();
      return;
    }
    suggestionsBox.innerHTML = '';
    currentSuggestions.forEach((place, i) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item' + (i === activeSuggestionIndex ? ' active' : '');
      const region = [place.admin1, place.country].filter(Boolean).join(', ');
      item.innerHTML = `<span class="suggestion-name">${place.name}</span><span class="suggestion-meta">${region}</span>`;
      item.addEventListener('click', () => selectCity(place));
      suggestionsBox.appendChild(item);
    });
    suggestionsBox.style.display = 'block';
  }

  function hideSuggestions(){
    suggestionsBox.style.display = 'none';
    currentSuggestions = [];
    activeSuggestionIndex = -1;
  }

  function selectCity(place){
    hideSuggestions();
    cityInput.value = `${place.name}${place.admin1 ? ', ' + place.admin1 : ''}`;
    loadWeather(place.latitude, place.longitude, place.name, [place.admin1, place.country].filter(Boolean).join(', '));
  }

  // ---------- Busca do clima ----------
  async function loadWeather(lat, lon, cityLabel, regionLabel){
    showState('loading');
    try{
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m` +
        `&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('forecast failed');
      const data = await res.json();
      if (!data.current) throw new Error('sem dados atuais');
      renderWeather(data, cityLabel, regionLabel);
    }catch(err){
      showError('Não foi possível obter a previsão', 'Algo deu errado ao buscar os dados. Tente novamente em instantes.');
    }
  }

  function renderWeather(data, cityLabel, regionLabel){
    const c = data.current;
    const info = describeWeather(c.weather_code, c.is_day);

    applyScene(info.scene);

    document.getElementById('cityName').textContent = cityLabel;
    document.getElementById('cityCountry').textContent = regionLabel || '—';

    document.getElementById('tempMain').innerHTML = `${Math.round(c.temperature_2m)}<sup>°C</sup>`;
    document.getElementById('conditionLabel').textContent = info.label;
    document.getElementById('feelsLike').textContent = `Sensação térmica ${Math.round(c.apparent_temperature)}°C`;

    document.getElementById('humidityValue').textContent = `${Math.round(c.relative_humidity_2m)}%`;
    document.getElementById('windValue').textContent = `${Math.round(c.wind_speed_10m)} km/h`;

    const updated = new Date(c.time);
    const timeStr = updated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('timeValue').textContent = timeStr;
    document.getElementById('updatedBadge').textContent =
      updated.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }) + ' · ' + timeStr;

    document.getElementById('weatherIcon').innerHTML = ICONS[info.icon] || ICONS.cloud;

    showState('result');
  }

  // ---------- Geolocalização do navegador ----------
  locateBtn.addEventListener('click', () => {
    if (!navigator.geolocation){
      showError('Localização indisponível', 'Seu navegador não suporta geolocalização. Busque uma cidade pelo nome.');
      return;
    }
    // Geolocalização só funciona em contexto seguro (HTTPS ou localhost).
    // Ao abrir o arquivo direto do disco (file://), o navegador nega antes mesmo de perguntar,
    // então avisamos isso especificamente em vez de mostrar "permissão negada".
    if (!window.isSecureContext){
      showError(
        'Geolocalização indisponível neste modo',
        'Este arquivo foi aberto localmente (file://), e os navegadores só permitem geolocalização em conexões seguras (HTTPS). Isso não afeta a busca por nome — digite uma cidade acima para continuar usando o dashboard.'
      );
      return;
    }
    locateBtn.classList.add('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let cityLabel = 'Sua localização';
        let regionLabel = '';
        try{
          const revRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`);
          if (revRes.ok){
            const revData = await revRes.json();
            cityLabel = revData.city || revData.locality || cityLabel;
            regionLabel = [revData.principalSubdivision, revData.countryName].filter(Boolean).join(', ');
          }
        }catch(_e){ /* segue com rótulo genérico */ }
        cityInput.value = cityLabel;
        locateBtn.classList.remove('loading');
        loadWeather(latitude, longitude, cityLabel, regionLabel);
      },
      (geoErr) => {
        locateBtn.classList.remove('loading');
        if (geoErr.code === geoErr.PERMISSION_DENIED){
          showError('Permissão de localização negada', 'Você negou o acesso à localização no navegador. Para usar esse recurso, permita o acesso nas configurações do site, ou busque a cidade pelo nome.');
        } else {
          showError('Não foi possível obter sua localização', 'Tente novamente, ou busque a cidade pelo nome diretamente no campo de busca.');
        }
      },
      { timeout: 8000 }
    );
  });

  // ---------- Estado inicial ----------
  applyScene('clear-day');
  showState('empty');

})();
