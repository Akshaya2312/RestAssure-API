const { client } = require('nightwatch-cucumber');
const { defineSupportCode } = require('cucumber');


defineSupportCode(({ Given, Then, When, After, Before }) => {




    Before(function (scenario) {
        return client.init()
    });

    After(function (scenario) {
        return client.end()
    });

    Given(/^User go to google home page$/, function () {
    });
     client.pause(10000)
    client.assert.containsText('body','Google')

    Given(/^search youtube in textfield$/, function () {

    });

    When(/^User click on search button$/, function () {

    });

    Then(/^Youtube link should be visible$/, function () {

    });


})
