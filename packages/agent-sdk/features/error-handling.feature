Feature: Error Handling
  As a developer
  I want proper error handling with Result type
  So that I can handle failures gracefully

  Scenario: Create agent with invalid config
    When I create an agent without apiKey
    Then the result should be an error
    And the error should be an instance of AgentError
    And the error code should be "CONFIG_INVALID"
    And the error message should contain "apiKey is required"

  Scenario: Agent creation returns Result type
    When I create an agent with valid config
    Then the result should be ok
    And I can unwrap the agent from the result

  Background:
    Given I have an initialized agent

  Scenario: Handle invalid API key
    Given I have an agent with invalid API key
    When I send a message
    Then I should receive an error
    And the error should indicate authentication failure
    And I should receive "agent:error" event

  Scenario: Handle network errors
    Given the network is unavailable
    When I send a message
    Then the send operation should fail
    And the session state should reflect the error

  Scenario: Handle timeout
    Given the API response is delayed
    When I send a message
    And the response exceeds timeout
    Then I should receive a timeout error

  Scenario: Recover from transient errors
    Given I have a session with an error
    When I send another message
    Then the session should work normally
    And the previous error should not affect new messages
