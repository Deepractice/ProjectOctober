Feature: Agent Status and Monitoring
  As a developer using Agent SDK
  I want to monitor agent health and performance
  So that I can understand system state

  Background:
    Given an Agent is initialized

  Scenario: Check agent status
    When I call agent.getStatus()
    Then I should see:
      | field            | type    |
      | ready            | boolean |
      | warmupPoolSize   | number  |
      | activeSessions   | number  |
      | metrics          | object  |

  Scenario: Monitor performance metrics
    Given the agent has processed multiple sessions
    When I call agent.getStatus()
    Then metrics should include:
      | metric           | description                     |
      | avgResponseTime  | Average time to first response  |
      | totalSessions    | Total sessions created          |
      | cacheHitRate     | Percentage of cache hits        |

  Scenario: Subscribe to session events
    When I subscribe to agent.sessions$()
    And a new session is created
    Then I should receive an event:
      """json
      {
        "type": "created",
        "session": { "id": "...", "state": "created" }
      }
      """

  Scenario: Track session state changes
    Given I subscribe to agent.sessions$()
    When a session is created, updated, and deleted
    Then I should receive events in order:
      | type    |
      | created |
      | updated |
      | deleted |

  Scenario: List active sessions
    Given 5 sessions are created
    And 2 sessions are completed
    When I call agent.getSessions()
    Then I should see all 5 sessions
    And I can filter by state

  Scenario: Paginate session list
    Given 25 sessions exist
    When I call agent.getSessions(10, 5)
    Then I should receive 10 sessions starting from offset 5
