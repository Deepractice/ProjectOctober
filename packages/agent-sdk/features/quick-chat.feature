Feature: Quick Chat API
  As a developer using Agent SDK
  I want a simple one-line chat API
  So that I can prototype quickly without managing sessions

  Background:
    Given an Agent is initialized

  Scenario: Quick chat creates session internally
    When I call agent.chat("Hello, who are you?")
    Then a session should be created automatically
    And the message should be sent
    And I should receive the Session instance
    And I can subscribe to messages$ on returned session

  Scenario: Quick chat with custom options
    When I call agent.chat("Explain TypeScript", { model: "claude-haiku-4-5-20251001" })
    Then the session should use the specified model
    And the message should be sent
    And I can continue the conversation using returned session

  Scenario: Multiple quick chats create separate sessions
    When I call agent.chat("First question")
    And I call agent.chat("Second question")
    Then 2 independent sessions should be created
    And each session should have its own conversation history

  Scenario: Quick chat uses warm pool
    Given warmup pool has 3 ready sessions
    When I call agent.chat("Hello")
    Then the session should be created quickly (<1s)
    And warmup pool should refill automatically
