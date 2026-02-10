export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  // Acepta formatos: +1234567890, 1234567890, (123) 456-7890, etc.
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
}

export function validateAmount(amount: number): boolean {
  return !isNaN(amount) && amount > 0;
}

export function validateUsername(username: string): boolean {
  // Mínimo 3 caracteres, solo letras, números y guión bajo
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

export function validatePassword(password: string): boolean {
  // Mínimo 6 caracteres
  return password.length >= 6;
}

export function validateRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function validateDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
