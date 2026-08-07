import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import AuthTabs from '../../components/auth/AuthTabs.jsx';
import FormField from '../../components/auth/FormField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  CheckboxRow,
  Divider,
  FooterText,
  Form,
  FormError,
  GhostButton,
  Heading,
  InlineLink,
  PrimaryButton,
  Subheading,
} from '../../components/auth/AuthElements.jsx';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const response = await login(email, password);
      navigate(response.roles?.includes('ADMIN') ? '/admin' : '/products', { replace: true });
    } catch (error) {
      setFormError(error.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div>
        <Heading>Sign in to your workspace</Heading>
        <Subheading>Use your ITWorx work account to continue.</Subheading>
      </div>

      <AuthTabs active="login" />

      <Form onSubmit={handleSubmit}>
        {formError && <FormError>{formError}</FormError>}

        <FormField
          id="email"
          label="Work email"
          icon={Mail}
          type="email"
          name="email"
          placeholder="sara.adel@itworx.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <FormField
          id="password"
          label="Password"
          labelRight={<InlineLink as={Link} to="/forgot-password">Forgot password?</InlineLink>}
          icon={Lock}
          type={showPassword ? 'text' : 'password'}
          name="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          trailingIcon={showPassword ? EyeOff : Eye}
          onTrailingClick={() => setShowPassword((prev) => !prev)}
          required
        />

        <CheckboxRow>
          <input
            type="checkbox"
            checked={keepSignedIn}
            onChange={(event) => setKeepSignedIn(event.target.checked)}
          />
          Keep me signed in on this device
        </CheckboxRow>

        <PrimaryButton type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </PrimaryButton>
      </Form>

      <Divider>OR</Divider>

      <GhostButton type="button">
        <ShieldCheck size={16} />
        Continue with ITWorx SSO
      </GhostButton>

      <FooterText>
        New to SupportDesk AI? <InlineLink as={Link} to="/signup">Create an account</InlineLink>
      </FooterText>
    </AuthLayout>
  );
}

export default Login;
