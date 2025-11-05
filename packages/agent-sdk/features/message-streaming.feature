Feature: Message Streaming with RxJS
  As a developer using Agent SDK
  I want to receive streaming messages as Observables
  So that I can build reactive UIs

  Background:
    Given an Agent is initialized
    And a session is created

  Scenario: Send message and receive streaming response
    When I send message "Explain RxJS in 3 sentences"
    And I subscribe to the session's messages$ stream
    Then I should receive messages in order
    And the stream should complete when response finishes

  Scenario: Receive different message types in stream
    When I send message "List files in current directory"
    And I subscribe to the session's messages$ stream
    Then I should receive a user message
    And I should receive an assistant message with thinking
    And I should receive tool messages for file operations
    And I should receive a final assistant message

  Scenario: Handle streaming errors gracefully
    Given the session is active
    And network connectivity is unstable
    When I send a message
    And I subscribe to messages$
    Then the Observable should emit an error event
    And the session state should change to "error"
    And the error details should be accessible

  Scenario: Multiple subscribers to same message stream
    Given I send a message
    When 3 different components subscribe to messages$
    Then all 3 subscribers should receive the same messages
    And messages should be multicast (not replayed)

  Scenario: Unsubscribe from message stream
    Given I send a message
    And I subscribe to messages$
    When I unsubscribe after 2 seconds
    Then I should receive partial messages
    And the session should continue processing
    And I can resubscribe to get remaining messages
