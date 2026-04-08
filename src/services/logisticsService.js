import axios from 'axios';
import { validatePincodeFormat } from '../utils/validation.js';

/**
 * Logistics Service - Handles Pincode serviceability and external lookups.
 * Ready for future Shiprocket/Delhivery integration.
 */

export const checkPincodeServiceability = async (pincode) => {
  // Layer 1: Format Check
  if (!validatePincodeFormat(pincode)) {
    return { success: false, message: 'Invalid Pincode format.' };
  }

  // Layer 2: India Post External Validation (Verification of existence)
  try {
    const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = response.data?.[0];
    
    if (!data || data.Status !== 'Success') {
      return { success: false, message: 'Pincode not found in official registry.' };
    }
  } catch (error) {
    console.error('India Post API Error:', error.message);
    // If external API is down, maybe allow for now (optional fallback)
  }

  // Layer 3: Logistics Partner Serviceability (Future Integration)
  // Example: Shiprocket check_serviceability API here
  
  return { success: true };
};
