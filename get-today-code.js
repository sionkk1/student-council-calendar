// Enigma daily code helper script
// Usage: node get-today-code.js

const crypto = require('crypto');

// Must match ENIGMA_SECRET_KEY in .env.local
const SECRET_KEY = process.env.ENIGMA_SECRET_KEY || 'change_this_to_random_32_chars_minimum';
const EMERGENCY_KEY = process.env.ENIGMA_EMERGENCY_KEY;

function generateDailyCode(date = new Date()) {
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const hash = crypto
    .createHash('sha256')
    .update(dateStr + SECRET_KEY)
    .digest('hex');

  return hash.substring(0, 8).toUpperCase();
}

const today = new Date();
const code = generateDailyCode(today);

console.log('=========================================');
console.log('📅 날짜:', today.toLocaleDateString('ko-KR'));
console.log('🔑 오늘의 Enigma 코드:', code);
console.log('=========================================');
console.log('');
if (EMERGENCY_KEY) {
  console.log('💡 비상 키도 사용 가능:', EMERGENCY_KEY);
} else {
  console.log('💡 비상 키가 설정되어 있지 않습니다.');
}
