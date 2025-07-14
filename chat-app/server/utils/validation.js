const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateRoomName = (name) => {
  return name && name.trim().length > 0 && name.trim().length <= 50;
};

const validateMessageContent = (content) => {
  return content && content.trim().length > 0 && content.trim().length <= 1000;
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

module.exports = {
  validateEmail,
  validateUsername,
  validatePassword,
  validateRoomName,
  validateMessageContent,
  sanitizeInput
};