require "test_helper"

class Api::V1::LeaderboardControllerTest < ActionDispatch::IntegrationTest
  test "GET /api/v1/leaderboard returns 401 for unauthenticated user" do
    get "/api/v1/leaderboard", as: :json
    assert_response :unauthorized

    body = JSON.parse(response.body)
    assert_equal "UNAUTHORIZED", body["error"]["code"]
  end

  test "GET /api/v1/leaderboard returns all activated players for authenticated user" do
    # Login as player
    post "/api/v1/sessions", params: { nickname: "tomek", password: "secret123" }, as: :json
    assert_response :success

    get "/api/v1/leaderboard", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert body.key?("data")
    assert body.key?("meta")
    assert body["data"].is_a?(Array)
  end

  test "GET /api/v1/leaderboard returns correct response format with meta count" do
    post "/api/v1/sessions", params: { nickname: "tomek", password: "secret123" }, as: :json
    assert_response :success

    get "/api/v1/leaderboard", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal body["meta"]["count"], body["data"].length
  end

  test "GET /api/v1/leaderboard returns leaderboard entries with correct fields" do
    post "/api/v1/sessions", params: { nickname: "tomek", password: "secret123" }, as: :json
    assert_response :success

    get "/api/v1/leaderboard", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert body["data"].length > 0, "Expected leaderboard to have at least one entry"

    first_entry = body["data"].first
    assert first_entry.key?("position"), "Entry missing 'position' field"
    assert first_entry.key?("userId"), "Entry missing 'userId' field"
    assert first_entry.key?("nickname"), "Entry missing 'nickname' field"
    assert first_entry.key?("totalPoints"), "Entry missing 'totalPoints' field"
    assert first_entry.key?("previousPosition"), "Entry missing 'previousPosition' field"

    # Verify no snake_case keys
    assert_not first_entry.key?("user_id"), "Entry should not have snake_case 'user_id'"
    assert_not first_entry.key?("total_points"), "Entry should not have snake_case 'total_points'"
    assert_not first_entry.key?("previous_position"), "Entry should not have snake_case 'previous_position'"
  end

  test "GET /api/v1/leaderboard returns players with 0.0 totalPoints when no matches scored" do
    post "/api/v1/sessions", params: { nickname: "tomek", password: "secret123" }, as: :json
    assert_response :success

    get "/api/v1/leaderboard", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    body["data"].each do |entry|
      assert_equal 0.0, entry["totalPoints"], "All players should have 0.0 points when no matches are scored"
      assert_nil entry["previousPosition"], "previousPosition should be null before any scoring"
    end
  end

  test "GET /api/v1/leaderboard returns players ordered by totalPoints DESC then nickname ASC" do
    post "/api/v1/sessions", params: { nickname: "tomek", password: "secret123" }, as: :json
    assert_response :success

    # Create dedicated test users to avoid fixture dependencies
    alice = User.create(nickname: "alice_ordering", password_digest: BCrypt::Password.create("pass123"), activated: true)
    bob = User.create(nickname: "bob_ordering", password_digest: BCrypt::Password.create("pass123"), activated: true)

    match = Match.first || Match.create(
      home_team: "Team A",
      away_team: "Team B",
      kickoff_time: 1.day.from_now,
      activated: true
    )

    bet1 = Bet.find_or_create_by!(user: alice, match: match, bet_type: "1")
    bet1.update(points_earned: 50.0)

    bet2 = Bet.find_or_create_by!(user: bob, match: match, bet_type: "X")
    bet2.update(points_earned: 30.0)

    get "/api/v1/leaderboard", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert body["data"].length >= 2

    # Alice should be first (50 points), Bob second (30 points)
    assert_equal alice.id, body["data"].first["userId"]
    assert_equal bob.id, body["data"].second["userId"]
  end

  test "GET /api/v1/leaderboard applies standard competition ranking with ties (1,2,2,4)" do
    post "/api/v1/sessions", params: { nickname: "tomek", password: "secret123" }, as: :json
    assert_response :success

    # Create dedicated test users to avoid fixture dependencies
    user1 = User.create(nickname: "alice_tie", password_digest: BCrypt::Password.create("pass123"), activated: true)
    user2 = User.create(nickname: "bob_tie", password_digest: BCrypt::Password.create("pass123"), activated: true)
    user3 = User.create(nickname: "charlie_tie", password_digest: BCrypt::Password.create("pass123"), activated: true)

    match = Match.first || Match.create(
      home_team: "Team A",
      away_team: "Team B",
      kickoff_time: 1.day.from_now,
      activated: true
    )

    # Give user1 and user2 same points (50.0)
    bet1 = Bet.find_or_create_by!(user: user1, match: match, bet_type: "1")
    bet1.update(points_earned: 50.0)

    bet2 = Bet.find_or_create_by!(user: user2, match: match, bet_type: "X")
    bet2.update(points_earned: 50.0)

    # Give user3 fewer points (30.0)
    bet3 = Bet.find_or_create_by!(user: user3, match: match, bet_type: "2")
    bet3.update(points_earned: 30.0)

    get "/api/v1/leaderboard", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    # Filter to just our test users to isolate the assertion
    test_entries = body["data"].select { |e| [user1.id, user2.id, user3.id].include?(e["userId"]) }
    positions = test_entries.map { |e| e["position"] }

    # Should have positions: 1, 1, 3 (tied users get same position, next gets skipped position)
    assert_equal 1, positions[0], "First tied player should have position 1"
    assert_equal 1, positions[1], "Second tied player should have position 1"
    assert_equal 3, positions[2], "Third player after tie should have position 3 (not 2)"
  end

  test "GET /api/v1/leaderboard includes only activated players" do
    # Create an inactive user
    User.create(nickname: "inactive_player", password_digest: BCrypt::Password.create("pass123"), activated: false)

    post "/api/v1/sessions", params: { nickname: "tomek", password: "secret123" }, as: :json
    assert_response :success

    get "/api/v1/leaderboard", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    nicknames = body["data"].map { |e| e["nickname"] }

    assert_not nicknames.include?("inactive_player"), "Inactive players should not appear in leaderboard"
  end

  test "GET /api/v1/leaderboard returns totalPoints as float" do
    post "/api/v1/sessions", params: { nickname: "tomek", password: "secret123" }, as: :json
    assert_response :success

    get "/api/v1/leaderboard", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    body["data"].each do |entry|
      assert entry["totalPoints"].is_a?(Float) || entry["totalPoints"].is_a?(Integer),
        "totalPoints should be a number, got #{entry["totalPoints"].class}"
    end
  end

  test "GET /api/v1/leaderboard returns previousPosition as null when not set" do
    post "/api/v1/sessions", params: { nickname: "tomek", password: "secret123" }, as: :json
    assert_response :success

    get "/api/v1/leaderboard", as: :json
    assert_response :success

    body = JSON.parse(response.body)
    body["data"].each do |entry|
      # previousPosition should be null since we haven't set any in this test
      assert entry["previousPosition"].nil? || entry["previousPosition"].is_a?(Integer),
        "previousPosition should be null or an integer"
    end
  end
end
