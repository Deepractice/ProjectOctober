Feature: Session Creation and Warmup Pool
  As a developer using Agent SDK
  I want to create sessions efficiently
  So that users get fast responses

  Background:
    Given an Agent is initialized with config:
      | workspace        | /tmp/test-workspace |
      | warmupPoolSize   | 3                   |
      | model            | claude-sonnet-4     |

  Scenario: Create session with warm pool available
    Given warmup pool has 3 ready sessions
    When I create a new session
    Then the session should be created within 1000ms
    And the session state should be "created"
    And the warmup pool should automatically refill to 3

  Scenario: Create session when pool is empty
    Given warmup pool is exhausted
    When I create a new session
    Then the session should be created successfully
    And the response time should be acceptable
    And the warmup pool should start refilling

  Scenario: Create multiple concurrent sessions
    Given warmup pool has 3 ready sessions
    When I create 5 sessions concurrently
    Then the first 3 sessions should use warm sessions
    And the remaining 2 sessions should use cold start
    And all 5 sessions should work independently
    And the warmup pool should refill to 3

  Scenario: Create session with custom options
    When I create a session with options:
      | systemPrompt | You are a helpful assistant |
      | model        | claude-opus-4               |
    Then the session should be created
    And the session metadata should reflect custom options

  Scenario: Fail to create session when agent not initialized
    Given an Agent is created but not initialized
    When I try to create a session
    Then it should throw error "Agent not initialized"
