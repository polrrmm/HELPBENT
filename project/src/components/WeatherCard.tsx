import { useEffect, useState } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, AlertCircle } from 'lucide-react';

interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  location: string;
}

export default function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          fetchWeather(37.7749, -122.4194);
        }
      );
    } else {
      fetchWeather(37.7749, -122.4194);
    }
  };

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph`
      );

      if (!response.ok) throw new Error('Weather fetch failed');

      const data = await response.json();

      const weatherCode = data.current.weather_code;
      const description = getWeatherDescription(weatherCode);

      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        description,
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        location: 'Your Location',
      });

      setError(false);
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherDescription = (code: number): string => {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 67) return 'Rainy';
    if (code <= 77) return 'Snowy';
    if (code <= 82) return 'Showers';
    return 'Stormy';
  };

  const getWeatherIcon = (description: string) => {
    if (description.includes('Clear')) return <Sun className="w-12 h-12 text-yellow-500" />;
    if (description.includes('Rain') || description.includes('Showers')) return <CloudRain className="w-12 h-12 text-blue-500" />;
    return <Cloud className="w-12 h-12 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-500">Loading weather...</div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Unable to load weather</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg overflow-hidden text-white">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold opacity-90">Weather</h3>
            <p className="text-sm opacity-75">{weather.location}</p>
          </div>
          {getWeatherIcon(weather.description)}
        </div>

        <div className="mb-6">
          <div className="text-5xl font-bold mb-2">{weather.temperature}°F</div>
          <p className="text-lg opacity-90">{weather.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 opacity-75" />
            <div>
              <p className="text-xs opacity-75">Humidity</p>
              <p className="font-semibold">{weather.humidity}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 opacity-75" />
            <div>
              <p className="text-xs opacity-75">Wind</p>
              <p className="font-semibold">{weather.windSpeed} mph</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
