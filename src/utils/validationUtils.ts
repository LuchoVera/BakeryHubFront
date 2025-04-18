export const validateRequired = (value: string | undefined | null): string => {
    return !value || value.trim() === '' ? 'This field is required.' : '';
};

export const validateMinLength = (value: string, min: number): string => {
    return value.length < min ? `Must be at least ${min} characters long.` : '';
};

export const validateMaxLength = (value: string, max: number): string => {
    return value.length > max ? `Must be no more than ${max} characters long.` : '';
};

export const validateExactLength = (value: string, length: number): string => {
    return value.length !== length ? `Must be exactly ${length} characters long.` : '';
};

export const validateEmail = (value: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(value) ? 'Invalid email format.' : '';
};

export const validatePattern = (value: string, regex: RegExp, message: string): string => {
    return !regex.test(value) ? message : '';
};

export const validateComparison = (value1: string, value2: string, message: string): string => {
    return value1 !== value2 ? message : '';
};
