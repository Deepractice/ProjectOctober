Feature: Runtime Error Handling
  As a developer
  I want proper error handling during agent runtime
  So that I can handle failures gracefully

  # Note: These tests use MockAdapter to simulate various error conditions

  Background:
    Given I have an initialized agent with API key

  Scenario: Handle invalid API key
    Given I have an agent with invalid API key
    When I send a message to the agent
    Then I should receive an error
    And the error should indicate authentication failure
    And I should receive "agent:error" event

  Scenario: Handle network errors
    Given the network is unavailable
    When I send a message to the agent
    Then the send operation should fail
    And the session state should reflect the error

  Scenario: Handle timeout
    Given the API response is delayed
    When I send a message to the agent
    And the response exceeds timeout
    Then I should receive a timeout error

  Scenario: Recover from transient errors
    Given I have a session with an error
    When I send another message to the agent
    Then the session should work normally
    And the previous error should not affect new messages
