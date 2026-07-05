import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import PosterOptimizer from './pages/PosterOptimizer';
import ButtonPrinter from './pages/ButtonPrinter';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="poster-optimizer" element={<PosterOptimizer />} />
          <Route path="button-printer" element={<ButtonPrinter />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
