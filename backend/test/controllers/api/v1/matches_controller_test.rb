require "test_helper"

class Api::V1::MatchesControllerTest < ActionDispatch::IntegrationTest
  test "GET /api/v1/matches returns all matches for authenticated admin" do
    post api_v1_sessions_url, params: { nickname: "admin", password: "secret123" }, as: :json
    assert_response :success

    get api_v1_matches_url, as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert body["data"].is_a?(Array)
    assert_equal Match.count, body["data"].length
  end

  test "GET /api/v1/matches returns all matches for authenticated player" do
    # Uses 'tomek' fixture from users.yml (created in Story 1.4)
    post api_v1_sessions_url, params: { nickname: "tomek", password: "secret123" }, as: :json
    assert_response :success

    get api_v1_matches_url, as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert body["data"].is_a?(Array)
    assert_equal Match.count, body["data"].length
  end

  test "GET /api/v1/matches returns 401 for unauthenticated user" do
    get api_v1_matches_url, as: :json
    assert_response :unauthorized

    body = JSON.parse(response.body)
    assert_equal "UNAUTHORIZED", body["error"]["code"]
  end

  test "GET /api/v1/matches returns correct response format" do
    post api_v1_sessions_url, params: { nickname: "admin", password: "secret123" }, as: :json
    assert_response :success

    get api_v1_matches_url, as: :json
    assert_response :success

    body = JSON.parse(response.body)
    assert body.key?("data")
    assert body.key?("meta")
    assert_equal Match.count, body["meta"]["count"]
  end

  test "GET /api/v1/matches returns matches ordered by kickoff_time ASC" do
    post api_v1_sessions_url, params: { nickname: "admin", password: "secret123" }, as: :json
    assert_response :success

    get api_v1_matches_url, as: :json
    assert_response :success

    body = JSON.parse(response.body)
    kickoff_times = body["data"].map { |m| m["kickoffTime"] }
    assert_equal kickoff_times.sort, kickoff_times
  end

  test "GET /api/v1/matches returns camelCase field names" do
    post api_v1_sessions_url, params: { nickname: "admin", password: "secret123" }, as: :json
    assert_response :success

    get api_v1_matches_url, as: :json
    assert_response :success

    body = JSON.parse(response.body)
    first_match = body["data"].first

    expected_keys = %w[id homeTeam awayTeam kickoffTime groupLabel homeScore awayScore oddsHome oddsDraw oddsAway oddsHomeDraw oddsDrawAway oddsHomeAway]
    expected_keys.each do |key|
      assert first_match.key?(key), "Expected key '#{key}' in response but got keys: #{first_match.keys}"
    end

    # Verify no snake_case keys
    assert_not first_match.key?("home_team")
    assert_not first_match.key?("away_team")
    assert_not first_match.key?("kickoff_time")
  end

  test "GET /api/v1/matches returns kickoff_time in ISO 8601 UTC format" do
    post api_v1_sessions_url, params: { nickname: "admin", password: "secret123" }, as: :json
    assert_response :success

    get api_v1_matches_url, as: :json
    assert_response :success

    body = JSON.parse(response.body)
    first_match = body["data"].first
    kickoff_time = first_match["kickoffTime"]

    # ISO 8601 format: ends with Z (UTC)
    assert_match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/, kickoff_time)
  end

  test "GET /api/v1/matches serializes null fields as null" do
    post api_v1_sessions_url, params: { nickname: "admin", password: "secret123" }, as: :json
    assert_response :success

    get api_v1_matches_url, as: :json
    assert_response :success

    body = JSON.parse(response.body)
    # Find the 'upcoming' fixture which has no odds or scores
    upcoming = body["data"].find { |m| m["homeTeam"] == "USA" && m["awayTeam"] == "Mexico" }
    assert upcoming, "Expected to find USA vs Mexico match"

    assert_nil upcoming["homeScore"]
    assert_nil upcoming["awayScore"]
    assert_nil upcoming["oddsHome"]
    assert_nil upcoming["oddsDraw"]
    assert_nil upcoming["oddsAway"]
  end

  test "no POST/PUT/DELETE routes exist for matches" do
    assert_raises(ActionController::RoutingError) do
      Rails.application.routes.recognize_path("/api/v1/matches", method: :post)
    end

    assert_raises(ActionController::RoutingError) do
      Rails.application.routes.recognize_path("/api/v1/matches/1", method: :put)
    end

    assert_raises(ActionController::RoutingError) do
      Rails.application.routes.recognize_path("/api/v1/matches/1", method: :delete)
    end
  end
end
