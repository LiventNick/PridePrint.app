import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import PosterOptimizer from './pages/PosterOptimizer';
import ButtonPrinter from './pages/ButtonPrinter';
import { ErrorProvider } from './contexts/ErrorContext';
import './App.css';

function App() {
  return (
    <ErrorProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="poster-optimizer" element={<PosterOptimizer />} />
            <Route path="button-printer" element={<ButtonPrinter />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorProvider>
  );
}

export default App;
