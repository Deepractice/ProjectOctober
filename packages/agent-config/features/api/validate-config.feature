Feature: Validate Configuration
  As a developer
  I want to validate configuration before using it
  So that I can catch errors early

  Scenario: Valid configuration passes validation
    When I validate config:
      | key              | value                       |
      | port             | 5201                        |
      | anthropicApiKey  | sk-test-key                 |
      | nodeEnv          | development                 |
    Then the validation should succeed
    And the result should be valid

  Scenario: Invalid port type fails validation
    When I validate config:
      | key              | value        |
      | port             | not-a-number |
      | anthropicApiKey  | sk-test-key  |
    Then the validation should fail
    And the validation errors should mention "port"

  Scenario: Invalid node environment fails validation
    When I validate config:
      | key              | value       |
      | nodeEnv          | invalid     |
      | anthropicApiKey  | sk-test-key |
    Then the validation should fail
    And the validation errors should mention "nodeEnv"

  Scenario: Missing required API key fails validation
    When I validate config:
      | key  | value |
      | port | 5201  |
    Then the validation should fail
    And the validation errors should mention "anthropicApiKey"

  Scenario: Empty API key fails validation
    When I validate config:
      | key              | value |
      | port             | 5201  |
      | anthropicApiKey  |       |
    Then the validation should fail
    And the validation errors should mention "anthropicApiKey"

  Scenario: Validate with defaults applied
    When I validate config:
      | key              | value       |
      | anthropicApiKey  | sk-test-key |
    Then the validation should succeed
    And the result should have port 5201
    And the result should have vitePort 5200
    And the result should have contextWindow 160000
