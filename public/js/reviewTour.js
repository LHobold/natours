import axios from 'axios';
import { showAlert } from './alerts';

export const sendReview = async (review, rating, user, tour) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/reviews/',
      data: {
        review,
        rating,
        user,
        tour,
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
