require "test_helper"

class Api::V1::MeControllerTest < ActionDispatch::IntegrationTest
  test "show returns user data when authenticated" do
    post api_v1_sessions_url, params: { nickname: "tomek", password: "secret123" }, as: :json
    assert_response :ok

    get api_v1_me_url, as: :json
    assert_response :ok

    json = JSON.parse(response.body)
    assert_equal users(:player).id, json["data"]["id"]
    assert_equal "tomek", json["data"]["nickname"]
    assert_equal false, json["data"]["admin"]
  end

  test "show returns 401 when not authenticated" do
    get api_v1_me_url, as: :json
    assert_response :unauthorized

    json = JSON.parse(response.body)
    assert_equal "UNAUTHORIZED", json["error"]["code"]
    assert_equal "Not logged in", json["error"]["message"]
    assert_nil json["error"]["field"]
  end

  test "show does not expose password_digest" do
    post api_v1_sessions_url, params: { nickname: "tomek", password: "secret123" }, as: :json
    get api_v1_me_url, as: :json
    assert_response :ok

    body = response.body
    assert_not body.include?("password_digest")
    assert_not body.include?("passwordDigest")
  end

  test "show returns admin flag for admin user" do
    post api_v1_sessions_url, params: { nickname: "admin", password: "password" }, as: :json
    get api_v1_me_url, as: :json
    assert_response :ok

    json = JSON.parse(response.body)
    assert_equal true, json["data"]["admin"]
  end
end
