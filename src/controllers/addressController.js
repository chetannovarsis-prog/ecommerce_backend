import prisma from '../utils/prisma.js';
import { normalizeString, validateEmailFormat, validatePhoneFormat, validatePincodeFormat } from '../utils/validation.js';
import { checkPincodeServiceability } from '../services/logisticsService.js';

/**
 * Address Controller - Handles server-side validation and storage.
 */

export const validateAddress = async (req, res) => {
  try {
    const { 
      email, 
      name, 
      phone, 
      addressLine1, 
      addressLine2, 
      city, 
      state, 
      pincode 
    } = req.body;

    const errors = {};

    // 1. Basic Format Validation
    if (!validateEmailFormat(email)) errors.email = 'Invalid email address.';
    if (!name || name.trim().length < 3) errors.name = 'Name must be at least 3 characters.';
    if (!validatePhoneFormat(phone)) errors.phone = 'Invalid phone number (6-9 followed by 9 digits).';
    if (!addressLine1 || addressLine1.trim().length < 10) errors.addressLine1 = 'Address must be at least 10 characters.';
    if (!city) errors.city = 'City is required.';
    if (!state) errors.state = 'State is required.';
    if (!validatePincodeFormat(pincode)) errors.pincode = 'Invalid pincode format.';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // 2. Logistics Serviceability Check
    const serviceability = await checkPincodeServiceability(pincode);
    if (!serviceability.success) {
      return res.status(400).json({ 
        success: false, 
        errors: { pincode: serviceability.message || 'Pincode not serviceable.' } 
      });
    }

    // 3. Normalization (Internal use)
    const normalizedCity = normalizeString(city);
    const normalizedState = normalizeString(state);

    res.json({ 
      success: true, 
      message: 'Address validated successfully.',
      normalized: { city: normalizedCity, state: normalizedState }
    });

  } catch (error) {
    console.error('Validate Address Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during validation.' });
  }
};

export const saveAddress = async (req, res) => {
    // This can be used for persistent storage after checkout completes 
    // or when a user saves to profile
    try {
        const { id: customerId } = req.user; // Assuming auth middleware
        const addressData = req.body;

        const address = await prisma.address.create({
            data: {
                ...addressData,
                customerId,
                city: normalizeString(addressData.city),
                state: normalizeString(addressData.state),
            }
        });

        res.status(201).json({ success: true, address });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
