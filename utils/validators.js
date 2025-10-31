export const allowOnlyLetters = (text) => {
    return text.replace(/[^a-zA-Z\s]/g, '');
};

export const allowOnlyNumbers = (text) => text.replace(/[^0-9]/g, '');
export const removeSpaces =  (text) => text.replace(/\s/g, '');
export const isValidPhoneNumber = (phone) => {
    // Step 1: Basic check for 10 digits
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) return false;

    // Step 2: Reject if all digits are the same
    const allSameDigits = /^(\d)\1{9}$/;
    if (allSameDigits.test(phone)) return false;

    // Step 3: Reject known fake/test numbers
    const fakePatterns = [
        '1234567890',
        '0123456789',
        '9876543210',
        '0000000000',
        '1111111111',
        '2222222222',
        '3333333333',
        '4444444444',
        '5555555555',
        '6666666666',
        '7777777777',
        '8888888888',
        '9999999999'
    ];
    if (fakePatterns.includes(phone)) return false;

    return true;
};

// Validate email
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const allowValidEmail = (text) => {
    // Allow only letters, numbers, @, ., _, and -
    return text.replace(/[^a-zA-Z0-9@._-]/g, "");
};

export const isValidPassword = (password) => /^[A-Za-z0-9]{6,}$/.test(password);