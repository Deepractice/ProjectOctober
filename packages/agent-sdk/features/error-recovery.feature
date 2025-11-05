Feature: Error Handling and Recovery
  As a developer using Agent SDK
  I want the system to handle errors gracefully
  So that failures don't crash my application

  Background:
    Given an Agent is initialized

  Scenario: Recover from session crash
    Given a session is active
    When the Claude SDK throws an unexpected error
    Then the session state should change to "error"
    And the error should be emitted via messages$ Observable
    And other sessions should not be affected
    And I can create new sessions normally

  Scenario: Handle network timeout
    Given a session is active
    When the network request times out
    Then the Observable should emit a timeout error
    And the session state should be "error"
    And the error message should be descriptive

  Scenario: Handle invalid configuration
    Given an Agent with invalid config:
      | workspace | /nonexistent/path |
    When I try to initialize the agent
    Then it should throw error "Invalid workspace path"
    And the agent should remain uninitialized

  Scenario: Handle concurrent session limit
    Given warmup pool size is 3
    And 10 sessions are being created concurrently
    When I check agent status
    Then all 10 sessions should be created successfully
    And some should use warm pool
    And some should use cold start
    And no session should fail

  Scenario: Persist sessions on app crash
    Given 3 sessions with conversation history
    When the application crashes unexpectedly
    And I restart the application
    Then I can reload session data from disk
    And conversation history is preserved
    And I can continue conversations

  Scenario: Handle malformed API responses
    Given a session is active
    When the Claude API returns malformed JSON
    Then the error should be caught and wrapped
    And the session state should be "error"
    And I can access the raw error details

  Scenario: Cleanup on agent destroy
    Given the agent has 5 active sessions
    When I call agent.destroy()
    Then all sessions should be gracefully closed
    And resources should be released
    And warmup pool should be emptied
    And I can create a new agent instance
