import { Route, Navigate } from 'react-router-dom'; // Заменили Redirect на Navigate
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard';
import { ProgressProvider } from './contexts/ProgressContext';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <ProgressProvider>
      <IonReactRouter>
        <IonRouterOutlet>
          {/* В React Router v6 компоненты передаются через пропс element */}
          <Route path="/welcome" element={<WelcomeScreen />} />

          <Route path="/dashboard" element={<Dashboard />} />

          {/* Вместо Redirect используем Navigate */}
          <Route path="/" element={<Navigate to="/welcome" replace />} />
        </IonRouterOutlet>
      </IonReactRouter>
    </ProgressProvider>
  </IonApp>
);

export default App;