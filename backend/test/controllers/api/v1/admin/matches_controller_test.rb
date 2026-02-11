require "test_helper"

module Api
  module V1
    module Admin
      class MatchesControllerTest < ActionDispatch::IntegrationTest
        fixtures :users, :matches

        # Admin can update odds
        test "PUT /api/v1/admin/matches/:id updates odds" do
          post api_v1_sessions_url, params: { nickname: "admin", password: "password" }
          assert_response :success

          match = matches(:upcoming)
          assert_nil match.odds_home

          put api_v1_admin_match_url(match.id), params: {
            oddsHome: 2.10,
            oddsDraw: 3.45,
            oddsAway: 4.00,
            oddsHomeDraw: 1.25,
            oddsDrawAway: 1.80,
            oddsHomeAway: 1.50
          }, as: :json

          assert_response :success

          body = JSON.parse(@response.body)
          assert body["data"]
          assert_equal 2.10, body["data"]["oddsHome"]
          assert_equal 3.45, body["data"]["oddsDraw"]
          assert_equal 4.00, body["data"]["oddsAway"]
          assert_equal 1.25, body["data"]["oddsHomeDraw"]
          assert_equal 1.80, body["data"]["oddsDrawAway"]
          assert_equal 1.50, body["data"]["oddsHomeAway"]

          # Verify database update
          match.reload
          assert_equal 2.10, match.odds_home
        end

        # Non-admin gets 403
        test "PUT /api/v1/admin/matches/:id as non-admin returns 403" do
          post api_v1_sessions_url, params: { nickname: "tomek", password: "password" }
          assert_response :success

          match = matches(:upcoming)

          put api_v1_admin_match_url(match.id), params: {
            oddsHome: 2.10,
            oddsDraw: 3.45,
            oddsAway: 4.00,
            oddsHomeDraw: 1.25,
            oddsDrawAway: 1.80,
            oddsHomeAway: 1.50
          }, as: :json

          assert_response :forbidden

          body = JSON.parse(@response.body)
          assert_equal "FORBIDDEN", body["error"]["code"]
        end

        # Unauthenticated gets 401
        test "PUT /api/v1/admin/matches/:id unauthenticated returns 401" do
          match = matches(:upcoming)

          put api_v1_admin_match_url(match.id), params: {
            oddsHome: 2.10,
            oddsDraw: 3.45,
            oddsAway: 4.00,
            oddsHomeDraw: 1.25,
            oddsDrawAway: 1.80,
            oddsHomeAway: 1.50
          }, as: :json

          assert_response :unauthorized

          body = JSON.parse(@response.body)
          assert_equal "UNAUTHORIZED", body["error"]["code"]
        end

        # Invalid odds (< 1.00) returns validation error
        test "PUT /api/v1/admin/matches/:id with invalid odds returns 422" do
          post api_v1_sessions_url, params: { nickname: "admin", password: "password" }
          assert_response :success

          match = matches(:upcoming)

          put api_v1_admin_match_url(match.id), params: {
            oddsHome: 0.99,
            oddsDraw: 3.45,
            oddsAway: 4.00,
            oddsHomeDraw: 1.25,
            oddsDrawAway: 1.80,
            oddsHomeAway: 1.50
          }, as: :json

          assert_response :unprocessable_entity

          body = JSON.parse(@response.body)
          assert_equal "VALIDATION_ERROR", body["error"]["code"]
          assert body["error"]["message"]
          assert_equal "oddsHome", body["error"]["field"]
        end

        # Match not found returns 404
        test "PUT /api/v1/admin/matches/:id with invalid id returns 404" do
          post api_v1_sessions_url, params: { nickname: "admin", password: "password" }
          assert_response :success

          put api_v1_admin_match_url(99999), params: {
            oddsHome: 2.10,
            oddsDraw: 3.45,
            oddsAway: 4.00,
            oddsHomeDraw: 1.25,
            oddsDrawAway: 1.80,
            oddsHomeAway: 1.50
          }, as: :json

          assert_response :not_found

          body = JSON.parse(@response.body)
          assert_equal "NOT_FOUND", body["error"]["code"]
        end

        # Partial update (only some odds) works
        test "PUT /api/v1/admin/matches/:id with partial odds updates provided fields" do
          post api_v1_sessions_url, params: { nickname: "admin", password: "password" }
          assert_response :success

          match = matches(:upcoming)

          put api_v1_admin_match_url(match.id), params: {
            oddsHome: 2.10,
            oddsDraw: 3.45
          }, as: :json

          assert_response :success

          body = JSON.parse(@response.body)
          assert_equal 2.10, body["data"]["oddsHome"]
          assert_equal 3.45, body["data"]["oddsDraw"]
          assert_nil body["data"]["oddsAway"]

          # Verify database update
          match.reload
          assert_equal 2.10, match.odds_home
          assert_equal 3.45, match.odds_draw
          assert_nil match.odds_away
        end

        # camelCase params accepted
        test "PUT /api/v1/admin/matches/:id accepts camelCase params" do
          post api_v1_sessions_url, params: { nickname: "admin", password: "password" }
          assert_response :success

          match = matches(:upcoming)

          put api_v1_admin_match_url(match.id), params: {
            oddsHome: 2.10,
            oddsDraw: 3.45,
            oddsAway: 4.00,
            oddsHomeDraw: 1.25,
            oddsDrawAway: 1.80,
            oddsHomeAway: 1.50
          }, as: :json

          assert_response :success

          body = JSON.parse(@response.body)
          assert_equal 2.10, body["data"]["oddsHome"]
          assert body["data"].key?("oddsDraw")
          assert_not body["data"].key?("odds_draw")
        end

        # ===== SCORE ACTION TESTS =====

        # Admin can score a match and calculate points
        test "POST /api/v1/admin/matches/:id/score saves score and calculates points" do
          post api_v1_sessions_url, params: { nickname: "admin", password: "password" }
          assert_response :success

          match = matches(:with_odds)
          assert_nil match.home_score
          assert_nil match.away_score

          post score_api_v1_admin_match_url(match.id), params: {
            homeScore: 2,
            awayScore: 1
          }, as: :json

          assert_response :success

          body = JSON.parse(@response.body)
          assert body["data"]
          assert_equal 2, body["data"]["homeScore"]
          assert_equal 1, body["data"]["awayScore"]
          assert body["meta"]
          assert body["meta"]["playersScored"]

          # Verify database update
          match.reload
          assert_equal 2, match.home_score
          assert_equal 1, match.away_score
        end

        # Non-admin gets 403
        test "POST /api/v1/admin/matches/:id/score as non-admin returns 403" do
          post api_v1_sessions_url, params: { nickname: "tomek", password: "password" }
          assert_response :success

          match = matches(:with_odds)

          post score_api_v1_admin_match_url(match.id), params: {
            homeScore: 2,
            awayScore: 1
          }, as: :json

          assert_response :forbidden

          body = JSON.parse(@response.body)
          assert_equal "FORBIDDEN", body["error"]["code"]
        end

        # Unauthenticated gets 401
        test "POST /api/v1/admin/matches/:id/score unauthenticated returns 401" do
          match = matches(:with_odds)

          post score_api_v1_admin_match_url(match.id), params: {
            homeScore: 2,
            awayScore: 1
          }, as: :json

          assert_response :unauthorized

          body = JSON.parse(@response.body)
          assert_equal "UNAUTHORIZED", body["error"]["code"]
        end

        # Already scored match returns SCORE_LOCKED
        test "POST /api/v1/admin/matches/:id/score on already scored match returns SCORE_LOCKED" do
          post api_v1_sessions_url, params: { nickname: "admin", password: "password" }
          assert_response :success

          match = matches(:scored)  # This fixture has scores already
          assert_not_nil match.home_score
          assert_not_nil match.away_score

          post score_api_v1_admin_match_url(match.id), params: {
            homeScore: 3,
            awayScore: 0
          }, as: :json

          assert_response :unprocessable_entity

          body = JSON.parse(@response.body)
          assert_equal "SCORE_LOCKED", body["error"]["code"]
          assert_equal "Results already calculated", body["error"]["message"]
        end

        # Missing scores returns validation error
        test "POST /api/v1/admin/matches/:id/score with missing scores returns 422" do
          post api_v1_sessions_url, params: { nickname: "admin", password: "password" }
          assert_response :success

          match = matches(:with_odds)

          post score_api_v1_admin_match_url(match.id), params: {
            homeScore: 2
          }, as: :json

          assert_response :unprocessable_entity

          body = JSON.parse(@response.body)
          assert_equal "VALIDATION_ERROR", body["error"]["code"]
          assert_equal "Both scores are required", body["error"]["message"]
        end

        # Accepts camelCase params
        test "POST /api/v1/admin/matches/:id/score accepts camelCase params" do
          post api_v1_sessions_url, params: { nickname: "admin", password: "password" }
          assert_response :success

          match = matches(:with_odds)

          post score_api_v1_admin_match_url(match.id), params: {
            homeScore: 2,
            awayScore: 1
          }, as: :json

          assert_response :success

          body = JSON.parse(@response.body)
          assert_equal 2, body["data"]["homeScore"]
          assert_equal 1, body["data"]["awayScore"]
        end

        # Wraps in transaction (both score and points calculation succeed or both fail)
        test "POST /api/v1/admin/matches/:id/score wraps in transaction" do
          post api_v1_sessions_url, params: { nickname: "admin", password: "password" }
          assert_response :success

          match = matches(:with_odds)

          # Create a bet on the match to verify points are calculated
          user = users(:player)
          bet = Bet.create!(user: user, match: match, bet_type: "1")

          post score_api_v1_admin_match_url(match.id), params: {
            homeScore: 2,
            awayScore: 1
          }, as: :json

          assert_response :success

          # Verify both score and points were saved
          match.reload
          assert_equal 2, match.home_score
          assert_equal 1, match.away_score

          bet.reload
          assert_not_equal 0, bet.points_earned  # Bet "1" wins (home win 2-1)
        end

        # Match not found returns 404
        test "POST /api/v1/admin/matches/:id/score with invalid id returns 404" do
          post api_v1_sessions_url, params: { nickname: "admin", password: "password" }
          assert_response :success

          post score_api_v1_admin_match_url(99999), params: {
            homeScore: 2,
            awayScore: 1
          }, as: :json

          assert_response :not_found

          body = JSON.parse(@response.body)
          assert_equal "NOT_FOUND", body["error"]["code"]
        end

        # Score 0-0 (draw with all zeros) works correctly
        test "POST /api/v1/admin/matches/:id/score with 0-0 score saves correctly" do
          post api_v1_sessions_url, params: { nickname: "admin", password: "password" }
          assert_response :success

          match = matches(:with_odds)

          post score_api_v1_admin_match_url(match.id), params: {
            homeScore: 0,
            awayScore: 0
          }, as: :json

          assert_response :success

          body = JSON.parse(@response.body)
          assert_equal 0, body["data"]["homeScore"]
          assert_equal 0, body["data"]["awayScore"]

          # Verify database update
          match.reload
          assert_equal 0, match.home_score
          assert_equal 0, match.away_score
        end

        # Invalid scores (non-numeric) return validation error
        test "POST /api/v1/admin/matches/:id/score with non-numeric scores returns 422" do
          post api_v1_sessions_url, params: { nickname: "admin", password: "password" }
          assert_response :success

          match = matches(:with_odds)

          post score_api_v1_admin_match_url(match.id), params: {
            homeScore: "abc",
            awayScore: "2"
          }, as: :json

          assert_response :unprocessable_entity

          body = JSON.parse(@response.body)
          assert_equal "VALIDATION_ERROR", body["error"]["code"]
        end

        # Backend allows scoring even before kickoff (frontend filters, backend doesn't enforce)
        test "POST /api/v1/admin/matches/:id/score on future match succeeds (no kickoff guard)" do
          post api_v1_sessions_url, params: { nickname: "admin", password: "password" }
          assert_response :success

          match = matches(:upcoming)  # This fixture has kickoff in the future

          post score_api_v1_admin_match_url(match.id), params: {
            homeScore: 1,
            awayScore: 0
          }, as: :json

          assert_response :success

          # Backend allows this; frontend is responsible for filtering to locked matches only
          body = JSON.parse(@response.body)
          assert_equal 1, body["data"]["homeScore"]
          assert_equal 0, body["data"]["awayScore"]
        end
      end
    end
  end
end
