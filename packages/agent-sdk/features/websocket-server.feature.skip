Feature: WebSocket Server
  As a server developer
  I want to create a WebSocket server for the agent
  So that browser clients can connect and interact

  Background:
    Given I have an initialized agent

  Scenario: Create WebSocket server
    When I create a WebSocket server on port 5200
    Then the server should be listening
    And clients should be able to connect

  Scenario: Client sends message through WebSocket
    Given I have a WebSocket server running
    And a client is connected
    When the client sends a message via WebSocket
    Then the message should be forwarded to the session
    And the client should receive response events

  Scenario: Multiple clients, multiple sessions
    Given I have a WebSocket server running
    When client A connects with session "session-1"
    And client B connects with session "session-2"
    Then each client should only receive their own session events

  Scenario: Auto-create session if not exists
    Given I have a WebSocket server running
    When a client connects with a new session ID
    Then the session should be created automatically

  Scenario: Close WebSocket server
    Given I have a WebSocket server running
    When I close the server
    Then the server should stop listening
    And all client connections should be closed
