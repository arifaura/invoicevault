import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './components/Home/Home';
import Login from './components/Login/Login';
import Signup from './components/Signup/Signup';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';

beforeAll(() => {
  window.matchMedia = window.matchMedia || (() => ({
    matches: false,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
  }));

  global.IntersectionObserver = class {
    constructor(callback) {
      this.callback = callback;
    }

    observe(target) {
      this.callback([{ target, isIntersecting: true, intersectionRatio: 1 }]);
    }

    unobserve() {}

    disconnect() {}
  };
});

test('renders the Invoice Vault landing page with working auth links', () => {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { name: /Every Invoice\.\s*One Secure Vault\./i })).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: /Get Started/i }).every((link) => link.getAttribute('href') === '/signup')).toBe(true);
  expect(screen.getAllByRole('link', { name: /Sign In/i }).every((link) => link.getAttribute('href') === '/login')).toBe(true);

  fireEvent.click(screen.getByRole('button', { name: 'Receipts' }));
  expect(screen.getByText('Fieldwork Market', { selector: '.dashboard-row-name strong' })).toBeInTheDocument();
  expect(screen.queryByText('Northstar Studio', { selector: '.dashboard-row-name strong' })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Bills' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Search sample documents' }), { target: { value: 'Morrow' } });
  expect(screen.getByText('Morrow Utilities', { selector: '.dashboard-row-name strong' })).toBeInTheDocument();
});

test('renders the redesigned sign-in page and its signup route', () => {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { name: /Sign in to your account/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/signup');
});

test('renders the redesigned signup page with terms and sign-in route', () => {
  render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { name: /Create your account/i })).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: /I agree to the Terms of Service and Privacy Policy/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
});

test('theme toggle updates the active theme and persists the selection', () => {
  localStorage.setItem('theme', 'light');

  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );

  expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  expect(localStorage.getItem('theme')).toBe('dark');

  fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));
  expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  expect(localStorage.getItem('theme')).toBe('light');
});
