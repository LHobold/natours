import axios from 'axios';
import { showAlert } from './alerts';

export const signUp = async (name, email, password, confirmPassword) => {
  try {
    const res = await axios({
      method: 'POST',
      url: `/api/v1/users/signup`,
      data: {
        name,
        email,
        password,
        confirmPassword,
      },
    });

    if (res.data.status === 'sucess') {
      showAlert('success', 'Account created!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
