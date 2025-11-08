Feature: Agent Creation
  As a developer
  I want to create an Agent instance
  So that I can interact with Claude AI

  Scenario: Create agent with minimal config
    When I create an agent with config:
      | field     | value                        |
      | workspace | /tmp/test                    |
      | apiKey    | sk-ant-test-key-123456       |
    Then the agent should be created successfully
    And the agent should not be initialized yet

  Scenario: Create agent with custom config
    When I create an agent with config:
      | field     | value              |
      | workspace | /tmp/test          |
      | apiKey    | sk-ant-test-key    |
      | model     | claude-sonnet-4    |
      | baseUrl   | https://api.custom.com |
    Then the agent should be created successfully
    And the agent config should match the provided values

  Scenario: Create agent without API key should fail
    When I create an agent without apiKey
    Then the agent creation should fail
    And the error code should be "CONFIG_INVALID"
    And the error message should contain "apiKey is required"

  Scenario: Create agent with custom adapter
    Given I have a custom adapter implementation
    When I create an agent with the custom adapter
    Then the agent should use the custom adapter

  Scenario: Create agent with custom persister
    Given I have a custom persister implementation
    When I create an agent with the custom persister
    Then the agent should use the custom persister
