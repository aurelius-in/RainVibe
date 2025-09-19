import React from 'react';
import { render, screen } from '@testing-library/react';
import About from './About';

describe('About', () => {
  it('renders app name and accent block', () => {
    render(<About />);
    expect(screen.getByText('RainVibe')).toBeInTheDocument();
    const accents = document.getElementsByClassName('gradient-accent');
    expect(accents.length).toBeGreaterThan(0);
  });
});


