Feature: Update Configuration
  As a developer
  I want to update configuration programmatically
  So that I can change settings at runtime

  Background:
    Given the config manager is initialized
    And the initial config is loaded

  Scenario: Update config without persistence
    Given the current port is 5201
    When I call updateConfig with:
      | key  | value |
      | port | 5202  |
    Then the config should have port 5202
    And the config should not be persisted to file
    And the config should not be persisted to database

  Scenario: Update config with persistence
    Given the current port is 5201
    When I call updateConfig with persist option:
      | key  | value |
      | port | 5202  |
    Then the config should have port 5202
    And the config should be persisted to file
    And the config should be persisted to database

  Scenario: Update multiple fields at once
    When I call updateConfig with:
      | key            | value   |
      | port           | 5202    |
      | contextWindow  | 200000  |
      | logLevel       | debug   |
    Then the config should have port 5202
    And the config should have contextWindow 200000
    And the config should have logLevel "debug"

  Scenario: Update from UI with highest priority
    Given the database has port 5202
    When I call updateConfigFromUI with:
      | key  | value |
      | port | 5203  |
    Then the config should have port 5203
    And the UI config should override database config

  Scenario: Validation error on invalid update
    When I call updateConfig with:
      | key      | value    |
      | port     | invalid  |
    Then the update should fail with validation error
    And the config should remain unchanged

  Scenario: Update required field in production mode
    Given the config mode is "runtime"
    And the .env file contains:
      | key              | value        |
      | ANTHROPIC_API_KEY| sk-test-key  |
      | PORT             | 5201         |
    When I call updateConfig with:
      | key              | value        |
      | anthropicApiKey  | sk-new-key   |
    Then the config should have anthropicApiKey "sk-new-key"

  Scenario: Cannot set empty required field in production
    Given the config mode is "runtime"
    When I call updateConfig with:
      | key              | value |
      | anthropicApiKey  |       |
    Then the update should fail with validation error
    And the error should mention "Invalid configuration"
