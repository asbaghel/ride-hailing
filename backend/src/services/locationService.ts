import axios, { AxiosError } from 'axios';

interface LocationResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export class LocationService {
  private nominatimBaseUrl = 'https://nominatim.openstreetmap.org';
  private axiosInstance = axios.create({
    timeout: 10000,
    headers: {
      'User-Agent': 'RideHailing/1.0 (India Ride-Hailing App)',
    },
  });

  /**
   * Search for locations using Nominatim
   * Filters results for India region
   */
  async searchLocations(query: string, limit: number = 3): Promise<LocationResult[]> {
    try {
      console.log(`Searching locations for: ${query}`);
      
      const response = await this.axiosInstance.get(`${this.nominatimBaseUrl}/search`, {
        params: {
          q: query,
          format: 'json',
          addressdetails: 1,
          limit: Math.min(limit, 10),
          countrycodes: 'in', // Restrict to India
          accept_language: 'en',
        },
      });

      console.log(`Found ${response.data?.length || 0} locations`);
      return response.data || [];
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error searching locations:', {
        message: axiosError.message,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
      });
      throw new Error(`Failed to search locations: ${axiosError.message}`);
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      console.log(`Reverse geocoding: ${latitude}, ${longitude}`);
      
      const response = await this.axiosInstance.get(`${this.nominatimBaseUrl}/reverse`, {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          zoom: 18,
          addressdetails: 1,
        },
      });

      const address = response.data?.address?.road || 
                      response.data?.address?.suburb ||
                      response.data?.display_name || 
                      '';
      
      console.log(`Reverse geocoded to: ${address}`);
      return address;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error reverse geocoding:', {
        message: axiosError.message,
        status: axiosError.response?.status,
      });
      return '';
    }
  }
}

export default new LocationService();
