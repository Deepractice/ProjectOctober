Feature: Session Lifecycle
  As a developer
  I want to manage session states
  So that I can control conversation flow

  Background:
    Given I have an initialized agent
    And I have created a session

  Scenario: Session state transitions
    Given the session state is "created"
    When I send a message
    Then the session state should become "active"
    When the response completes
    Then the session state should become "idle"

  Scenario: Complete a session
    Given the session is in "idle" state
    When I complete the session
    Then the session state should be "completed"
    And I should receive "session:completed" event

  Scenario: Abort an active session
    Given the session is actively processing
    When I abort the session
    Then the session state should be "aborted"
    And the processing should stop

  Scenario: Delete a session
    When I delete the session
    Then the session should be removed
    And I should receive "session:deleted" event
    And the session should not be in the agent's session list

  Scenario: Cannot send to completed session
    Given the session is completed
    When I try to send a message
    Then it should throw an error
