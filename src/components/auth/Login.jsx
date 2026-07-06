import { useState } from 'react';
import { supabase } from '../../services/SupabaseService';
import { Lock, Mail, Activity, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function Login({ onLoginSuccess }) {
    const { showToast } = useToast();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            setErrorMsg('Please fill in all fields.');
            return;
        }
        setErrorMsg('');
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email: email.trim(),
                    password: password.trim()
                });
                if (error) throw error;
                showToast('🎉 Sign up successful! Please check your email for confirmation.');
                setIsSignUp(false);
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password: password.trim()
                });
                if (error) throw error;
                showToast('Welcome back to Aggarwal Industries IMRS!');
                if (onLoginSuccess) onLoginSuccess(data.session);
            }
        } catch (err) {
            setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
            showToast('Authentication Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            width: '100vw',
            background: 'radial-gradient(circle at top right, #111827, #0a0e1a)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div className="card-glass animate-in" style={{
                width: '100%',
                maxWidth: '420px',
                padding: '40px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                borderRadius: '16px',
                background: 'rgba(26, 31, 53, 0.65)',
                backdropFilter: 'blur(24px)'
            }}>
                {/* Header Logo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        background: 'var(--gradient-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        fontWeight: '800',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
                    }}>
                        AI
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '8px 0 2px' }}>
                        Aggarwal Industries
                    </h2>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>
                        IMRS Portal
                    </span>
                </div>

                {errorMsg && (
                    <div style={{
                        padding: '12px 16px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '8px',
                        color: '#fca5a5',
                        fontSize: '13px',
                        marginBottom: '20px',
                        lineHeight: '1.5'
                    }}>
                        ⚠️ {errorMsg}
                    </div>
                )}

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                        <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="email"
                                className="form-input"
                                style={{ paddingLeft: '40px' }}
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type={showPassword ? "text" : "password"}
                                className="form-input"
                                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer'
                                }}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{
                            padding: '12px',
                            justifyContent: 'center',
                            fontSize: '14px',
                            marginTop: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Activity className="spin" size={16} />
                                {isSignUp ? 'Creating Account...' : 'Signing In...'}
                            </>
                        ) : (
                            isSignUp ? 'Create Admin Account' : 'Sign In to Dashboard'
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {isSignUp ? (
                        <>
                            Already have an account?{' '}
                            <button
                                style={{ background: 'none', border: 'none', color: 'var(--accent-blue-light)', fontWeight: '600', cursor: 'pointer', outline: 'none' }}
                                onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
                                disabled={loading}
                            >
                                Sign In
                            </button>
                        </>
                    ) : (
                        <>
                            New user?{' '}
                            <button
                                style={{ background: 'none', border: 'none', color: 'var(--accent-blue-light)', fontWeight: '600', cursor: 'pointer', outline: 'none' }}
                                onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
                                disabled={loading}
                            >
                                Create Admin Account
                            </button>
                        </>
                    )}
                </div>
            </div>
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
            `}} />
        </div>
    );
}
