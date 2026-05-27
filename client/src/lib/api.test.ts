import { afterEach, describe, expect, it, vi } from "vitest";
import type { SearchFormState } from "@/types/flight";
import { fetchRapidApi, parseFlightPrice } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseFlightPrice", () => {
  it("parses Google Flights price strings", () => {
    expect(parseFlightPrice({ price: "HK$4,556 round trip" })).toBe(4556);
    expect(parseFlightPrice({ price: "from HKD 4,441" })).toBe(4441);
  });

  it("parses nested price objects", () => {
    expect(
      parseFlightPrice({
        price: {
          raw: 4556,
          formatted: "HK$4,556",
        },
      }),
    ).toBe(4556);
    expect(
      parseFlightPrice({
        totalPrice: {
          amount: "4,441",
          currency: "HKD",
        },
      }),
    ).toBe(4441);
  });

  it("parses prices inside booking options", () => {
    expect(
      parseFlightPrice({
        booking_options: [
          { price: "HK$4,800" },
          { price: "HK$4,441" },
        ],
      }),
    ).toBe(4441);
  });

  it("ignores unrelated numeric flight fields", () => {
    expect(
      parseFlightPrice({
        duration: { raw: 170, text: "2 hr 50 min" },
        carbon_emissions: "142 kg CO2e",
      }),
    ).toBeNaN();
  });
});

describe("fetchRapidApi", () => {
  const form: SearchFormState = {
    origin: "HKG",
    destination: "OKA",
    outboundDate: "2026-06-19",
    returnDate: "2026-06-22",
    passengers: 1,
    cabin: "economy",
    baggage: "20",
    maxStops: "0",
    outboundWindow: "morning",
    returnWindow: "afternoon",
    airlines: [],
    sortBy: "price_asc",
  };

  it("hydrates unavailable RapidAPI fares with the next-flight token", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/getNextFlights")) {
        return {
          ok: true,
          json: async () => ({
            status: true,
            data: {
              itineraries: {
                topFlights: [{ price: 4556 }],
              },
            },
          }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({
          status: true,
          data: {
            itineraries: {
              topFlights: [
                {
                  departure_time: "19-06-2026 11:20 AM",
                  arrival_time: "19-06-2026 03:10 PM",
                  duration: { raw: 170, text: "2 hr 50 min" },
                  flights: [
                    {
                      departure_airport: {
                        airport_code: "HKG",
                        time: "2026-6-19 11:20",
                      },
                      arrival_airport: {
                        airport_code: "OKA",
                        time: "2026-6-19 15:10",
                      },
                      duration: { raw: 170, text: "2 hr 50 min" },
                      airline: "Hong Kong Airlines",
                      flight_number: "HX 658",
                    },
                  ],
                  price: "unavailable",
                  next_token: "selected-outbound-token",
                },
              ],
            },
          },
        }),
      } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchRapidApi(form, "test-key");

    expect(result.outbound[0].price).toBe(4556);
    expect(result.requestCount).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
