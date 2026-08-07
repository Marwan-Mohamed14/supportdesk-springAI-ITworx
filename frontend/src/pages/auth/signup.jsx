import { Eye, EyeOff, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import AuthTabs from '../../components/auth/AuthTabs.jsx';
import FormField from '../../components/auth/FormField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import {
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

function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      return;
    }
    setConfirmError('');

    setSubmitting(true);
    try {
      await register(name, email, password);
      // New signups are always CUSTOMER, so straight to the shopping view.
      navigate('/products', { replace: true });
    } catch (error) {
      setFormError(error.message || 'Unable to create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div>
        <Heading>Create your workspace account</Heading>
        <Subheading>Set up access to SupportDesk AI with your ITWorx work email.</Subheading>
      </div>

      <AuthTabs active="signup" />

      <Form onSubmit={handleSubmit}>
        {formError && <FormError>{formError}</FormError>}

        <FormField
          id="name"
          label="Full name"
          icon={User}
          type="text"
          name="name"
          placeholder="Sara Adel"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

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
          icon={Lock}
          type={showPassword ? 'text' : 'password'}
          name="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          trailingIcon={showPassword ? EyeOff : Eye}
          onTrailingClick={() => setShowPassword((prev) => !prev)}
          required
        />

        <FormField
          id="confirmPassword"
          label="Confirm password"
          icon={Lock}
          type={showPassword ? 'text' : 'password'}
          name="confirmPassword"
          placeholder="••••••••"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={confirmError}
          required
        />

        <PrimaryButton type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </PrimaryButton>
      </Form>

      <Divider>OR</Divider>

      <GhostButton type="button">
        <ShieldCheck size={16} />
        Continue with ITWorx SSO
      </GhostButton>

      <FooterText>
        Already have an account? <InlineLink as={Link} to="/login">Log in</InlineLink>
      </FooterText>
    </AuthLayout>
  );
}

export default Signup;
