import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';

// ... other imports ...

function App() {
  return (
    <ThemeProvider>
      <Router>
        // ... rest of your app ...
      </Router>
    </ThemeProvider>
  );
}

export default App; 