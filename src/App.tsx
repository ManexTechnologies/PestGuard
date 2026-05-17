import AppLayout from './components/AppLayout';
import { ThemeProvider } from './components/theme-provider';
import './index.css';

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <div className="App">
        <AppLayout />
      </div>
    </ThemeProvider>
  );
}

export default App;
