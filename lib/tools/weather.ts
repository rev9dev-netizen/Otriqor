/* eslint-disable @typescript-eslint/no-explicit-any */
// Weather Tool using OpenMeteo (Free, No Key)

interface WeatherData {
    city: string;
    current: {
        temp: number;
        condition: string;
        humidity: number;
        windSpeed: number;
        isDay: boolean;
    };
    daily: Array<{
        date: string; // "Fri, Jan 4"
        dayName: string; // "Friday"
        high: number;
        low: number;
        condition: string;
    }>;
    hourly: Array<{
        time: string; // "10 AM"
        temp: number;
        condition: string;
    }>;
}

// Map WMO codes to conditions and icons
// https://open-meteo.com/en/docs
const weatherCodeMap: Record<number, string> = {
    0: "Clear",
    1: "Mostly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Fog",
    51: "Drizzle", 53: "Drizzle", 55: "Drizzle",
    61: "Rain", 63: "Rain", 65: "Heavy Rain",
    71: "Snow", 73: "Snow", 75: "Heavy Snow",
    77: "Snow Grains",
    80: "Rain Showers", 81: "Rain Showers", 82: "Violent Rain",
    95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm"
};

function getCondition(code: number): string {
    return weatherCodeMap[code] || "Unknown";
}

async function geocodeCity(city: string) {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`, { cache: 'no-store' });
    const data = await res.json();
    if (!data.results || data.results.length === 0) throw new Error("City not found");
    return data.results[0];
}

export async function getWeather(city: string): Promise<WeatherData> {
    try {
        // 1. Geocode
        const location = await geocodeCity(city);
        const { latitude, longitude, name, admin1, country } = location;

        // 2. Fetch Forecast
        const params = new URLSearchParams({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            current: "temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m",
            hourly: "temperature_2m,weather_code",
            daily: "weather_code,temperature_2m_max,temperature_2m_min",
            timezone: "auto",
            forecast_days: "7"
        });

        const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, { cache: 'no-store' });
        const data = await res.json();

        // 3. Transform Data
        const current = data.current;
        const result: WeatherData = {
            city: `${name}, ${country || admin1 || ''}`,
            current: {
                temp: Math.round(current.temperature_2m),
                condition: getCondition(current.weather_code),
                humidity: current.relative_humidity_2m,
                windSpeed: current.wind_speed_10m,
                isDay: current.is_day === 1
            },
            hourly: data.hourly.time.slice(0, 24).map((t: string, i: number) => {
                const date = new Date(t);
                // We pick every 3rd hour or so to keep it clean, or just first 12 hours
                return {
                    time: date.toLocaleTimeString("en-US", { hour: 'numeric', hour12: true }),
                    temp: Math.round(data.hourly.temperature_2m[i]),
                    condition: getCondition(data.hourly.weather_code[i])
                };
            }).filter((_: any, i: number) => i % 3 === 0), // Every 3h
            daily: data.daily.time.map((t: string, i: number) => {
                const date = new Date(t);
                return {
                    date: date.toLocaleDateString("en-US", { month: 'short', day: 'numeric' }),
                    dayName: date.toLocaleDateString("en-US", { weekday: 'long' }),
                    high: Math.round(data.daily.temperature_2m_max[i]),
                    low: Math.round(data.daily.temperature_2m_min[i]),
                    condition: getCondition(data.daily.weather_code[i])
                };
            })
        };

        return result;
    } catch (e) {
        console.error("Weather Tool Error", e);
        throw e;
    }
}
