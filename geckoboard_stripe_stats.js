var dateFormat = require('dateformat');

var API_KEY = 'your-geckoboard-api-key';
var STRIPE_SECRET_KEY = 'your-stripe-secret-key';

var stripe = require('stripe')(
  STRIPE_SECRET_KEY
);

var gb = require('geckoboard')(
  API_KEY
);

var data_date = new Date();
var active_customers = 0;
var monthly_revenue = 0;

stripe.customers.list(
  function(err, customers){
    customers["data"].forEach(function(c){
      stripe.customers.retrieve(
        c.id,
        function(err, customer){
          if (customer["subscriptions"]["total_count"] > 0) {
            active_customers += 1;
            customer["subscriptions"]["data"].forEach(
              function(s){
                monthly_revenue += s["plan"]["amount"];
              }
            );
          }
        }
      );
    });
  }
);

gb.datasets.findOrCreate(
  {
    id: 'saas_sales',
    fields: {
      quantity: {
        type: 'number',
        name: 'Number of Customers'
      },
      gross: {
        type: 'money',
        name: 'Monthly Recuring Revenue',
        currency_code: "USD"
      },
      date: {
        type: 'date',
        name: 'Date'
      }
    }
  },
  function (err, dataset) {
    if (err) {
      console.error(err);
      return;
    }

    dataset.put(
      [
        { date: dateFormat(data_date, "yyyy-mm-dd"), quantity: active_customers, gross: monthly_revenue }
      ],
      function (err) {
        if (err) {
          console.error(err);
          return;
        }
        console.log('Dataset created and data added');
      }
    );
  }
);
