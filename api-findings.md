# RapidAPI Google Flights - Correct Endpoint (May 2026)

## Key Finding
The API name changed from `datacrawler-google-flights-api.p.rapidapi.com` to `google-flights2.p.rapidapi.com`

## Correct cURL
```
curl --request GET \
  --url 'https://google-flights2.p.rapidapi.com/api/v1/searchFlights?departure_id=LAX&arrival_id=JFK&travel_class=ECONOMY&adults=1&show_hidden=1&currency=USD&language_code=en-US&country_code=US&search_type=best' \
  --header 'Content-Type: application/json' \
  --header 'x-rapidapi-host: google-flights2.p.rapidapi.com'
```

## Important Details
- Method: GET (not POST!)
- Host: google-flights2.p.rapidapi.com
- Path: /api/v1/searchFlights
- Parameters are query params, not body JSON
- Required params: departure_id, arrival_id, travel_class, adults, show_hidden, currency, language_code, country_code, search_type
- 14 total parameters available
