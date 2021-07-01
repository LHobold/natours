import axios from 'axios';
import { showAlert } from './alerts';

export const forgotPassword = async (email) => {
  try {
    const res = await axios({
      method: 'POST',
      url: `http://127.0.0.1:8000/api/v1/users/forgotPassword`,
      data: {
        email,
      },
    });

    if (res.data.status === 'sucess') {
      showAlert('success', 'Email sent!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const resetPassword = async (password, confirmPassword, token) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `http://127.0.0.1:8000/api/v1/users/resetPassword/${token}`,
      data: {
        password,
        confirmPassword,
      },
    });

    if (res.data.status === 'sucess') {
      showAlert('success', 'Password changed!');
      window.setTimeout(() => {
        location.assign('/me');
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
