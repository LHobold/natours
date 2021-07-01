/* eslint-disable */
// import 'regenerator-runtime/runtime';
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { changePassword } from './changePassword';
import { forgotPassword, resetPassword } from './resetPassword';
import { signUp } from './signUp';
import { activateAccount } from './confirmEmail';
import { bookTour } from './stripe';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.login-form');
const logoutButton = document.querySelector('.nav__el--logout');
const changeSettingsForm = document.querySelector('.form-user-data');
const changePasswordForm = document.querySelector('.form-user-settings');
const resetPasswordForm = document.querySelector('.form-reset-password');
const forgotPasswordForm = document.querySelector('.form-forgot-password');
const signupForm = document.querySelector('.form-signup');
const confirmEmail = document.querySelector('.confirm-email');
const bookBtn = document.getElementById('book-tour');

// DELEGATION

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);

  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

if (logoutButton) {
  logoutButton.addEventListener('click', logout);
}

if (changeSettingsForm) {
  changeSettingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelector('.btn--save-settings').textContent = 'Updating...';

    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    await updateSettings(form);
    document.querySelector('.btn--save-settings').textContent = 'Save settings';
    location.reload();
  });
}

if (changePasswordForm) {
  changePasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const confirmPassword = document.getElementById('password-confirm').value;

    changePassword(currentPassword, newPassword, confirmPassword);
  });
}

if (resetPasswordForm) {
  resetPasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const token = window.location.pathname.split('/')[2];
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    resetPassword(password, confirmPassword, token);
  });
}

if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelector('.btn--save-settings').textContent = 'Sending email';

    const email = document.getElementById('email').value;

    await forgotPassword(email);

    document.querySelector('.btn--save-settings').textContent =
      'Recover account';
  });
}

if (signupForm)
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelector('.btn--save-settings').textContent =
      'Creating account';

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    await signUp(name, email, password, confirmPassword);

    document.querySelector('.btn--save-settings').textContent = 'Sign up';
  });

if (confirmEmail) {
  const token = window.location.pathname.split('/')[2];
  activateAccount(token);
}

if (bookBtn) {
  bookBtn.addEventListener('click', async (e) => {
    const { tourId } = bookBtn.dataset;
    e.target.textContent = 'Processing...';
    await bookTour(tourId);
    // e.target.textContent = 'Book tour';
  });
}
