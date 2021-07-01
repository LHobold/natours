import axios from 'axios';
import { showAlert } from './alerts';

export const changePassword = async (
  currentPassword,
  newPassword,
  confirmPassword
) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: 'http://127.0.0.1:8000/api/v1/users/changePassword',
      data: {
        currentPassword,
        newPassword,
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
