
const express = require('express')
const app = express()
const request = require('request-promise');

const url = 'https://backend-challenge-winter-2017.herokuapp.com/customers.json?page=';

function validate(validations, customer) {
  let invalids = [];
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

function recursive(page, customers) {
  return request(url + page)
    .then((result) => JSON.parse(result))
    .then((result) => {
      if (result.customers && result.customers.length > 0) {
        result.customers.forEach((customer) => {
          const validation = validate(result.validations, customer);
          if (validation.invalid_fields.length > 0) {
            customers.push(validation);
          }
        })
        return recursive(page+1, customers);
      }
      else {
        return customers;
      }
    })
}

app.get('/validations', (req, res) => {
  var validations = {};
  var customers = [];
  var page = 1;
  recursive(page, customers)
    .then((data) => res.send(data));
});

app.get('/health', (req, res) => {
  res.status(200).send("Health check OK!");
});

app.listen(8000, function () {
  console.log('Example app listening on port 8000!')
})
