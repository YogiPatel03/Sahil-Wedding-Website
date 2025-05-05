import http from 'k6/http';
import { sleep } from 'k6';

// Configure 100 virtual users for 30 seconds
export let options = {
  vus: 100,
  duration: '30s',
};

export default function () {
  // Hit your homepage
  http.get('https://bhumiandsahil.org/');
  // Wait 1s between iterations
  sleep(1);
}
