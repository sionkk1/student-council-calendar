// 오늘의 Enigma 코드 확인 스크립트
// 사용법: node get-today-code.js

const crypto = require('crypto');

// .env.local 파일에서 설정한 SECRET_KEY와 동일해야 함
const SECRET_KEY = process.env.ENIGMA_SECRET_KEY || 'change_this_to_random_32_chars_minimum';

function generateDailyCode(date = new Date()) {
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
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
console.log('💡 비상 키도 사용 가능: emergency_backup_code_2025');
