Feature: Get Configuration
  As a developer
  I want to load configuration from multiple sources
  So that I can use the merged config in my application

  Background:
    Given the config manager is initialized

  Scenario: Load config from environment variables
    Given the .env file contains:
      | key              | value                       |
      | PORT             | 5201                        |
      | ANTHROPIC_API_KEY| sk-test-key-123             |
      | NODE_ENV         | development                 |
    When I call getConfig
    Then the config should have port 5201
    And the config should have anthropicApiKey "sk-test-key-123"

  Scenario: Merge config from multiple sources with priority
    Given the .env file contains:
      | key              | value           |
      | PORT             | 5201            |
      | ANTHROPIC_API_KEY| sk-env-key      |
    And the database contains:
      | key              | value           |
      | PORT             | 5202            |
      | CONTEXT_WINDOW   | 180000          |
    When I call getConfig
    Then the config should have port 5202
    And the config should have anthropicApiKey "sk-env-key"
    And the config should have contextWindow 180000

  Scenario: UI config overrides all other sources
    Given the .env file contains:
      | key              | value           |
      | PORT             | 5201            |
    And the database contains:
      | key              | value           |
      | PORT             | 5202            |
    And the UI config contains:
      | key              | value           |
      | PORT             | 5203            |
    When I call getConfig
    Then the config should have port 5203

  Scenario: Get specific config value
    Given the config has port 5201
    When I call getConfigValue with key "port"
    Then the result should be 5201

  Scenario: Cache config on first load
    Given the config is not loaded yet
    When I call getConfig
    And I call getConfig again without reload
    Then the second call should use cached config
    And the loaders should be called only once

  Scenario: Reload config when requested
    Given the config is already loaded
    And the .env file is updated with PORT 5999
    When I call getConfig with reload true
    Then the config should have port 5999
    And the loaders should be called twice
