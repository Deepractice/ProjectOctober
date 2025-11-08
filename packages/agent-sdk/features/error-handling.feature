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
    And the agent should be defined
