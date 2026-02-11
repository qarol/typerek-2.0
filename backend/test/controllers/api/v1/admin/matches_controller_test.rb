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
      end
    end
  end
end
