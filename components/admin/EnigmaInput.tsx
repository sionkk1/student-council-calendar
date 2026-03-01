'use client';

import { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnigmaInputProps {
    onVerify: (code: string) => Promise<boolean>;
}

export default function EnigmaInput({ onVerify }: EnigmaInputProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [code, setCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    // Toggle visibility with a secret gesture or button
    // For now, we'll use a subtle button in the corner

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;

        setStatus('loading');
        try {
            const isValid = await onVerify(code);
            if (isValid) {
                setStatus('success');
                setTimeout(() => {
                    setIsVisible(false);
                    setCode('');
                    setStatus('idle');
                }, 1000);
            } else {
                setStatus('error');
                setTimeout(() => setStatus('idle'), 2000);
            }
        } catch {
            setStatus('error');
        }
    };

    return (
        <>
            {/* Secret Trigger - 우측 하단 잠금 아이콘 */}
            <button
                onClick={() => setIsVisible(!isVisible)}
                className="fixed bottom-6 right-6 p-3 bg-secondary text-secondary-foreground rounded-full shadow-lg hover:bg-secondary/80 transition-all z-40"
                aria-label="Admin Access"
            >
                <Lock size={20} />
            </button>

            {/* Enigma Input Modal */}
            {isVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-xs p-6">
                        <form onSubmit={handleSubmit} className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="비밀번호입력"
                                className={cn(
                                    "w-full bg-transparent border-b-2 text-center text-2xl font-mono tracking-[0.5em] py-2 pr-10 focus:outline-none transition-colors placeholder:text-white/20",
                                    status === 'error' ? "border-red-500 text-red-500" :
                                        status === 'success' ? "border-green-500 text-green-500" :
                                            "border-white/50 text-white focus:border-white"
                                )}
                                autoFocus
                                maxLength={8}
                            />
                            <div className="absolute top-1/2 -translate-y-1/2 right-0 flex items-center gap-1">
                                <button
                                    type="button"
                                    onMouseDown={() => setShowPassword(true)}
                                    onMouseUp={() => setShowPassword(false)}
                                    onMouseLeave={() => setShowPassword(false)}
                                    onTouchStart={(e) => { e.preventDefault(); setShowPassword(true); }}
                                    onTouchEnd={(e) => { e.preventDefault(); setShowPassword(false); }}
                                    onContextMenu={(e) => e.preventDefault()}
                                    className="text-white/40 hover:text-white/90 hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.5)] active:scale-125 transition-all duration-200 ease-out p-2 cursor-pointer select-none min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    style={{ touchAction: 'manipulation', WebkitTouchCallout: 'none' }}
                                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                                >
                                    {showPassword ? <EyeOff size={20} className="transition-transform duration-150" /> : <Eye size={20} className="transition-transform duration-150" />}
                                </button>
                                {status === 'loading' && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
                                {status === 'success' && <Unlock className="text-green-500" size={20} />}
                            </div>
                        </form>
                        <p className="text-center text-white/30 text-xs mt-4 font-mono">
                            {status === 'error' ? 'ACCESS DENIED' : 'ENTER DAILY CODE'}
                        </p>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-4 right-4 text-white/50 hover:text-white"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
