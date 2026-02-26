import React from 'react';
import { StatusBar } from 'react-native';

import { RootNavigator } from './src/app/navigation/RootNavigator';
import { AppProviders } from './src/app/providers/AppProviders';
import { colors } from './src/app/theme/tokens';

function App(): React.JSX.Element {
  return (
    <AppProviders>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgCanvas} />
      <RootNavigator />
    </AppProviders>
  );
}

export default App;
