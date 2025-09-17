import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './ui/App';
import './ui/index.css';

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<App />);

