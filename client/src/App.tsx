import './App.css';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Shared from './pages/Shared';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route path="/products" element={<Home />} />
      <Route path="/about" element={<Shared />} />
    </Routes>
    // <div className="App">
    //   <header className="App-header">
    //     <p>
    //       Edit <code>src/App.js</code> and save to reload.
    //     </p>
    //     <a
    //       className="App-link"
    //       href="https://reactjs.org"
    //       target="_blank"
    //       rel="noopener noreferrer"
    //     >
    //       Learn React
    //     </a>
    //   </header>
    // </div>
  );
}

export default App;
