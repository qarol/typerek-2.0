require "test_helper"

class Api::V1::MatchBetsControllerTest < ActionDispatch::IntegrationTest
  setup do
    # Log in as player before each test
    post api_v1_sessions_url, params: { nickname: "tomek", password: "password" }, as: :json
    assert_response :success
  end

  # Before kickoff tests
  test "GET /api/v1/matches/:id/bets before kickoff returns only own bet" do
    match = matches(:upcoming)
    get api_v1_match_bets_url(match), as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body["data"].length
    assert_equal bets(:player_bet_on_upcoming).id, body["data"][0]["id"]
    assert_equal "tomek", body["data"][0]["nickname"]
  end

  # After kickoff tests
  test "GET /api/v1/matches/:id/bets after kickoff returns all bets" do
    match = matches(:locked)
    get api_v1_match_bets_url(match), as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 2, body["data"].length
    bet_ids = body["data"].map { |b| b["id"] }
    assert_includes bet_ids, bets(:player_bet_on_locked).id
    assert_includes bet_ids, bets(:admin_bet_on_locked).id
  end

  test "GET /api/v1/matches/:id/bets after kickoff includes nickname field" do
    match = matches(:locked)
    get api_v1_match_bets_url(match), as: :json
    assert_response :success
    body = JSON.parse(response.body)
    body["data"].each do |bet|
      assert bet.key?("nickname")
      assert ["tomek", "admin"].include?(bet["nickname"])
    end
  end

  test "GET /api/v1/matches/:id/bets after kickoff includes allPlayers in meta" do
    match = matches(:locked)
    get api_v1_match_bets_url(match), as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert body["meta"].key?("allPlayers")
    assert body["meta"]["allPlayers"].is_a?(Array)
    assert body["meta"]["allPlayers"].include?("admin")
    assert body["meta"]["allPlayers"].include?("tomek")
  end

  test "GET /api/v1/matches/:id/bets with no bets returns empty" do
    match = matches(:with_odds)
    get api_v1_match_bets_url(match), as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 0, body["data"].length
    assert_equal 0, body["meta"]["count"]
  end

  test "GET /api/v1/matches/:id/bets before kickoff does NOT include allPlayers" do
    match = matches(:upcoming)
    get api_v1_match_bets_url(match), as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_not body["meta"].key?("allPlayers")
  end

  test "GET /api/v1/matches/:id/bets unauthenticated returns 401" do
    delete api_v1_sessions_url, as: :json
    match = matches(:upcoming)
    get api_v1_match_bets_url(match), as: :json
    assert_response :unauthorized
  end

  test "GET /api/v1/matches/:id/bets invalid match returns 404" do
    get api_v1_match_bets_url(99999), as: :json
    assert_response :not_found
    body = JSON.parse(response.body)
    assert_equal "NOT_FOUND", body["error"]["code"]
    assert_equal "Match not found", body["error"]["message"]
  end

  test "GET /api/v1/matches/:id/bets response includes all required fields" do
    match = matches(:locked)
    get api_v1_match_bets_url(match), as: :json
    assert_response :success
    body = JSON.parse(response.body)
    body["data"].each do |bet|
      assert bet.key?("id")
      assert bet.key?("userId")
      assert bet.key?("matchId")
      assert bet.key?("betType")
      assert bet.key?("pointsEarned")
      assert bet.key?("nickname")
    end
  end
end
