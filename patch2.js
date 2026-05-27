const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'flight-search.html');
let html = fs.readFileSync(file, 'utf8');

html = html.replace(/<div class="field full">n.*?<\/div>n            <div class="field full">/s, `<div class="field full">
              <label for="airlineFilter">Airline</label>
              <select id="airlineFilter" name="airlineFilter">
                <option value="any">Any Airline</option>
              </select>
            </div>
            <div class="field full">
              <label for="sortBy">Sort by</label>
              <select id="sortBy" name="sortBy">
                <option value="price_asc">Price (Lowest first)</option>
                <option value="price_desc">Price (Highest first)</option>
                <option value="time_asc">Duration (Fastest first)</option>
                <option value="dep_asc">Departure (Earliest first)</option>
                <option value="dep_desc">Departure (Latest first)</option>
              </select>
            </div>
            <div class="field full">`);

const newLogic = `// populate airline dropdown after flights load
    function populateAirlines(dir) {
      if (!state.flights[dir]) return;
      const airlines = [...new Set(state.flights[dir].map(f => f.airline).filter(Boolean))].sort();
      const sel = el.airlineFilter;
      const prev = sel.value;
      if (sel.options.length <= 1 || sel.dataset.populated !== dir) {
        sel.innerHTML = '<option value="any">Any Airline</option>' +
          airlines.map(a => \`<option value="\${a}"\${a === prev ? ' selected' : ''}>\${a}</option>\`).join('');
        sel.dataset.populated = dir;
      }
    }

    const sortFlights = (flights) => {
      const s = el.sortBy.value;
      return [...flights].sort((a, b) => {
        if (s === "price_asc")  return a.price - b.price;
        if (s === "price_desc") return b.price - a.price;
        if (s === "time_asc")   return a.durationMinutes - b.durationMinutes;
        if (s === "dep_asc")    return a.depart.localeCompare(b.depart);
        if (s === "dep_desc")   return b.depart.localeCompare(a.depart);
        return a.price - b.price;
      });
    };

    const inAirline = (f) => el.airlineFilter.value === "any" || f.airline === el.airlineFilter.value;

    const filtered = (dir) => sortFlights(
      state.flights[dir]
        .filter(f => inWindow(f, dir))
        .filter(inStops)
        .filter(inAirline)
        .filter(f => el.baggage.value === "none" || f.bagKg >= reqBagKg() || f.bagKg === 0)
    );`;

html = html.replace(/const filtered = \(dir\) => state\.flights\[dir\][\s\S]*?\.sort\(\(a, b\) => a\.price - b\.price\);/, newLogic);

if (!html.includes('populateAirlines(state.activeTab);')) {
  html = html.replace(/function renderFlights\(\) \{(\s*)updateHeader\(\);/, `function renderFlights() {$1populateAirlines(state.activeTab);$1updateHeader();`);
}

if (!html.includes('el.airlineFilter.addEventListener')) {
  html = html.replace(/el\.maxStops\.addEventListener\("change", renderFlights\);/, `el.maxStops.addEventListener("change", renderFlights);\n    el.airlineFilter.addEventListener("change", renderFlights);\n    el.sortBy.addEventListener("change", renderFlights);`);
}

fs.writeFileSync(file, html);
console.log('Patched');
