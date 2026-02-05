require "test_helper"

class Api::V1::SessionsControllerTest < ActionDispatch::IntegrationTest
  test "create with valid credentials returns user data and sets session" do
    post api_v1_sessions_url, params: { nickname: "tomek", password: "secret123" }, as: :json
    assert_response :ok

    json = JSON.parse(response.body)
    assert_equal users(:player).id, json["data"]["id"]
    assert_equal "tomek", json["data"]["nickname"]
    assert_equal false, json["data"]["admin"]
    assert_nil json["data"]["passwordDigest"]
  end

  test "create with valid credentials is case-insensitive" do
    post api_v1_sessions_url, params: { nickname: "Tomek", password: "secret123" }, as: :json
    assert_response :ok

    json = JSON.parse(response.body)
    assert_equal "tomek", json["data"]["nickname"]
  end

  test "create with wrong password returns 401 with generic error" do
    post api_v1_sessions_url, params: { nickname: "tomek", password: "wrong" }, as: :json
    assert_response :unauthorized

    json = JSON.parse(response.body)
    assert_equal "INVALID_CREDENTIALS", json["error"]["code"]
    assert_equal "Incorrect nickname or password", json["error"]["message"]
    assert_nil json["error"]["field"]
  end

  test "create with non-existent user returns 401 with same error as wrong password" do
    post api_v1_sessions_url, params: { nickname: "nobody", password: "password" }, as: :json
    assert_response :unauthorized

    json = JSON.parse(response.body)
    assert_equal "INVALID_CREDENTIALS", json["error"]["code"]
    assert_equal "Incorrect nickname or password", json["error"]["message"]
  end

  test "create with inactive user returns 401" do
    post api_v1_sessions_url, params: { nickname: "newuser", password: "password" }, as: :json
    assert_response :unauthorized

    json = JSON.parse(response.body)
    assert_equal "INVALID_CREDENTIALS", json["error"]["code"]
    assert_equal "Incorrect nickname or password", json["error"]["message"]
  end

  test "destroy clears session and subsequent me request returns 401" do
    post api_v1_sessions_url, params: { nickname: "tomek", password: "secret123" }, as: :json
    assert_response :ok

    delete api_v1_sessions_url, as: :json
    assert_response :no_content

    get api_v1_me_url, as: :json
    assert_response :unauthorized
  end

  test "session cookie is set on login" do
    post api_v1_sessions_url, params: { nickname: "tomek", password: "secret123" }, as: :json
    assert_response :ok
    assert response.cookies.present? || session[:user_id].present?
  end

  test "password_digest is never exposed in login response" do
    post api_v1_sessions_url, params: { nickname: "tomek", password: "secret123" }, as: :json
    assert_response :ok

    body = response.body
    assert_not body.include?("password_digest")
    assert_not body.include?("passwordDigest")
  end

  test "create with empty nickname returns 401" do
    post api_v1_sessions_url, params: { nickname: "", password: "password" }, as: :json
    assert_response :unauthorized

    json = JSON.parse(response.body)
    assert_equal "INVALID_CREDENTIALS", json["error"]["code"]
  end

  test "create with empty password returns 401" do
    post api_v1_sessions_url, params: { nickname: "tomek", password: "" }, as: :json
    assert_response :unauthorized

    json = JSON.parse(response.body)
    assert_equal "INVALID_CREDENTIALS", json["error"]["code"]
  end

  test "create with missing credentials returns 401" do
    post api_v1_sessions_url, params: {}, as: :json
    assert_response :unauthorized

    json = JSON.parse(response.body)
    assert_equal "INVALID_CREDENTIALS", json["error"]["code"]
  end
end
