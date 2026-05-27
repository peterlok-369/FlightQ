const fs = require('fs');
let html = fs.readFileSync('flight-search.html', 'utf8');

// Fix the malformed HTML inserted previously
html = html.replace(/<div class="field full">n              <label for="airlineFilter">Airline<\/label>n              <select id="airlineFilter" name="airlineFilter">n                <option value="any">Any Airline<\/option>n              <\/select>n            <\/div>n            <div class="field full">n              <label for="sortBy">Sort by<\/label>n              <select id="sortBy" name="sortBy">n                <option value="price_asc">Price \(Lowest first\)<\/option>n                <option value="time_asc">Duration \(Fastest first\)<\/option>n                <option value="dep_asc">Departure \(Earliest first\)<\/option>n                <option value="dep_desc">Departure \(Latest first\)<\/option>n              <\/select>n            <\/div>            <div class="field full">/, `<div class="field full">
              <label for="airlineFilter">Airline</label>
              <select id="airlineFilter" name="airlineFilter">
                <option value="any">Any Airline</option>
              </select>
            </div>
            <div class="field full">
              <label for="sortBy">Sort by</label>
              <select id="sortBy" name="sortBy">
                <option value="price_asc">Price (Lowest first)</option>
                <option value="time_asc">Duration (Fastest first)</option>
                <option value="dep_asc">Departure (Earliest first)</option>
                <option value="dep_desc">Departure (Latest first)</option>
              </select>
            </div>
            <div class="field full">`);

// Add DOM references
html = html.replace(/airlineFilter:  \$\("airlineFilter"\),\n      sortBy:         \$\("sortBy"\),      apiProvider:    \$\("apiProvider"\),/, `airlineFilter:  $("airlineFilter"),
      sortBy:         $("sortBy"),
      apiProvider:    $("apiProvider"),`);

// Apply new filtering and sorting logic
const newLogic = `// populate airline dropdown after flights load
    function populateAirlines(dir) {
      if (!state.flights[dir]) return;
      const airlines = [...new Set(state.flights[dir].map(f => f.airline).filter(Boolean))].sort();
      const sel = el.airlineFilter;
      const prev = sel.value;
      sel.innerHTML = '<option value="any">Any Airline</option>' +
        airlines.map(a => \`<option value="\${a}"\${a === prev ? ' selected' : ''}>\${a}</option>\`).join('');
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

// Add populateAirlines to renderFlights
html = html.replace(/function renderFlights\(\) \{(\s*)updateHeader\(\);/, `function renderFlights() {$1populateAirlines(state.activeTab);$1updateHeader();`);

// Add Event Listeners
html = html.replace(/el\.maxStops\.addEventListener\("change", renderFlights\);/, `el.maxStops.addEventListener("change", renderFlights);\n    el.airlineFilter.addEventListener("change", renderFlights);\n    el.sortBy.addEventListener("change", renderFlights);`);

fs.writeFileSync('flight-search.html', html);
console.log('Patched flight-search.html successfully');
