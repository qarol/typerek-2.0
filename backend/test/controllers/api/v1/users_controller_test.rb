require "test_helper"

class Api::V1::UsersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @inactive_user = users(:inactive)
  end

  # --- verify_token tests ---

  test "verify_token with valid token returns nickname" do
    token = @inactive_user.generate_token_for(:invite)

    get verify_token_api_v1_users_url, params: { token: token }

    assert_response :success
    json = JSON.parse(@response.body)
    assert_equal "newuser", json["data"]["nickname"]
  end

  test "verify_token with invalid token returns 422" do
    get verify_token_api_v1_users_url, params: { token: "invalid-token" }

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)
    assert_equal "INVALID_TOKEN", json["error"]["code"]
  end

  test "verify_token with expired token returns 422" do
    token = @inactive_user.generate_token_for(:invite)

    travel 73.hours do
      get verify_token_api_v1_users_url, params: { token: token }

      assert_response :unprocessable_entity
      json = JSON.parse(@response.body)
      assert_equal "INVALID_TOKEN", json["error"]["code"]
    end
  end

  test "verify_token with already-activated user returns ALREADY_ACTIVATED" do
    activated_user = users(:admin)
    token = activated_user.generate_token_for(:invite)

    get verify_token_api_v1_users_url, params: { token: token }

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)
    assert_equal "ALREADY_ACTIVATED", json["error"]["code"]
  end

  test "verify_token with missing token returns 422" do
    get verify_token_api_v1_users_url

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)
    assert_equal "INVALID_TOKEN", json["error"]["code"]
  end

  # --- activate tests ---

  test "activate with valid token, password sets password, activates user, creates session" do
    token = @inactive_user.generate_token_for(:invite)

    post activate_api_v1_users_url, params: {
      token: token,
      password: "newpassword123",
      passwordConfirmation: "newpassword123"
    }

    assert_response :success
    json = JSON.parse(@response.body)

    # Verify response data
    assert_equal @inactive_user.id, json["data"]["id"]
    assert_equal "newuser", json["data"]["nickname"]

    # Verify user was activated
    @inactive_user.reload
    assert @inactive_user.activated
    assert @inactive_user.authenticate("newpassword123")

    # Verify session was created (user auto-logged in)
    assert_not_nil session[:user_id]
    assert_equal @inactive_user.id, session[:user_id]
  end

  test "activate with expired token returns 422 with INVALID_TOKEN" do
    token = @inactive_user.generate_token_for(:invite)

    # Simulate token expiry
    travel 73.hours do
      post activate_api_v1_users_url, params: {
        token: token,
        password: "newpassword123",
        passwordConfirmation: "newpassword123"
      }

      assert_response :unprocessable_entity
      json = JSON.parse(@response.body)

      assert_equal "INVALID_TOKEN", json["error"]["code"]
      assert_equal "Invalid or expired invite link. Contact your group admin.", json["error"]["message"]
      assert_equal "token", json["error"]["field"]

      # Verify user not activated
      @inactive_user.reload
      assert_not @inactive_user.activated
    end
  end

  test "activate with invalid token returns 422 with INVALID_TOKEN" do
    post activate_api_v1_users_url, params: {
      token: "invalid-token-xyz",
      password: "newpassword123",
      passwordConfirmation: "newpassword123"
    }

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)

    assert_equal "INVALID_TOKEN", json["error"]["code"]
    assert_equal "Invalid or expired invite link. Contact your group admin.", json["error"]["message"]
    assert_equal "token", json["error"]["field"]
  end

  test "activate with already-activated user returns 422 with ALREADY_ACTIVATED" do
    activated_user = users(:admin)
    token = activated_user.generate_token_for(:invite)

    # Token is immediately invalid because user is already activated
    post activate_api_v1_users_url, params: {
      token: token,
      password: "newpassword123",
      passwordConfirmation: "newpassword123"
    }

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)

    assert_equal "ALREADY_ACTIVATED", json["error"]["code"]
    assert_equal "Account already activated", json["error"]["message"]
    assert_equal "token", json["error"]["field"]
  end

  test "activate with password too short returns validation error" do
    token = @inactive_user.generate_token_for(:invite)

    post activate_api_v1_users_url, params: {
      token: token,
      password: "short",
      passwordConfirmation: "short"
    }

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)

    assert_equal "VALIDATION_ERROR", json["error"]["code"]
    assert json["error"]["message"].include?("Password")
    assert json["error"]["message"].include?("too short")
  end

  test "activate with password confirmation mismatch returns validation error" do
    token = @inactive_user.generate_token_for(:invite)

    post activate_api_v1_users_url, params: {
      token: token,
      password: "password123",
      passwordConfirmation: "different123"
    }

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)

    assert_equal "VALIDATION_ERROR", json["error"]["code"]
    assert json["error"]["message"].include?("Password confirmation")
  end

  test "activate with missing password returns validation error" do
    token = @inactive_user.generate_token_for(:invite)

    post activate_api_v1_users_url, params: {
      token: token,
      passwordConfirmation: "password123"
    }

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)

    assert_equal "VALIDATION_ERROR", json["error"]["code"]
  end

  test "activate with missing token returns validation error" do
    post activate_api_v1_users_url, params: {
      password: "password123",
      passwordConfirmation: "password123"
    }

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)

    assert_equal "INVALID_TOKEN", json["error"]["code"]
  end

  # --- history tests ---

  def sign_in_as(nickname, password)
    post "/api/v1/sessions", params: { nickname: nickname, password: password }, as: :json
    assert_response :success
  end

  test "GET /api/v1/users/:id/history returns 401 without session" do
    user = User.create!(nickname: "hist_unauth_#{SecureRandom.hex(4)}", password: "pass123456", password_confirmation: "pass123456")
    get "/api/v1/users/#{user.id}/history", as: :json
    assert_response :unauthorized
    json = JSON.parse(response.body)
    assert_equal "UNAUTHORIZED", json["error"]["code"]
  end

  test "GET /api/v1/users/:id/history returns 404 when user not found" do
    requester = User.create!(nickname: "hist_404_#{SecureRandom.hex(4)}", password: "pass123456", password_confirmation: "pass123456", activated: true)
    sign_in_as(requester.nickname, "pass123456")

    get "/api/v1/users/999999/history", as: :json
    assert_response :not_found
    json = JSON.parse(response.body)
    assert_equal "NOT_FOUND", json["error"]["code"]
  end

  test "GET /api/v1/users/:id/history returns all matches including unbetted ones" do
    player = User.create!(nickname: "hist_player1", password_digest: BCrypt::Password.create("pass123"), activated: true)
    sign_in_as("hist_player1", "pass123")
    match1 = Match.create!(home_team: "Alpha", away_team: "Beta", kickoff_time: 2.days.ago)
    match2 = Match.create!(home_team: "Gamma", away_team: "Delta", kickoff_time: 1.day.ago)

    # Only bet on match1, not match2
    Bet.create!(user: player, match: match1, bet_type: "1", points_earned: 3.5)

    get "/api/v1/users/#{player.id}/history", as: :json
    assert_response :success

    json = JSON.parse(response.body)
    assert json.key?("data")
    assert json.key?("meta")

    data = json["data"]
    match_ids = data.map { |e| e["matchId"] }
    assert_includes match_ids, match1.id
    assert_includes match_ids, match2.id

    bet_entry = data.find { |e| e["matchId"] == match1.id }
    assert_equal "1", bet_entry["betType"]
    assert_equal 3.5, bet_entry["pointsEarned"]

    no_bet_entry = data.find { |e| e["matchId"] == match2.id }
    assert_nil no_bet_entry["betType"]
    assert_equal 0.0, no_bet_entry["pointsEarned"]

    assert_equal data.length, json["meta"]["count"]
  end

  test "GET /api/v1/users/:id/history returns correct field for scored matches" do
    player = User.create!(nickname: "hist_player2", password_digest: BCrypt::Password.create("pass123"), activated: true)
    sign_in_as("hist_player2", "pass123")

    # Unscored match
    unscored = Match.create!(home_team: "A", away_team: "B", kickoff_time: 3.days.ago)
    # Scored match - correct bet
    scored_win = Match.create!(home_team: "C", away_team: "D", kickoff_time: 2.days.ago, home_score: 2, away_score: 1)
    # Scored match - wrong bet
    scored_loss = Match.create!(home_team: "E", away_team: "F", kickoff_time: 1.day.ago, home_score: 0, away_score: 0)

    Bet.create!(user: player, match: unscored, bet_type: "1", points_earned: 0.0)
    Bet.create!(user: player, match: scored_win, bet_type: "1", points_earned: 2.5)
    Bet.create!(user: player, match: scored_loss, bet_type: "1", points_earned: 0.0)

    get "/api/v1/users/#{player.id}/history", as: :json
    assert_response :success

    data = JSON.parse(response.body)["data"]

    unscored_entry = data.find { |e| e["matchId"] == unscored.id }
    assert_nil unscored_entry["correct"], "Unscored match should have correct: null"

    win_entry = data.find { |e| e["matchId"] == scored_win.id }
    assert_equal true, win_entry["correct"], "Correct bet should have correct: true"

    loss_entry = data.find { |e| e["matchId"] == scored_loss.id }
    assert_equal false, loss_entry["correct"], "Wrong bet should have correct: false"
  end

  test "GET /api/v1/users/:id/history returns missed as correct false when match scored and no bet" do
    player = User.create!(nickname: "hist_player3", password_digest: BCrypt::Password.create("pass123"), activated: true)
    sign_in_as("hist_player3", "pass123")
    scored_match = Match.create!(home_team: "G", away_team: "H", kickoff_time: 2.days.ago, home_score: 1, away_score: 1)

    # No bet placed

    get "/api/v1/users/#{player.id}/history", as: :json
    assert_response :success

    data = JSON.parse(response.body)["data"]
    entry = data.find { |e| e["matchId"] == scored_match.id }
    assert_not_nil entry
    assert_nil entry["betType"]
    assert_equal 0.0, entry["pointsEarned"]
    assert_equal false, entry["correct"]
  end

  test "GET /api/v1/users/:id/history returns correct null when match not scored and no bet placed" do
    nickname = "hist_player5_#{SecureRandom.hex(4)}"
    player = User.create!(nickname: nickname, password: "pass123456", password_confirmation: "pass123456", activated: true)
    sign_in_as(nickname, "pass123456")
    unscored_match = Match.create!(home_team: "I", away_team: "J", kickoff_time: 1.day.ago)

    # No bet placed, match not scored

    get "/api/v1/users/#{player.id}/history", as: :json
    assert_response :success

    data = JSON.parse(response.body)["data"]
    entry = data.find { |e| e["matchId"] == unscored_match.id }
    assert_not_nil entry
    assert_nil entry["betType"]
    assert_nil entry["correct"], "No bet + unscored match should have correct: null"
    assert_equal 0.0, entry["pointsEarned"]
  end

  test "GET /api/v1/users/:id/history returns entries sorted by kickoff_time desc" do
    player = User.create!(nickname: "hist_player4", password_digest: BCrypt::Password.create("pass123"), activated: true)
    sign_in_as("hist_player4", "pass123")
    match_old = Match.create!(home_team: "Old1", away_team: "Old2", kickoff_time: 5.days.ago)
    match_mid = Match.create!(home_team: "Mid1", away_team: "Mid2", kickoff_time: 3.days.ago)
    match_new = Match.create!(home_team: "New1", away_team: "New2", kickoff_time: 1.day.ago)

    get "/api/v1/users/#{player.id}/history", as: :json
    assert_response :success

    data = JSON.parse(response.body)["data"]
    match_positions = [ match_new.id, match_mid.id, match_old.id ].map do |id|
      data.index { |e| e["matchId"] == id }
    end.compact

    assert_equal match_positions, match_positions.sort, "Matches should be sorted most recent first"
  end

  test "token is single-use - second activation attempt fails" do
    token = @inactive_user.generate_token_for(:invite)

    # First activation succeeds
    post activate_api_v1_users_url, params: {
      token: token,
      password: "newpassword123",
      passwordConfirmation: "newpassword123"
    }
    assert_response :success

    # Second activation with same token fails (token becomes invalid when user activates)
    post activate_api_v1_users_url, params: {
      token: token,
      password: "anotherpassword",
      passwordConfirmation: "anotherpassword"
    }

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)

    # Token is invalidated when activated changes, so we get INVALID_TOKEN
    assert_equal "INVALID_TOKEN", json["error"]["code"]
  end
end
