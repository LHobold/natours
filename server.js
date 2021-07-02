const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log(err);
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  // eslint-disable-next-line no-use-before-define

  process.exit(1);
});

dotenv.config({ path: `${__dirname}/config.env` });

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('DB Connection sucessfull');
  });

////////////////////////////////// SERVER //////////////////////////////

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log('Server online at port ', PORT);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name);
  console.log('UNHANDLED REJECTION! Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
