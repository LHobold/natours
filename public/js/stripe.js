import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  try {
    const stripe = Stripe(
      'pk_test_51J8SOXLi8XmkjiKiIFP3mSIWw3Scuqkit89NS1k2MXG3em3tWXUH9jLyEAHbchQ44kMNw3uP7a2axx7GMhwmsufV00wJH7p3OC'
    );
    // get checkout session
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // use stripe object to charge credit card
    await stripe.redirectToCheckout({ sessionId: session.data.session.id });
  } catch (err) {
    showAlert('error', err);
  }
};
