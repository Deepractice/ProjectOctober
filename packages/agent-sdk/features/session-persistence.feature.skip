Feature: Session Persistence
  As a developer
  I want sessions to be persisted
  So that I can restore conversations across restarts

  Background:
    Given I have an initialized agent

  Scenario: Sessions are automatically persisted
    When I create a session and send a message "Hello"
    And I wait for persistence to complete
    Then the session should be saved to database
    And the message should be saved to database

  Scenario: Load historical sessions
    Given I have 3 persisted sessions
    When I initialize a new agent
    Then all 3 sessions should be loaded
    And I can access the historical messages

  Scenario: Persistence emits events
    Given I am listening to persistence events
    When I send a message
    Then I should receive events:
      | event                     |
      | persist:message:start     |
      | persist:message:success   |
      | persist:session:start     |
      | persist:session:success   |

  Scenario: Handle persistence errors gracefully
    Given the database is unavailable
    When I send a message
    Then the message should still be sent
    And I should receive "persist:message:error" event
    But the conversation should continue normally

  Scenario: Use custom persister
    Given I have a custom persister implementation
    When I create an agent with the custom persister
    And I send a message
    Then the custom persister should be called
    And the message should be saved using custom persister

  Scenario: Agent works without persister
    When I create an agent without persister (via dependencies)
    And I send a message
    Then the session should work normally
    But no persistence events should be emitted
