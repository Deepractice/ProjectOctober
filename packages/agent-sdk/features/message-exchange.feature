Feature: Message Exchange
  As a developer
  I want to send messages and receive responses
  So that I can interact with Claude

  Background:
    Given I have an initialized agent
    And I have created a session

  Scenario: Send a text message
    When I send a message "What is 2+2?"
    Then I should receive a response
    And the session should contain my message
    And the session should contain the AI response

  Scenario: Message exchange emits events
    Given I am listening to session events
    When I send a message "Hello"
    Then I should receive events in order:
      | event              |
      | stream:start       |
      | agent:thinking     |
      | agent:speaking     |
      | stream:chunk       |
      | agent:idle         |
      | stream:end         |

  Scenario: Send message with content blocks
    Given I have an image as ContentBlock
    When I send a message with text and image blocks
    Then the message should be sent successfully
    And I should receive a response

  Scenario: Receive streaming chunks
    Given I am listening to "stream:chunk" events
    When I send a message "Tell me a story"
    Then I should receive multiple chunks
    And the chunks should be in order

  Scenario: Message standard format
    When I send a message "Hello"
    Then the user message should have:
      | field     | type              |
      | id        | string            |
      | type      | "user"            |
      | content   | string            |
      | timestamp | Date              |
    And the agent message should have:
      | field     | type              |
      | id        | string            |
      | type      | "agent"           |
      | content   | string            |
      | timestamp | Date              |

  Scenario: Multi-modal message format
    Given I have an image ContentBlock
    When I send a message with image
    Then the user message content should be an array
    And the content should contain TextBlock and ImageBlock
    And the ImageBlock should have base64 encoded data
