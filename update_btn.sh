#!/bin/bash
node -e "
const fs = require('fs');
const file = 'client/src/components/FlightCard.tsx';
let code = fs.readFileSync(file, 'utf8');

const newClick = \`          onClick={() => {
            const query = encodeURIComponent(\\\\\`Flights to \${flight.to} from \${flight.from} with \${flight.airline}\\\\\`);
            window.open(\\\\\`https://www.google.com/travel/flights?q=\${query}\\\\\`, \\\"_blank\\\");
          }}\`;

code = code.replace('type=\"button\"', 'type=\"button\"\\n' + newClick);
fs.writeFileSync(file, code);
"
