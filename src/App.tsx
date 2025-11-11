import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AuthProvider } from './app/features/auth/AuthContext';
import { PrivateRoute } from './app/features/auth/PrivateRoute';
import { LoginPage } from './app/features/auth/LoginPage';
import { RegisterPage } from './app/features/auth/RegisterPage';
import { ResetPasswordPage } from './app/features/auth/ResetPasswordPage';
import { HomePage } from './app/features/home/HomePage';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <IonReactRouter>
        <IonRouterOutlet>
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
        </IonRouterOutlet>
      </IonReactRouter>
    </AuthProvider>
  </IonApp>
);

export default App;
