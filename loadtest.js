import http from 'k6/http';
import { sleep, check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 100 },   // ramp from 0 to 100 VUs over 30s
    { duration: '30s', target: 200 },   // ramp to 200 VUs over next 30s
    { duration: '90s', target: 200 },   // stay at 200 VUs for 90s
    { duration: '30s', target:   0 },   // ramp down to 0 over 30s
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],           // <1% errors
    http_req_duration: ['p(95)<500','avg<200'], // p(95)<500ms, avg<200ms
  },
};

// the 9 “pages” (sections) on your single‑page app
const PAGES = [
  'https://bhumiandsahil.org/',                   // Home
  'https://bhumiandsahil.org/#Bride&Groom',       // Bride & Groom
  'https://bhumiandsahil.org/#Events',            // Wedding (Events)
  'https://bhumiandsahil.org/#Gallery',           // Gallery
  'https://bhumiandsahil.org/#Accommodation',     // Accommodation
  'https://bhumiandsahil.org/#WhileYourHere',     // While You’re Here
  'https://bhumiandsahil.org/#Registry',          // Registry
  'https://bhumiandsahil.org/#RSVP',              // RSVP
  'https://bhumiandsahil.org/#FAQ'                // FAQ
];

export default function () {
  for (let url of PAGES) {
    let res = http.get(url);
    check(res, {  
      [`200 OK for ${url}`]: (r) => r.status === 200 
    });
    // simulate a short user think‑time between 100–500 ms
    sleep(Math.random() * 0.4 + 0.1);
  }
  // then wait 0.5–2 s before the next loop
  sleep(Math.random() * 1.5 + 0.5);
}
