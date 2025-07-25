import { LoginForm } from '@/components/auth/login-form';

// Prevent this page from being built statically
export const dynamic = 'force-dynamic';

const LoginPage = () => {
  return <LoginForm />;
};

export default LoginPage;