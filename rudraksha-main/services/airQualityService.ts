
import { AQIData, WeatherData } from '../types';
import { StorageService } from './storageService';

// Robust Geolocation Helper
const getCoordinates = (): Promise<{lat: number, lon: number, error?: string}> => {
  return new Promise(async (resolve) => {
    // Check App Settings Permission First
    const settings = await StorageService.getSettings();
    if (!settings.permissions.location) {
        // Fallback to Kathmandu if privacy is on
        resolve({ lat: 27.7172, lon: 85.3240, error: "Location access disabled in settings." });
        return;
    }

    if (!navigator.geolocation) {
      resolve({ lat: 27.7172, lon: 85.3240, error: "Geolocation is not supported by this browser." });
      return;
    }

    const success = (position: GeolocationPosition) => {
      resolve({ 
        lat: position.coords.latitude, 
        lon: position.coords.longitude 
      });
    };

    const error = (err: GeolocationPositionError) => {
      let errorMsg = "An unknown error occurred.";
      switch(err.code) {
        case err.PERMISSION_DENIED:
          errorMsg = "User denied the request for Geolocation.";
          break;
        case err.POSITION_UNAVAILABLE:
          errorMsg = "Location information is unavailable.";
          break;
        case err.TIMEOUT:
          errorMsg = "The request to get user location timed out.";
          break;
        default:
          errorMsg = "An unknown error occurred.";
          break;
      }
      console.warn("Geolocation Error:", errorMsg);
      // Fallback to Kathmandu
      resolve({ lat: 27.7172, lon: 85.3240, error: errorMsg });
    };

    navigator.geolocation.getCurrentPosition(success, error, {
      enableHighAccuracy: settings.gpsAccuracy === 'high',
      timeout: 10000,
      maximumAge: 0
    });
  });
};

