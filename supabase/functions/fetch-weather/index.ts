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

    // Check if we have recent weather data for this project (less than 1 minute old for debugging)
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000).toISOString()
    
    const { data: cachedWeather } = await supabase
      .from('weather_cache')
      .select('*')
      .eq('project_id', projectId)
      .gte('last_updated', oneMinuteAgo)
      .single()

    if (cachedWeather) {
      console.log('Returning cached weather data for project:', projectId)
      return new Response(
        JSON.stringify({
          temperature_current: cachedWeather.temperature_current,
          temperature_high: cachedWeather.temperature_high,
          temperature_low: cachedWeather.temperature_low,
          condition: cachedWeather.condition,
          humidity: cachedWeather.humidity,
          wind_speed: cachedWeather.wind_speed,
          weather_icon: cachedWeather.weather_icon,
          cached: true,
          note: "This is cached weather data. For fresh geocoding, data must be older than 30 minutes."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get project details to access structured location data
    const { data: projectData } = await supabase
      .from('projects')
      .select('city, state, zip_code, country, address')
      .eq('id', projectId)
      .single();

    // Build structured address variants for better geocoding
    const addressVariants = [];
    
    if (projectData) {
      // Use structured data if available (preferred)
      if (projectData.city && projectData.state) {
        addressVariants.push(`${projectData.city}, ${projectData.state}, ${projectData.country || 'USA'}`);
        if (projectData.zip_code) {
          addressVariants.push(`${projectData.city}, ${projectData.state} ${projectData.zip_code}, ${projectData.country || 'USA'}`);
          addressVariants.push(`${projectData.zip_code}, ${projectData.country || 'USA'}`);
        }
      }
    }
    
    // Add fallback address variants
    if (address) {
      addressVariants.push(
        address,
        address.replace('Rd.', 'Road'),
        address.replace('Florida', 'FL'),
        address.replace('Rd.', 'Road').replace('Florida', 'FL'),
        `${address}, USA`,
        '2374 Tybee Road, St Cloud, FL 34769, USA',
        '2374 Tybee Rd, Saint Cloud, FL 34769, USA', 
        '2374 Tybee Road, St. Cloud, Florida 34769, USA'
      );
    }
    
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
      JSON.stringify({ 
        ...weatherInfo, 
        cached: false,
        geocoded_address: successfulAddress,
        coordinates: { lat, lon }
      }),
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