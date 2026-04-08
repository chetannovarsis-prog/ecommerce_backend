/**
 * Address Normalization and Validation Utilities
 */

export const normalizeString = (str) => {
  if (!str) return '';
  return str.trim().toLowerCase();
};

export const validatePincodeFormat = (pincode) => {
  return /^[1-9][0-9]{5}$/.test(pincode);
};

export const validatePhoneFormat = (phone) => {
  return /^[6-9]\d{9}$/.test(phone);
};

export const validateEmailFormat = (email) => {
  return /^\S+@\S+\.\S+$/.test(email);
};
