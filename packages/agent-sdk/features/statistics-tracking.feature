Feature: Session Statistics Tracking
  As a developer using the agent SDK
  I want to track session statistics (duration, cost, conversation)
  So that I can monitor API usage and costs in real-time

  Background:
    Given I use the mock adapter
    And I create an agent with model "claude-3-5-sonnet-20250219"
    And the agent is already initialized
    And I have created a session

  Scenario: Track basic conversation statistics
    When I send a message "Hello"
    Then the session statistics should show:
      | field                     | value |
      | conversation.turns        | 1     |
      | conversation.messages     | >= 2  |
    And the cost total should be greater than 0

  Scenario: Track duration statistics
    When I send a message "Test message"
    Then the duration statistics should show:
      | field   | condition |
      | total   | > 0       |
      | api     | > 0       |
      | thinking| >= 0      |
    And the API duration should be less than or equal to total duration

  Scenario: Track cost breakdown
    When I send a message "Calculate pricing"
    Then the cost breakdown should include:
      | cost_type       | condition |
      | input           | > 0       |
      | output          | > 0       |
      | cacheRead       | >= 0      |
      | cacheCreation   | >= 0      |
    And the total cost should equal the sum of all breakdowns

  Scenario: Real-time statistics updates via EventEmitter
    Given I listen for "statistics:updated" events
    When I send a message "Track this"
    Then I should receive at least 1 "statistics:updated" events
    And each event should contain valid statistics data

  Scenario: Real-time statistics updates via RxJS Observable
    Given I subscribe to the statistics$ observable
    When I send a message "Monitor me"
    Then I should receive statistics updates through the observable
    And the observable should emit at least 1 values

  Scenario: Multiple turns accumulate statistics
    When I send a message "First message"
    And I send a message "Second message"
    And I send a message "Third message"
    Then the conversation turns should be 3
    And the total cost should reflect 3 turns
    And the API duration should accumulate across all turns

  Scenario: getStatistics returns current statistics
    When I send a message "Get stats"
    And I call getStatistics()
    Then the returned statistics should match:
      | field                  | condition |
      | duration.total         | > 0       |
      | cost.total             | > 0       |
      | conversation.turns     | 1         |

  Scenario: Pricing configuration for different models
    Given I use the mock adapter
    And I create an agent with model "claude-3-5-haiku-20250110"
    And the agent is already initialized
    And I have created a session
    When I send a message "Test message"
    Then the cost breakdown should include:
      | cost_type       | condition |
      | input           | > 0       |
      | output          | > 0       |
    And the total cost should equal the sum of all breakdowns

  Scenario: Cost calculation accuracy
    When I send a message "Calculate cost"
    Then the cost breakdown should include:
      | cost_type       | condition |
      | input           | > 0       |
      | output          | > 0       |
    And the total cost should equal the sum of all breakdowns
