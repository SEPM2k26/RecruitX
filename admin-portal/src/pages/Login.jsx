import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';
import Tape from '../components/hand-drawn/Tape';
import Thumbtack from '../components/hand-drawn/Thumbtack';

export default function Login() {
  const { login } = useAuth();
  const { error: showError, success } = useNotification();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: 'admin@recruitx.com', password: 'password' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(form.email, form.password);
    setSubmitting(false);

    if (result.success) {
      success('Welcome back! Opening your sketchbook...');
      navigate('/dashboard');
    } else {
      showError(result.message || 'Login failed');
    }
  };

  return (
    <div className="login-page relative">
      {/* Decorative notebook doodles */}
      <div className="absolute top-12 left-12 hidden lg:block select-none opacity-80 rotate-[-6deg]">
        <div className="card-postit p-4 max-w-[200px] text-sm">
          <Thumbtack />
          <p className="font-heading font-bold text-lg text-marker-red">TPO Office Notice</p>
          <p className="mt-1">Placement season is live. Check upcoming drives and candidate lists!</p>
        </div>
      </div>

      <div className="login-card relative">
        <Tape />

        <div className="login-header">
          <div className="login-logo">R</div>
          <h1 className="login-title">RecruitX Admin</h1>
          <p className="login-subtitle">Training & Placement TPO Notebook</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">TPO Email Address</label>
            <div className="search-input-wrapper">
              <Mail size={18} />
              <input
                id="login-email"
                type="email"
                className="search-input"
                placeholder="admin@recruitx.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="search-input-wrapper">
              <Lock size={18} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="search-input"
                style={{ paddingRight: '44px' }}
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--color-pencil-light)',
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '12px', fontSize: '18px' }}
            disabled={submitting}
          >
            {submitting ? (
              'Opening Desk...'
            ) : (
              <>
                <Sparkles size={18} /> Sign In to Admin Desk
              </>
            )}
          </button>
        </form>

        <div className="divider" />
        
        {/* Post-it styled demo hint */}
        <div className="bg-postit border-2 border-pencil rounded-wobbly-sm p-3 text-center shadow-hand-sm transform rotate-[1deg]">
          <span className="font-heading font-bold text-sm block text-pencil">Quick Demo Credentials</span>
          <span className="text-sm font-hand text-pencil-light">admin@recruitx.com • password</span>
        </div>
      </div>
    </div>
  );
}
