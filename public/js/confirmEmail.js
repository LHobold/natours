import axios from 'axios';
import { showAlert } from './alerts';

export const activateAccount = async (token) => {
  try {
    const res = await axios({
      method: 'POST',
      url: `/api/v1/users/confirm/${token}`,
      data: {},
    });

    if (res.data.status === 'sucess') {
      window.setTimeout(() => {
        location.assign('/me');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
