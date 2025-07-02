
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced region mapping for comprehensive coverage
const REGION_MAPPING: Record<string, string> = {
  // Nigeria and Africa
  'NG': 'NG', 'ZA': 'ZA', 'EG': 'EG', 'KE': 'KE', 'GH': 'GH', 'MA': 'MA', 'ET': 'ET', 'UG': 'UG',
  'TN': 'TN', 'DZ': 'DZ', 'MZ': 'MZ', 'AO': 'AO', 'CI': 'CI', 'SN': 'SN', 'RW': 'RW', 'BW': 'BW',
  'ZM': 'ZM', 'ZW': 'ZW', 'TZ': 'TZ', 'CM': 'CM', 'BF': 'BF', 'ML': 'ML', 'MW': 'MW', 'NE': 'NE',
  'TD': 'TD', 'SO': 'SO', 'LR': 'LR', 'SL': 'SL', 'GM': 'GM', 'GW': 'GW', 'GQ': 'GQ', 'GA': 'GA',
  'CG': 'CG', 'CD': 'CD', 'CF': 'CF', 'BI': 'BI', 'DJ': 'DJ', 'ER': 'ER', 'LY': 'LY', 'SD': 'SD',
  'SS': 'SS', 'LS': 'LS', 'SZ': 'SZ', 'KM': 'KM', 'MU': 'MU', 'SC': 'SC', 'MG': 'MG', 'CV': 'CV',
  'ST': 'ST', 'RE': 'RE', 'YT': 'YT',
  
  // North America
  'US': 'US', 'CA': 'CA', 'MX': 'MX', 'GT': 'GT', 'BZ': 'BZ', 'SV': 'SV', 'HN': 'HN', 'NI': 'NI',
  'CR': 'CR', 'PA': 'PA', 'CU': 'CU', 'JM': 'JM', 'HT': 'HT', 'DO': 'DO', 'PR': 'PR', 'TT': 'TT',
  'BB': 'BB', 'GD': 'GD', 'LC': 'LC', 'VC': 'VC', 'DM': 'DM', 'AG': 'AG', 'KN': 'KN', 'BS': 'BS',
  'VG': 'VG', 'VI': 'VI', 'AI': 'AI', 'MS': 'MS', 'KY': 'KY', 'TC': 'TC', 'BM': 'BM', 'GL': 'GL',
  
  // South America
  'BR': 'BR', 'AR': 'AR', 'CO': 'CO', 'PE': 'PE', 'VE': 'VE', 'CL': 'CL', 'EC': 'EC', 'BO': 'BO',
  'PY': 'PY', 'UY': 'UY', 'GY': 'GY', 'SR': 'SR', 'GF': 'GF', 'FK': 'FK',
  
  // Europe  
  'GB': 'GB', 'DE': 'DE', 'FR': 'FR', 'IT': 'IT', 'ES': 'ES', 'PL': 'PL', 'RO': 'RO', 'NL': 'NL',
  'BE': 'BE', 'GR': 'GR', 'PT': 'PT', 'CZ': 'CZ', 'HU': 'HU', 'SE': 'SE', 'AT': 'AT', 'BY': 'BY',
  'CH': 'CH', 'BG': 'BG', 'RS': 'RS', 'SK': 'SK', 'DK': 'DK', 'FI': 'FI', 'NO': 'NO', 'IE': 'IE',
  'HR': 'HR', 'BA': 'BA', 'AL': 'AL', 'LT': 'LT', 'SI': 'SI', 'LV': 'LV', 'EE': 'EE', 'MK': 'MK',
  'MD': 'MD', 'MT': 'MT', 'LU': 'LU', 'CY': 'CY', 'IS': 'IS', 'AD': 'AD', 'MC': 'MC', 'SM': 'SM',
  'VA': 'VA', 'LI': 'LI', 'ME': 'ME', 'XK': 'XK', 'UA': 'UA',
  
  // Asia
  'CN': 'CN', 'IN': 'IN', 'ID': 'ID', 'PK': 'PK', 'BD': 'BD', 'JP': 'JP', 'PH': 'PH', 'VN': 'VN',
  'TR': 'TR', 'IR': 'IR', 'TH': 'TH', 'MM': 'MM', 'KR': 'KR', 'IQ': 'IQ', 'AF': 'AF', 'MY': 'MY',
  'SA': 'SA', 'UZ': 'UZ', 'NP': 'NP', 'YE': 'YE', 'LK': 'LK', 'KZ': 'KZ', 'SY': 'SY', 'KH': 'KH',
  'JO': 'JO', 'AZ': 'AZ', 'AE': 'AE', 'TJ': 'TJ', 'IL': 'IL', 'LA': 'LA', 'SG': 'SG', 'OM': 'OM',
  'KW': 'KW', 'GE': 'GE', 'MN': 'MN', 'AM': 'AM', 'QA': 'QA', 'BH': 'BH', 'BT': 'BT', 'BN': 'BN',
  'MV': 'MV', 'TM': 'TM', 'KG': 'KG', 'TW': 'TW', 'HK': 'HK', 'MO': 'MO', 'TL': 'TL', 'LB': 'LB',
  'PS': 'PS',
  
  // Russia and surrounding
  'RU': 'RU',
  
  // Oceania/Australia
  'AU': 'AU', 'NZ': 'NZ', 'PG': 'PG', 'FJ': 'FJ', 'NC': 'NC', 'SB': 'SB', 'VU': 'VU', 'PF': 'PF',
  'WS': 'WS', 'GU': 'GU', 'TO': 'TO', 'KI': 'KI', 'PW': 'PW', 'MH': 'MH', 'FM': 'FM', 'NR': 'NR',
  'TV': 'TV', 'CK': 'CK', 'NU': 'NU', 'TK': 'TK', 'AS': 'AS', 'MP': 'MP'
};

