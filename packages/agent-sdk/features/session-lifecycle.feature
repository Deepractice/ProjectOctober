Feature: Session Lifecycle Management
  As a developer using Agent SDK
  I want to manage session lifecycle
  So that I can control conversation flow

  Background:
    Given an Agent is initialized
    And a session is created

  Scenario: Complete session normally
    Given the session is active
    When the conversation naturally completes
    Then the session state should change to "completed"
    And token usage should be recorded
    And session data should be persisted to disk
    And the session should be read-only

  Scenario: Abort active session
    Given the session is active with ongoing response
    When I call session.abort()
    Then the message streaming should stop immediately
    And the session state should change to "aborted"
    And partial messages should be preserved
    And I can view the conversation history

  Scenario: Send message to completed session
    Given the session state is "completed"
    When I try to send a message
    Then it should throw error "Cannot send message: session is completed"

  Scenario: Delete session
    Given the session exists
    When I call session.delete()
    Then the session should be removed from memory
    And the session files should be deleted from disk
    And I cannot retrieve the session anymore

  Scenario: Query session messages
    Given the session has 10 messages
    When I call session.getMessages(5, 3)
    Then I should receive 5 messages starting from offset 3
    And messages should be in chronological order

  Scenario: Check token usage
    Given the session has processed messages
    When I call session.getTokenUsage()
    Then I should see total tokens used
    And I should see breakdown by type:
      | type          |
      | input         |
      | output        |
      | cacheRead     |
      | cacheCreation |

  Scenario: Get session metadata
    When I call session.getMetadata()
    Then I should see:
      | field       |
      | projectPath |
      | model       |
      | startTime   |
