
const express = require('express')
const app = express()
const request = require('request-promise');

const url = 'https://backend-challenge-winter-2017.herokuapp.com/customers.json?page=';

function validate_helper(validations, customer) {
  var invalids = [];
  validations.forEach((validation) => {
    let field = Object.keys(validation);
    const { required, type, length } = validation[field];
    if (required && customer[field] === undefined) {
      invalids.push(field);
    }
    else if (type && typeof customer[field] !== type) {
      invalids.push(field);
    }
    else if (length && (customer[field].length < length.min || customer[field].length > length.max)) {
      invalids.push(field);
    }
  })
  return {
    id: customer.id,
    invalid_fields: invalids
  }
}

function validate(customers) {
  return request(url + '0')
    .then((result) => JSON.parse(result))
    .then((result) => {
      const { total, per_page } = result.pagination;
      const num_pages = Math.ceil(total / per_page);

      var requests = [];
      for (let i = 1; i <= num_pages; i++) {
        requests.push(request(url + i));
      }
      return Promise.all(requests);
    })
    .then((results) => {
      var invalidations = [];
      results.forEach((result) => {
        result = JSON.parse(result);
        if (result.customers) {
          result.customers.forEach((customer) => {
            const validation = validate_helper(result.validations, customer);
            if (validation.invalid_fields.length > 0) {
              invalidations.push(validation);
            }
          })
        }
      });
      return invalidations;
    })
}

app.get('/health', (req, res) => {
  res.status(200).send("Health check OK!");
});

app.get('/', (req, res) => {
  var validations = {};
  var customers = [];
  var page = 1;
  validate()
    .then((data) => res.send(data));
});

const port = process.env.PORT || 8000;

app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`)
})
