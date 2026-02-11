require "test_helper"

class Api::V1::BetsControllerTest < ActionDispatch::IntegrationTest
  setup do
    # Log in as player before each test
    post api_v1_sessions_url, params: { nickname: "tomek", password: "secret123" }, as: :json
    assert_response :success
  end

  test "POST /api/v1/bets creates a bet on open match" do
    match = matches(:with_odds)
    initial_bet_count = Bet.count
    post api_v1_bets_url, params: { match_id: match.id, bet_type: "1" }, as: :json
    assert_response :created
    assert_equal initial_bet_count + 1, Bet.count
    body = JSON.parse(response.body)
    assert_equal "1", body["data"]["betType"]
    assert_equal match.id, body["data"]["matchId"]
    assert body["data"].key?("id")
    assert body["data"].key?("userId")
    assert body["data"].key?("pointsEarned")
  end

  test "POST /api/v1/bets on locked match returns 403 BET_LOCKED" do
    match = matches(:locked)
    post api_v1_bets_url, params: { match_id: match.id, bet_type: "1" }, as: :json
    assert_response :forbidden
    body = JSON.parse(response.body)
    assert_equal "BET_LOCKED", body["error"]["code"]
    assert_equal "Match has started", body["error"]["message"]
  end

  test "POST /api/v1/bets on match without odds succeeds" do
    # Create a new match without odds to avoid fixture conflicts
    match = Match.create!(home_team: "NewTeam1", away_team: "NewTeam2", kickoff_time: 2.days.from_now, group_label: "TestGroup")
    assert_nil match.odds_home
    post api_v1_bets_url, params: { match_id: match.id, bet_type: "1X" }, as: :json
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal "1X", body["data"]["betType"]
  end

  test "POST /api/v1/bets unauthenticated returns 401" do
    delete api_v1_sessions_url, as: :json
    match = matches(:upcoming)
    post api_v1_bets_url, params: { match_id: match.id, bet_type: "1" }, as: :json
    assert_response :unauthorized
  end

  test "POST /api/v1/bets with invalid bet_type returns 422" do
    # Create a new match to avoid fixture conflicts
    match = Match.create!(home_team: "Team3", away_team: "Team4", kickoff_time: 3.days.from_now, group_label: "TestGroup2")
    post api_v1_bets_url, params: { match_id: match.id, bet_type: "invalid" }, as: :json
    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert_equal "VALIDATION_ERROR", body["error"]["code"]
  end

  test "PUT /api/v1/bets/:id updates bet_type by owner" do
    bet = bets(:player_bet_on_upcoming)
    put api_v1_bet_url(bet), params: { bet_type: "X" }, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal "X", body["data"]["betType"]
    assert_equal bet.id, body["data"]["id"]
    bet.reload
    assert_equal "X", bet.bet_type
  end

  test "PUT /api/v1/bets/:id by non-owner returns 403 FORBIDDEN" do
    # Admin tries to update player's bet
    delete api_v1_sessions_url, as: :json
    post api_v1_sessions_url, params: { nickname: "admin", password: "secret123" }, as: :json
    assert_response :success

    bet = bets(:player_bet_on_upcoming)
    put api_v1_bet_url(bet), params: { bet_type: "X" }, as: :json
    assert_response :forbidden
    body = JSON.parse(response.body)
    assert_equal "FORBIDDEN", body["error"]["code"]
  end

  test "PUT /api/v1/bets/:id on locked match returns 403 BET_LOCKED" do
    bet = bets(:player_bet_on_locked)
    put api_v1_bet_url(bet), params: { bet_type: "1" }, as: :json
    assert_response :forbidden
    body = JSON.parse(response.body)
    assert_equal "BET_LOCKED", body["error"]["code"]
  end

  test "DELETE /api/v1/bets/:id destroys bet by owner" do
    bet = bets(:player_bet_on_upcoming)
    initial_bet_count = Bet.count
    delete api_v1_bet_url(bet), as: :json
    assert_response :no_content
    assert_equal initial_bet_count - 1, Bet.count
  end

  test "DELETE /api/v1/bets/:id by non-owner returns 403 FORBIDDEN" do
    # Player is already logged in, admin_bet_on_upcoming is owned by admin
    # So player trying to delete admin's bet should fail
    bet = bets(:admin_bet_on_upcoming)
    delete api_v1_bet_url(bet), as: :json
    assert_response :forbidden
    body = JSON.parse(response.body)
    assert_equal "FORBIDDEN", body["error"]["code"]
  end

  test "DELETE /api/v1/bets/:id on locked match returns 403 BET_LOCKED" do
    bet = bets(:player_bet_on_locked)
    delete api_v1_bet_url(bet), as: :json
    assert_response :forbidden
    body = JSON.parse(response.body)
    assert_equal "BET_LOCKED", body["error"]["code"]
  end

  test "POST /api/v1/bets with nonexistent match returns 404" do
    post api_v1_bets_url, params: { match_id: 99999, bet_type: "1" }, as: :json
    assert_response :not_found
    body = JSON.parse(response.body)
    assert_equal "NOT_FOUND", body["error"]["code"]
  end

  test "PUT /api/v1/bets with nonexistent bet returns 404" do
    put api_v1_bet_url(99999), params: { bet_type: "1" }, as: :json
    assert_response :not_found
    body = JSON.parse(response.body)
    assert_equal "NOT_FOUND", body["error"]["code"]
  end

  test "POST /api/v1/bets duplicate user and match returns 422" do
    # First create a bet
    bet = bets(:player_bet_on_upcoming)
    match = bet.match

    # Try to create another bet on same match - should fail
    post api_v1_bets_url, params: { match_id: match.id, bet_type: "X" }, as: :json
    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert_equal "VALIDATION_ERROR", body["error"]["code"]
  end

  # GET /api/v1/bets tests
  test "GET /api/v1/bets returns current user bets only" do
    get api_v1_bets_url, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert body["data"].is_a?(Array)
    assert body.key?("meta")
    assert body["meta"].key?("count")
    # Should only contain bets for the logged-in user (tomek/player)
    body["data"].each do |bet|
      assert_equal users(:player).id, bet["userId"]
    end
  end

  test "GET /api/v1/bets unauthenticated returns 401" do
    delete api_v1_sessions_url, as: :json
    get api_v1_bets_url, as: :json
    assert_response :unauthorized
  end
end