const getReverseGeocoding = async (lat: number, lon: number): Promise<string> => {
  try {
    // Using OpenStreetMap Nominatim for reverse geocoding (free, requires attribution)
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=12&addressdetails=1`, {
        headers: {
            'User-Agent': 'RudrakshaApp/1.0'
        }
    });
    
    if (response.ok) {
        const data = await response.json();
        const addr = data.address;
        // Prioritize meaningful location names
        return addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.county || "Unknown Location";
    }
  } catch (e) {
    console.warn("Reverse geocoding failed", e);
  }
  return `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`;
};

const mapWmoCodeToCondition = (code: number): WeatherData['condition'] => {
  // WMO Weather interpretation codes (WW)
  if (code === 0 || code === 1) return 'Sunny';
  if (code === 2 || code === 3) return 'Cloudy';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 67) return 'Rainy';
  if (code >= 80 && code <= 82) return 'Rainy';
  if (code >= 71 && code <= 77) return 'Rainy'; // Snow/Sleet mapped to Rainy for simplicity
  if (code >= 95) return 'Stormy';
  
  return 'Cloudy'; // Default
};

export const AirQualityService = {
  getAQI: async (): Promise<AQIData> => {
    try {
      const { lat, lon } = await getCoordinates();
      
      // Open-Meteo Air Quality API
      const response = await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone&timezone=auto`
      );
      
      if (!response.ok) throw new Error('AQI API failed');
      
      const data = await response.json();
      const current = data.current;
      
      // Use US AQI standard which is widely recognized
      const aqiValue = current.us_aqi || 0;
      
      // Determine dominant pollutant (simple logic)
      let pollutant = 'PM2.5';
      if (current.pm10 > current.pm2_5 && current.pm10 > current.nitrogen_dioxide) pollutant = 'PM10';
      if (current.nitrogen_dioxide > current.pm10) pollutant = 'NO2';
      if (current.ozone > current.us_aqi) pollutant = 'O3';

      const locationName = await getReverseGeocoding(lat, lon);

      return getNepalAQIStatus(aqiValue, locationName, pollutant);

    } catch (error) {
      console.warn("Using mock AQI data due to API error", error);
      // Fallback
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(generateMockAQI("Kathmandu (Simulated)"));
        }, 800);
      });
    }
  },

  getWeather: async (): Promise<WeatherData> => {
    try {
      const { lat, lon } = await getCoordinates();
      const locationName = await getReverseGeocoding(lat, lon);
      
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=uv_index_max&timezone=auto`
      );
      
      if (!response.ok) throw new Error('Weather API failed');
      
      const data = await response.json();
      const current = data.current;
      const daily = data.daily;
      
      return {
        temp: Math.round(current.temperature_2m),
        condition: mapWmoCodeToCondition(current.weather_code),
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        uvIndex: daily.uv_index_max && daily.uv_index_max.length > 0 ? daily.uv_index_max[0] : 0,
        feelsLike: Math.round(current.apparent_temperature),
        location: locationName
      };

    } catch (error) {
      console.warn("Using mock weather data due to API error", error);
      // Fallback to mock data if API fails
      return new Promise((resolve) => {
        setTimeout(() => {
          const conditions: WeatherData['condition'][] = ['Sunny', 'Cloudy', 'Rainy', 'Foggy'];
          const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
          const temp = Math.floor(Math.random() * (30 - 15 + 1)) + 15;
          
          resolve({
            temp: temp,
            condition: randomCondition,
            humidity: Math.floor(Math.random() * (90 - 40 + 1)) + 40,
            windSpeed: Math.floor(Math.random() * 15) + 2,
            uvIndex: randomCondition === 'Sunny' ? Math.floor(Math.random() * 5) + 3 : 1,
            feelsLike: temp + 2,
            location: "Kathmandu (Simulated)"
          });
        }, 800);
      });
    }
  }
};

const generateMockAQI = (locationName: string): AQIData => {
  // Simulate AQI typical for Nepal context (often Moderate to Poor)
  const aqi = Math.floor(Math.random() * (180 - 45 + 1)) + 45; 
  return getNepalAQIStatus(aqi, locationName, 'PM2.5');
};

const getNepalAQIStatus = (aqi: number, location: string, pollutant: string = 'PM2.5'): AQIData => {
  let status = '';
  let color = '';
  let advice = '';
  let maskAdvice = '';
  let activityAdvice = '';

  // Nepal Government (Department of Environment) Scale / US AQI Scale interpretation
  if (aqi <= 50) {
    status = 'Good';
    color = '#00B050'; // Green
    advice = 'Air quality is satisfactory, and air pollution poses little or no risk.';
    maskAdvice = 'No mask needed.';
    activityAdvice = 'Perfect for outdoor activities and ventilation.';
  } else if (aqi <= 100) {
    status = 'Satisfactory';
    color = '#A8D08D'; // Yellow-Green
    advice = 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.';
    maskAdvice = 'Mask recommended for highly sensitive individuals.';
    activityAdvice = 'Good for outdoor activities.';
  } else if (aqi <= 150) {
    status = 'Moderately Polluted';
    color = '#F4B083'; // Orange
    advice = 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.';
    maskAdvice = 'Mask recommended for seniors, children, and those with respiratory issues.';
    activityAdvice = 'Reduce prolonged or heavy exertion outdoors.';
  } else if (aqi <= 200) {
    status = 'Poor';
    color = '#FFC000'; // Amber/Yellow
    advice = 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.';
    maskAdvice = 'Standard mask recommended for everyone outdoors.';
    activityAdvice = 'Avoid prolonged outdoor exertion.';
  } else if (aqi <= 300) {
    status = 'Very Poor';
    color = '#FF0000'; // Red
    advice = 'Health alert: everyone may experience more serious health effects.';
    maskAdvice = 'N95/KN95 Mask Mandatory outdoors.';
    activityAdvice = 'Avoid all outdoor activities. Keep windows closed.';
  } else {
    status = 'Severe';
    color = '#C00000'; // Dark Red
    advice = 'Health warnings of emergency conditions. The entire population is more likely to be affected.';
    maskAdvice = 'P100 or N95 Mask Mandatory. Do not go outside without protection.';
    activityAdvice = 'Stay indoors. Use air purifiers if available.';
  }

  return {
    aqi,
    status,
    color,
    advice,
    pollutant,
    location,
    maskAdvice,
    activityAdvice
  };
};
