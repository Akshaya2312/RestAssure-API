Feature: Search in Google

  Scenario: Search youtube in google

    Given User go to google home page
    And search youtube in textfield
    When User click on search button
    Then Youtube link should be visible