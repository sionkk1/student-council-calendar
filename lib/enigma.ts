import crypto from 'crypto';

const SECRET_KEY = process.env.ENIGMA_SECRET_KEY || 'default_secret_key_change_in_production';

/**
 * 오늘의 Enigma 코드 생성
 * SHA256(YYYYMMDD + SECRET_KEY) 의 앞 8자리
 */
export function generateDailyCode(date: Date = new Date()): string {
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  const hash = crypto
    .createHash('sha256')
    .update(dateStr + SECRET_KEY)
    .digest('hex');
  
  return hash.substring(0, 8).toUpperCase();
}

/**
 * 입력된 코드 검증
 */
export function verifyCode(inputCode: string): boolean {
  const todayCode = generateDailyCode();
  return inputCode.toUpperCase() === todayCode;
}

/**
 * 자정까지 남은 시간 계산 (쿠키 만료 시간용)
 */
export function getMidnightExpiry(): Date {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(23, 59, 59, 999);
  return midnight;
}

/**
 * 비상 키 검증 (선택적)
 */
export function verifyWithEmergency(inputCode: string): boolean {
  const emergencyKey = process.env.ENIGMA_EMERGENCY_KEY;
  if (emergencyKey && inputCode === emergencyKey) {
    return true;
  }
  return verifyCode(inputCode);
}
