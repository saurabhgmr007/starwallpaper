import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const dynamic = 'force-dynamic';

function getWeatherInfo(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: 'Clear', icon: 'clear' };
  if (code <= 3) return { condition: 'Cloudy', icon: 'cloudy' };
  if (code <= 48) return { condition: 'Foggy', icon: 'fog' };
  if (code <= 57) return { condition: 'Drizzle', icon: 'drizzle' };
  if (code <= 67) return { condition: 'Rain', icon: 'rain' };
  if (code <= 77) return { condition: 'Snow', icon: 'snow' };
  if (code <= 82) return { condition: 'Showers', icon: 'rain' };
  if (code <= 86) return { condition: 'Snow Showers', icon: 'snow' };
  if (code <= 99) return { condition: 'Thunderstorm', icon: 'thunder' };
  return { condition: 'Unknown', icon: 'clear' };
}

export async function GET() {
  try {
    const lat = (await redis.get('weatherLat')) || '28.6139';
    const lon = (await redis.get('weatherLon')) || '77.2090';
    const cityName = (await redis.get('weatherCity')) || 'New Delhi';

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Weather API error' }, { status: 502 });
    }

    const data = await res.json();
    const current = data.current;
    const daily = data.daily;
    const weatherInfo = getWeatherInfo(current.weather_code);

    return NextResponse.json({
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      condition: weatherInfo.condition,
      icon: weatherInfo.icon,
      isDay: current.is_day === 1,
      high: Math.round(daily.temperature_2m_max[0]),
      low: Math.round(daily.temperature_2m_min[0]),
      city: cityName,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { city, passcode } = await req.json();
    const PASSCODE = process.env.NOTES_PASSCODE;
    if (!PASSCODE || passcode !== PASSCODE) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`
    );
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    const result = geoData.results[0];
    await redis.set('weatherLat', String(result.latitude));
    await redis.set('weatherLon', String(result.longitude));
    await redis.set('weatherCity', result.name);

    return NextResponse.json({ city: result.name, lat: result.latitude, lon: result.longitude });
  } catch {
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}
