import { Redirect, Route, Switch } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './app/features/auth/AuthContext';
import { PrivateRoute } from './app/features/auth/PrivateRoute';
import { LoginPage } from './app/features/auth/LoginPage';
import { RegisterPage } from './app/features/auth/RegisterPage';
import { ResetPasswordPage } from './app/features/auth/ResetPasswordPage';
import { HomePage } from './app/features/home/HomePage';
import { Toaster } from '@/components/ui/sonner';

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <Switch>
        {/* Public Routes */}
        <Route exact path="/login" component={LoginPage} />
        <Route exact path="/register" component={RegisterPage} />
        <Route exact path="/reset-password" component={ResetPasswordPage} />

        {/* Private Routes */}
        <PrivateRoute exact path="/home" component={HomePage} />

        {/* Default Redirect - go to login */}
        <Route exact path="/">
          <Redirect to="/login" />
        </Route>
      </Switch>
      
      <Toaster position="top-center" />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
