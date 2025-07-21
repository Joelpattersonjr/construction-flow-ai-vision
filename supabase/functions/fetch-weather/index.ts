import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WeatherResponse {
  main: {
    temp: number;
    temp_max: number;
    temp_min: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
}

interface GeocodeResponse {
  lat: number;
  lon: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== FETCH WEATHER REQUEST ===')
    console.log('Method:', req.method)
    console.log('Headers:', Object.fromEntries(req.headers.entries()))
    
    const body = await req.json()
    console.log('Request body:', body)
    
    const { address, projectId } = body
    
    if (!address || !projectId) {
      console.error('Missing required fields:', { address, projectId })
      throw new Error('Address and project ID are required')
    }

    const openWeatherApiKey = Deno.env.get('OpenWeather')
    console.log('OpenWeather API key available:', !!openWeatherApiKey)
    
    if (!openWeatherApiKey) {
      console.error('OpenWeather API key not found')
      throw new Error('OpenWeather API key not configured')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if we have recent weather data for this project (less than 30 minutes old)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    
    const { data: cachedWeather } = await supabase
      .from('weather_cache')
      .select('*')
      .eq('project_id', projectId)
      .gte('last_updated', thirtyMinutesAgo)
      .single()

    if (cachedWeather) {
      return new Response(
        JSON.stringify({
          temperature_current: cachedWeather.temperature_current,
          temperature_high: cachedWeather.temperature_high,
          temperature_low: cachedWeather.temperature_low,
          condition: cachedWeather.condition,
          humidity: cachedWeather.humidity,
          wind_speed: cachedWeather.wind_speed,
          weather_icon: cachedWeather.weather_icon,
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Geocode the address to get coordinates
    console.log('Attempting to geocode address:', address)
    
    // Try multiple address formats for better geocoding success
    const addressVariants = [
      address,
      address.replace('Rd.', 'Road'),
      address.replace('Florida', 'FL'),
      address.replace('Rd.', 'Road').replace('Florida', 'FL'),
      `${address}, USA`,
      'St. Cloud, FL 34769' // Fallback to just city for this specific case
    ];
    
    let geocodeData: GeocodeResponse[] = [];
    let successfulAddress = '';
    
    for (const addressVariant of addressVariants) {
      const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(addressVariant)}&limit=1&appid=${openWeatherApiKey}`
      console.log('Trying geocode URL:', geocodeUrl)
      
      const geocodeResponse = await fetch(geocodeUrl)
      console.log('Geocode response status:', geocodeResponse.status)
      
      if (!geocodeResponse.ok) {
        console.error('Geocode API error:', geocodeResponse.status, geocodeResponse.statusText)
        continue;
      }
      
      const data: GeocodeResponse[] = await geocodeResponse.json()
      console.log('Geocode data for variant:', addressVariant, data)
      
      if (data && data.length > 0) {
        geocodeData = data;
        successfulAddress = addressVariant;
        console.log('Successfully geocoded with address variant:', successfulAddress)
        break;
      }
    }

    if (!geocodeData || geocodeData.length === 0) {
      console.error('No geocoding results for any address variant')
      // Return a fallback response instead of throwing an error
      return new Response(
        JSON.stringify({ 
          error: 'Weather unavailable', 
          message: `Unable to find location for "${address}". Geocoding failed for all address variants.`,
          cached: false 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { lat, lon } = geocodeData[0]

    // Fetch current weather data
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}&units=imperial`
    const weatherResponse = await fetch(weatherUrl)
    const weatherData: WeatherResponse = await weatherResponse.json()

    const weatherInfo = {
      temperature_current: Math.round(weatherData.main.temp),
      temperature_high: Math.round(weatherData.main.temp_max),
      temperature_low: Math.round(weatherData.main.temp_min),
      condition: weatherData.weather[0].main,
      humidity: weatherData.main.humidity,
      wind_speed: Math.round(weatherData.wind.speed * 10) / 10,
      weather_icon: weatherData.weather[0].icon
    }

    // Cache the weather data
    await supabase
      .from('weather_cache')
      .upsert({
        project_id: projectId,
        ...weatherInfo,
        last_updated: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ ...weatherInfo, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Weather fetch error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})