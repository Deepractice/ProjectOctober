Feature: Agent Initialization
  As a developer
  I want to initialize the agent
  So that it loads historical sessions and is ready to use

  Background:
    Given I have created an agent

  Scenario: Initialize agent successfully
    When I initialize the agent
    Then the agent should be initialized
    And the agent status should be ready
    And historical sessions should be loaded

  Scenario: Initialize agent twice should fail
    Given the agent is already initialized
    When I try to initialize the agent again
    Then it should throw an error "Agent already initialized"

  Scenario: Initialize agent emits event
    Given I am listening to agent events
    When I initialize the agent
    Then I should receive "agent:initialized" event
    And the event should contain session count
