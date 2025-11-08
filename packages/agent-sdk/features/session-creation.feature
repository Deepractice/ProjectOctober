Feature: Session Creation
  As a developer
  I want to create sessions
  So that I can have conversations with Claude

  Background:
    Given I have an initialized agent

  Scenario: Create a new session
    When I create a new session
    Then a session should be created
    And the session should have a unique ID
    And the session state should be "created"

  Scenario: Create session with custom model
    When I create a session with model "claude-sonnet-4"
    Then the session should use the specified model

  Scenario: Create session emits events
    Given I am listening to agent events
    When I create a new session
    Then I should receive "session:created" event

  Scenario: Quick chat creates session automatically
    When I send a quick chat message "Hello"
    Then a new session should be created automatically
    And the session should contain my message