// Create a Supabase client
const supabaseUrl = 'https://qkpjlfcpncvvjyzfolag.supabase.co'
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function getLocationFromIP(ip: string): Promise<any> {
  try {
    console.log('Looking up IP:', ip);
    
    // Use multiple IP geolocation services for better coverage
    const services = [
      `https://ipinfo.io/${ip}/json`,
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city,continent`,
      `https://ipapi.co/${ip}/json/`,
    ];
    
    for (const serviceUrl of services) {
      try {
        const response = await fetch(serviceUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'MAUDIO-GeoLocation/1.0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Geo API response from', serviceUrl, ':', data);
          
          // Parse different API response formats
          let country, city, region;
          
          if (serviceUrl.includes('ipinfo.io')) {
            // ipinfo.io format
            country = data.country;
            city = data.city;
            region = data.region;
          } else if (serviceUrl.includes('ip-api.com')) {
            // ip-api.com format  
            if (data.status === 'success') {
              country = data.countryCode;
              city = data.city;
              region = data.region;
            }
          } else if (serviceUrl.includes('ipapi.co')) {
            // ipapi.co format
            country = data.country_code;
            city = data.city;
            region = data.region;
          }
          
          // Ensure we have a valid country code and it's in our mapping
          if (country && REGION_MAPPING[country]) {
            return {
              ip,
              country: REGION_MAPPING[country],
              city: city || 'Unknown',
              region: region || 'Unknown',
              loc: data.loc || '',
              timezone: data.timezone || ''
            };
          }
        }
      } catch (error) {
        console.error(`Error with service ${serviceUrl}:`, error);
        continue; // Try next service
      }
    }
    
    // Fallback: default to Nigeria for unsupported IPs
    return {
      ip,
      country: 'NG',
      city: 'Lagos',
      region: 'Lagos',
      loc: '6.5244,3.3792',
      timezone: 'Africa/Lagos'
    };
    
  } catch (error) {
    console.error('Error in getLocationFromIP:', error);
    return {
      ip,
      country: 'NG',
      city: 'Lagos', 
      region: 'Lagos',
      loc: '6.5244,3.3792',
      timezone: 'Africa/Lagos'
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
  }

  try {
    const { ip } = await req.json()
    
    if (!ip) {
      return new Response(
        JSON.stringify({ error: 'IP address is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('Processing IP:', ip);
    
    // Handle localhost and private IPs - default to Nigeria
    if (ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return new Response(
        JSON.stringify({ 
          ip,
          country: 'NG',
          city: 'Lagos',
          region: 'Lagos',
          loc: '6.5244,3.3792',
          timezone: 'Africa/Lagos'
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    const locationData = await getLocationFromIP(ip);
    
    console.log('Final location data:', locationData);

    // Log the successful request
    console.log(`Successfully retrieved location data for IP: ${ip}. Country: ${locationData.country}`)

    // Return the geolocation data
    return new Response(
      JSON.stringify(locationData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get location data',
        ip: 'unknown',
        country: 'NG',
        city: 'Lagos',
        region: 'Lagos',
        loc: '6.5244,3.3792',
        timezone: 'Africa/Lagos'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
