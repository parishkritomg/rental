// Phone number detection utility
// Detects various phone number patterns to prevent users from entering them in wrong fields

/**
 * Detects if a text contains phone number patterns
 * @param {string} text - The text to check for phone numbers
 * @returns {boolean} - True if phone number pattern is detected
 */
export const containsPhoneNumber = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  // Common phone number patterns
  const phonePatterns = [
    // US formats: (123) 456-7890, 123-456-7890, 123.456.7890, 123 456 7890
    /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/,
    // International formats: +1 123 456 7890, +44 20 1234 5678
    /\+\d{1,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/,
    // Simple number sequences that look like phones (10+ digits)
    /\b\d{10,}\b/,
    // Numbers with common separators
    /\d{3,4}[\s.-]\d{3,4}[\s.-]\d{3,4}/,
    // Phone with extensions
    /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}[\s]*(?:ext|extension|x)[\s]*\d+/i
  ];
  
  return phonePatterns.some(pattern => pattern.test(text));
};

/**
 * Extracts potential phone numbers from text
 * @param {string} text - The text to extract phone numbers from
 * @returns {string[]} - Array of potential phone numbers found
 */
export const extractPhoneNumbers = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const phonePattern = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|\+\d{1,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}|\b\d{10,}\b/g;
  return text.match(phonePattern) || [];
};

/**
 * Validates if a field should not contain phone numbers
 * @param {string} fieldName - Name of the form field
 * @param {string} value - Value to validate
 * @returns {object} - Validation result with isValid and message
 */
export const validateFieldForPhoneNumbers = (fieldName, value) => {
  // Fields that should not contain phone numbers
  const restrictedFields = ['title', 'description', 'name', 'firstName', 'lastName', 'address', 'location'];
  
  if (!restrictedFields.includes(fieldName)) {
    return { isValid: true, message: '' };
  }
  
  if (containsPhoneNumber(value)) {
    const phoneNumbers = extractPhoneNumbers(value);
    return {
      isValid: false,
      message: `Phone numbers are not allowed in the ${fieldName} field. Please add your phone number in the designated phone number section only. Detected: ${phoneNumbers.join(', ')}`
    };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Creates a notification message for phone number validation
 * @param {string} fieldName - Name of the field where phone was detected
 * @returns {string} - User-friendly notification message
 */
export const getPhoneValidationMessage = (fieldName) => {
  return `Please add your phone number in the phone number section only, not in the ${fieldName} field.`;
};