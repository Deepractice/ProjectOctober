Feature: Event-Driven API
  As a developer
  I want to subscribe to events
  So that I can build reactive applications

  Background:
    Given I have an initialized agent
    And I have created a session

  Scenario: Subscribe to agent-level events
    Given I subscribe to all agent events
    When I create a session and send a message
    Then I should receive events from all sessions
    And events should include session IDs

  Scenario: Subscribe to session-specific events
    Given I subscribe to session events only
    When I send a message in this session
    Then I should only receive this session's events

  Scenario: Subscribe to specific event types
    Given I subscribe to "agent:speaking" events
    When I send a message
    Then I should only receive speaking events
    And I should not receive other event types

  Scenario: Unsubscribe from events
    Given I am subscribed to session events
    When I unsubscribe from events
    And I send a message
    Then I should not receive any more events

  Scenario: Observable streams
    Given I subscribe to the session messages observable
    When I send multiple messages
    Then I should receive all messages in the stream
    And the stream should maintain order
